import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { SubmissionStatus } from '@prisma/client';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Constants from main generation route
const MAX_TOKENS = 16000;
const AI_GENERATION_TIMEOUT_MS = 300000; // 5 minutes
const MIN_VALID_CODE_LENGTH = 5000;
const API_RETRY_ATTEMPTS = 3;

// Helper: Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

// Helper: Retry API calls with exponential backoff
async function generateWithRetry(prompt: string, maxRetries = API_RETRY_ATTEMPTS) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: anthropic('claude-haiku-4-5', {
          cacheControl: true,
        }),
        maxTokens: MAX_TOKENS,
        temperature: 1.0,
        prompt: prompt,
      });
      return result;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delayMs = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('All retry attempts failed');
}

// This cron job processes pending game submissions
// Call it periodically (e.g., every minute) from vercel.json
export async function GET(request: NextRequest) {
  try {
    // Verify it's actually a cron call (optional: check Authorization header)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting game generation processor...');

    // Find submissions that are in BUILDING status
    const buildingSubmissions = await prisma.gameSubmission.findMany({
      where: { status: SubmissionStatus.BUILDING },
      take: 5, // Process max 5 at a time to avoid timeout
    });

    console.log(`[Cron] Found ${buildingSubmissions.length} submissions to process`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      submissions: [] as any[],
    };

    for (const submission of buildingSubmissions) {
      try {
        console.log(`[Cron] Processing: ${submission.id} (${submission.gameSlug})`);
        results.processed++;

        // Build prompt (from game generation route)
        const prompt = buildGamePrompt(submission);

        // Generate with timeout
        const { text } = await withTimeout(
          generateWithRetry(prompt),
          AI_GENERATION_TIMEOUT_MS,
          'Generation timeout'
        );

        console.log(`[Cron] Generated code for ${submission.id}`);

        // Extract and validate code
        const generatedCode = extractHTMLFromResponse(text);
        if (!validateGeneratedCode(generatedCode)) {
          throw new Error('Generated code failed validation');
        }

        // Generate placeholder assets
        const assets = generatePlaceholderAssets(submission.gameTitle);

        // Update to REVIEW status
        await prisma.gameSubmission.update({
          where: { id: submission.id },
          data: {
            status: SubmissionStatus.REVIEW,
            generatedCode,
            heroSvg: assets.hero,
            screenshotsSvg: assets.screenshots,
          },
        });

        console.log(`[Cron] ✓ Complete: ${submission.id} → REVIEW`);
        results.succeeded++;
        results.submissions.push({
          id: submission.id,
          slug: submission.gameSlug,
          status: 'completed',
        });

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Cron] ✗ Failed for ${submission.id}: ${errorMsg}`);

        // Mark as rejected with error message
        await prisma.gameSubmission.update({
          where: { id: submission.id },
          data: {
            status: SubmissionStatus.REJECTED,
            reviewNotes: `[GENERATION_ERROR] ${errorMsg}`,
          },
        });

        results.submissions.push({
          id: submission.id,
          slug: submission.gameSlug,
          status: 'failed',
          error: errorMsg,
        });
      }
    }

    console.log(
      `[Cron] Done: ${results.succeeded} succeeded, ${results.failed} failed`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('[Cron] Critical error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions (copied from main generation route)
function buildGamePrompt(submission: any): string {
  return `You are creating a complete, production-ready HTML5 game for Games Inc Jr.

GAME IDENTITY
- Title: "${submission.gameTitle}"
- Slug: ${submission.gameSlug}
- Description: "${submission.gameDescription}"
- Type: ${submission.gameType}

MANDATORY: Must be complete single-file HTML with embedded CSS and JavaScript.

REQUIREMENTS:
✅ Complete working game code
✅ Animated sprites (3+ frames, NOT static rectangles)
✅ Particle effects on collect/damage/death
✅ Sound effects using Web Audio API
✅ Smooth 60 FPS gameplay
✅ Forgiving hitboxes (70% of visual size)
✅ Both keyboard and touch controls
✅ localStorage for high scores
✅ First 30s tutorial-easy (90% success rate)

DIFFICULTY: ${submission.difficulty?.overall || 3}/5
SPEED: ${submission.difficulty?.speed || 3}/5

VISUAL STYLE:
- Colors: ${submission.visualStyle?.colors || 'colorful'}
- Art: ${submission.visualStyle?.artStyle || 'cartoon'}
- Background: ${submission.visualStyle?.background || 'space'}

CONTROLS:
- Movement: ${submission.controls?.movement || 'four-way'}
- Action: ${submission.controls?.specialAction || 'shoot'}

OUTPUT: Return ONLY the complete HTML file, nothing else.
Start with <!DOCTYPE html> and end with </html>`;
}

function extractHTMLFromResponse(text: string): string {
  let html = text;
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  const doctypeIndex = html.indexOf('<!DOCTYPE html>');
  if (doctypeIndex !== -1) {
    html = html.substring(doctypeIndex);
  }
  const htmlEndIndex = html.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    html = html.substring(0, htmlEndIndex + 7);
  }
  return html.trim();
}

function validateGeneratedCode(code: string): boolean {
  if (!code.includes('<!DOCTYPE html>')) return false;
  if (!code.includes('<canvas')) return false;
  if (!code.includes('requestAnimationFrame')) return false;
  if (!code.includes('function') && !code.includes('=>')) return false;
  if (code.length < MIN_VALID_CODE_LENGTH) return false;
  return true;
}

function generatePlaceholderAssets(title: string) {
  const hero = `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="450" fill="#1a237e"/>
    <text x="400" y="225" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#fff">
      ${title}
    </text>
  </svg>`;

  return {
    hero,
    screenshots: [hero, hero]
  };
}
