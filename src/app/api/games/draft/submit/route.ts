import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SubmissionStatus } from '@prisma/client';
import { prisma } from '@/lib/tables/db/prisma';
import {
  DraftBriefSchema,
  generateUniqueSlug,
  generatePlaceholderAssets,
  validateGeneratedCode,
  moderateContent,
  checkRateLimit,
} from '@/lib/games/generator';

const SubmitSchema = DraftBriefSchema.extend({
  code: z.string().min(100),
  iterationCount: z.number().int().min(0).max(50).default(0),
});

// Finalizes an already-built, already-playtested draft into the normal admin
// review pipeline. No async generation here — the game exists and was
// already validated by /api/games/draft — this just moderates one more time
// (final safety net, since the code + brief have now been seen by a real
// person and may have been revised) and creates the GameSubmission row
// directly at REVIEW status.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submission = SubmitSchema.parse(body);

    if (!validateGeneratedCode(submission.code)) {
      return NextResponse.json({ error: 'Your game draft looks broken — please rebuild it before submitting.' }, { status: 400 });
    }

    const moderation = await moderateContent(submission);
    if (!moderation.approved) {
      return NextResponse.json({ error: moderation.reason || 'Submission contains inappropriate content' }, { status: 400 });
    }

    const canSubmit = await checkRateLimit(submission.creatorEmail);
    if (!canSubmit) {
      return NextResponse.json({ error: 'Too many submissions today. Please try again tomorrow!' }, { status: 429 });
    }

    const submissionId = crypto.randomUUID();
    const gameSlug = await generateUniqueSlug(submission.gameTitle);
    const assets = generatePlaceholderAssets(submission.gameTitle);

    await prisma.gameSubmission.create({
      data: {
        id: submissionId,
        status: SubmissionStatus.REVIEW,
        creatorName: submission.creatorName,
        creatorEmail: submission.creatorEmail,
        gameTitle: submission.gameTitle,
        gameDescription: submission.gameDescription,
        gameSlug,
        gameType: submission.gameType,
        difficulty: { overall: submission.difficulty, speed: submission.speed, lives: submission.lives },
        visualStyle: { colors: submission.colors, artStyle: submission.artStyle, background: submission.background },
        controls: { movement: submission.movement, specialAction: submission.specialAction },
        elements: { collectibles: submission.collectibles, hazards: submission.hazards, features: submission.features },
        generatedCode: submission.code,
        heroSvg: assets.hero,
        screenshotsSvg: assets.screenshots,
        reviewNotes: `Guided brief — Second verb: "${submission.secondVerb}". Twist: "${submission.twist}". ` +
          `Playtested and revised ${submission.iterationCount} time(s) by the creator before submitting.`,
      },
    });

    return NextResponse.json({ submissionId, status: 'review' });
  } catch (error) {
    console.error('[Draft Submit] Error:', error);
    return NextResponse.json({ error: 'Could not submit your game right now. Please try again.' }, { status: 500 });
  }
}
