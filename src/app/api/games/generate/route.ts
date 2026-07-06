import { NextRequest, NextResponse } from 'next/server';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { prisma } from '@/lib/tables/db/prisma';
import {
  GameSubmissionSchema,
  type GameSubmission,
  generateUniqueSlug,
  withTimeout,
  generateWithRetry,
  buildEnhancedGamePrompt,
  extractHTMLFromResponse,
  validateGeneratedCode,
  analyzeGameplayMechanics,
  buildIterationFeedbackPrompt,
  buildGraphicsEnhancementPrompt,
  generatePlaceholderAssets,
  moderateContent,
  checkRateLimit,
  AI_GENERATION_TIMEOUT_MS,
  GRAPHICS_ENHANCEMENT_TIMEOUT_MS,
} from '@/lib/games/generator';

const ESTIMATED_GENERATION_TIME_SECONDS = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submission = GameSubmissionSchema.parse(body);

    const moderation = await moderateContent(submission);
    if (!moderation.approved) {
      return NextResponse.json(
        { error: moderation.reason || 'Submission contains inappropriate content' },
        { status: 400 }
      );
    }

    const canSubmit = await checkRateLimit(submission.creatorEmail);
    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Too many submissions today. Please try again tomorrow!' },
        { status: 429 }
      );
    }

    const submissionId = crypto.randomUUID();
    const gameSlug = await generateUniqueSlug(submission.gameTitle);

    await prisma.gameSubmission.create({
      data: {
        id: submissionId,
        status: SubmissionStatus.BUILDING,
        creatorName: submission.creatorName,
        creatorEmail: submission.creatorEmail,
        gameTitle: submission.gameTitle,
        gameDescription: submission.gameDescription,
        gameSlug: gameSlug,
        gameType: submission.gameType,
        difficulty: { overall: submission.difficulty, speed: submission.speed, lives: submission.lives },
        visualStyle: { colors: submission.colors, artStyle: submission.artStyle, background: submission.background },
        controls: { movement: submission.movement, specialAction: submission.specialAction },
        elements: { collectibles: submission.collectibles, hazards: submission.hazards, features: submission.features },
      },
    });

    generateGameAsync(submissionId, gameSlug, submission).catch(error => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Game Generator] CRITICAL: Generation failed for ${submissionId}:`, errorMsg);
      return updateSubmission(submissionId, {
        status: SubmissionStatus.REJECTED,
        reviewNotes: `[FATAL] ${errorMsg}`,
      }).catch(dbError => {
        console.error(`[Game Generator] CRITICAL: Failed to update database for ${submissionId}:`, dbError);
      });
    });

    return NextResponse.json({
      submissionId,
      status: 'building',
      estimatedTime: ESTIMATED_GENERATION_TIME_SECONDS,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
}

async function generateGameAsync(submissionId: string, gameSlug: string, submission: GameSubmission) {
  const startTime = Date.now();
  const prompt = buildEnhancedGamePrompt(gameSlug, submission);

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Game Generator] Starting generation for: ${submissionId}`);

    const { text, usage } = await withTimeout(
      generateWithRetry(prompt),
      AI_GENERATION_TIMEOUT_MS,
      'AI generation timed out after 5 minutes'
    );

    const genTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [Game Generator] Claude responded (${genTime}ms)`);
    console.log('[Game Generator] Tokens used:', usage);

    const generatedCode = extractHTMLFromResponse(text);
    console.log(`[Game Generator] Extracted ${generatedCode.length} bytes of HTML`);

    if (!validateGeneratedCode(generatedCode)) {
      throw new Error('Generated code failed validation');
    }

    console.log('[Game Generator] Code validated, analyzing gameplay mechanics...');
    const issues = analyzeGameplayMechanics(generatedCode);
    const criticalIssues = issues.filter(i => i.severity === 'critical');

    if (criticalIssues.length > 0) {
      console.log(`[Game Generator] Found ${criticalIssues.length} critical gameplay issues, attempting fix...`);
      const feedbackPrompt = buildIterationFeedbackPrompt(prompt, issues);
      const { text: retryText } = await withTimeout(
        generateWithRetry(feedbackPrompt),
        AI_GENERATION_TIMEOUT_MS,
        'Iteration generation timed out'
      );

      const retryCode = extractHTMLFromResponse(retryText);
      const retryIssues = analyzeGameplayMechanics(retryCode);
      const retryProblems = retryIssues.filter(i => i.severity === 'critical');

      if (retryProblems.length === 0 && validateGeneratedCode(retryCode)) {
        console.log('[Game Generator] Second attempt fixed the issues!');
        const assets = generatePlaceholderAssets(submission.gameTitle);
        await updateSubmission(submissionId, {
          status: SubmissionStatus.REVIEW,
          generatedCode: retryCode,
          heroSvg: assets.hero,
          screenshotsSvg: assets.screenshots,
          reviewNotes: `Generated on iteration 2. Issues fixed: ${criticalIssues.map(i => i.issue).join('; ')}`,
        });
        console.log(`[Game Generator] COMPLETE AFTER ITERATION (${Date.now() - startTime}ms)! Status: REVIEW for ${submissionId}`);
        return;
      }
      console.log('[Game Generator] Second attempt still has issues, proceeding with first attempt...');
    }

    console.log('[Game Generator] Gameplay mechanics validated, enhancing graphics...');
    let finalCode = generatedCode;
    try {
      const graphicsPrompt = buildGraphicsEnhancementPrompt(generatedCode, submission);
      const { text: enhancedText } = await withTimeout(
        generateWithRetry(graphicsPrompt),
        GRAPHICS_ENHANCEMENT_TIMEOUT_MS,
        'Graphics enhancement timed out'
      );
      const enhancedCode = extractHTMLFromResponse(enhancedText);

      if (validateGeneratedCode(enhancedCode)) {
        const enhancedProblems = analyzeGameplayMechanics(enhancedCode).filter(i => i.severity === 'critical');
        if (enhancedProblems.length === 0) {
          console.log('[Game Generator] Graphics enhanced successfully');
          finalCode = enhancedCode;
        } else {
          console.log('[Game Generator] Enhanced version had issues, using original');
        }
      } else {
        console.log('[Game Generator] Enhanced version failed validation, using original');
      }
    } catch {
      console.log('[Game Generator] Graphics enhancement failed, using original code');
    }

    const assets = generatePlaceholderAssets(submission.gameTitle);
    await updateSubmission(submissionId, {
      status: SubmissionStatus.REVIEW,
      generatedCode: finalCode,
      heroSvg: assets.hero,
      screenshotsSvg: assets.screenshots,
    });
    console.log(`[${new Date().toISOString()}] [Game Generator] COMPLETE (${Date.now() - startTime}ms total)! Status: REVIEW for ${submissionId}`);
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Game Generator] ERROR after ${totalTime}ms for ${submissionId}: ${errorMsg}`);

    const isTimeout = totalTime > AI_GENERATION_TIMEOUT_MS;
    const reasonPrefix = isTimeout ? '[TIMEOUT] ' : '[ERROR] ';

    try {
      await updateSubmission(submissionId, {
        status: SubmissionStatus.REJECTED,
        reviewNotes: `${reasonPrefix}${errorMsg}\nTime elapsed: ${totalTime}ms`,
      });
    } catch (dbError) {
      console.error(`[Game Generator] CRITICAL: Failed to update database for ${submissionId}:`, dbError);
      console.error('[Game Generator] This submission will be stuck in BUILDING status');
    }
  }
}

// Cron: clean up stale BUILDING submissions.
export async function GET(req: NextRequest) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Cleanup is not configured (CRON_SECRET missing)' }, { status: 503 });
    }
    if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staleThresholdMs = 6 * 60 * 1000;
    const staleTime = new Date(Date.now() - staleThresholdMs);

    const staleSubmissions = await prisma.gameSubmission.findMany({
      where: { status: SubmissionStatus.BUILDING, createdAt: { lt: staleTime } },
      select: { id: true, createdAt: true },
    });

    for (const submission of staleSubmissions) {
      const age = Date.now() - new Date(submission.createdAt).getTime();
      await updateSubmission(submission.id, {
        status: SubmissionStatus.REJECTED,
        reviewNotes: `[TIMEOUT] Generation exceeded 5 minute limit (age: ${age}ms)`,
      });
    }

    return NextResponse.json({ success: true, cleanedCount: staleSubmissions.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Game Generator] Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

async function updateSubmission(id: string, updates: Prisma.GameSubmissionUpdateInput): Promise<void> {
  await prisma.gameSubmission.update({ where: { id }, data: updates });
}
