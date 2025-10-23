import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/tables/db/prisma';
import { SubmissionStatus, GameSubmission } from '@prisma/client';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Constants from main generation route
const MAX_TOKENS = 16000;
const AI_GENERATION_TIMEOUT_MS = 300000; // 5 minutes
const MIN_VALID_CODE_LENGTH = 8000; // Increased to enforce detailed code
const API_RETRY_ATTEMPTS = 3;

// Type for submission result
interface SubmissionResult {
  id: string;
  slug: string;
  status: 'completed' | 'failed';
  error?: string;
}

// Type for gameplay issues
interface GameplayIssue {
  severity: 'critical' | 'warning';
  issue: string;
  fix: string;
}

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
      submissions: [] as SubmissionResult[],
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

        // Analyze gameplay mechanics
        const issues = analyzeGameplayMechanics(generatedCode);
        const criticalIssues = issues.filter(i => i.severity === 'critical');

        let finalCode = generatedCode;
        if (criticalIssues.length > 0) {
          console.log(`[Cron] Found ${criticalIssues.length} critical issues, attempting iteration...`);

          // Build feedback and retry
          const feedback = `${prompt}

===========================================
ITERATION FEEDBACK - FIX THESE ISSUES
===========================================
Critical issues found: ${criticalIssues.map((i, idx) => `${idx + 1}. ${i.issue}: ${i.fix}`).join(' | ')}

This is attempt 2 - FIX these issues now.`;

          try {
            const { text: retryText } = await withTimeout(
              generateWithRetry(feedback),
              AI_GENERATION_TIMEOUT_MS,
              'Iteration timeout'
            );

            const retryCode = extractHTMLFromResponse(retryText);
            const retryIssues = analyzeGameplayMechanics(retryCode);
            const retryProblems = retryIssues.filter(i => i.severity === 'critical');

            if (retryProblems.length === 0 && validateGeneratedCode(retryCode)) {
              console.log(`[Cron] ✓ Iteration fixed the issues for ${submission.id}`);
              finalCode = retryCode;
            } else {
              console.log(`[Cron] Iteration still had issues, using first attempt`);
            }
          } catch {
            console.log(`[Cron] Iteration failed, using first attempt`);
          }
        }

        // Graphics enhancement pass
        console.log(`[Cron] Enhancing graphics for ${submission.id}...`);
        let enhancedCode = finalCode;
        try {
          const graphicsPrompt = buildGraphicsEnhancementPrompt(finalCode, submission);
          const { text: enhancedText } = await withTimeout(
            generateWithRetry(graphicsPrompt),
            120000, // 2 min timeout for graphics pass
            'Graphics timeout'
          );

          const candidateCode = extractHTMLFromResponse(enhancedText);
          if (validateGeneratedCode(candidateCode)) {
            const enhancedIssues = analyzeGameplayMechanics(candidateCode);
            if (enhancedIssues.filter(i => i.severity === 'critical').length === 0) {
              enhancedCode = candidateCode;
              console.log(`[Cron] ✓ Graphics enhanced for ${submission.id}`);
            }
          }
        } catch {
          console.log(`[Cron] Graphics enhancement skipped for ${submission.id}`);
        }

        // Generate placeholder assets
        const assets = generatePlaceholderAssets(submission.gameTitle);

        // Update to REVIEW status
        await prisma.gameSubmission.update({
          where: { id: submission.id },
          data: {
            status: SubmissionStatus.REVIEW,
            generatedCode: enhancedCode,
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

// Helper: Build graphics enhancement prompt
function buildGraphicsEnhancementPrompt(gameCode: string, submission: GameSubmission): string {
  // Safe access to JSON fields
  const visualStyle = (submission.visualStyle as Record<string, unknown> | null) || {};
  const artStyle = typeof visualStyle === 'object' && visualStyle !== null && 'artStyle' in visualStyle
    ? String(visualStyle.artStyle)
    : 'cartoon';
  const colors = typeof visualStyle === 'object' && visualStyle !== null && 'colors' in visualStyle
    ? String(visualStyle.colors)
    : 'colorful';

  return `Improve the VISUALS of this complete, working game. Keep all gameplay identical.

Game: "${submission.gameTitle}" | Style: ${artStyle} | Colors: ${colors}

ENHANCE:
1. Sprites with more detail & animation frames
2. Gradients & depth in backgrounds
3. Particle effect variety
4. Color palette refinement
5. Shadows/glows and visual polish

KEEP IDENTICAL:
- Game logic, mechanics, collision detection
- Score/lives systems, player movement
- All event handlers and functions

Return complete HTML (<!DOCTYPE html> to </html>).`;
}

// Helper: Analyze gameplay mechanics for common issues
function analyzeGameplayMechanics(code: string): GameplayIssue[] {
  const issues: GameplayIssue[] = [];

  // Check 1: Player object/variables exist
  const hasPlayerVar = /\bplayer\s*=|let\s+player|const\s+player|var\s+player/.test(code);
  const hasPlayerXY = /player\s*\.x|player\s*\.y|playerX|playerY/.test(code);

  if (!hasPlayerVar || !hasPlayerXY) {
    issues.push({
      severity: 'critical',
      issue: 'Missing player position tracking',
      fix: 'Create player object with x, y properties'
    });
  }

  // Check 2: Hazards array
  const hasHazardArray = /\bhazards\s*=\s*\[|let\s+hazards|const\s+hazards/.test(code);
  if (!hasHazardArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing hazards array',
      fix: 'Create: const hazards = [];'
    });
  }

  // Check 3: Collectibles array
  const hasCollectArray = /\bcollectibles\s*=\s*\[|let\s+collectibles|const\s+collectibles/.test(code);
  if (!hasCollectArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collectibles array',
      fix: 'Create: const collectibles = [];'
    });
  }

  // Check 4: Collision detection
  const hasDistance = /hypot|sqrt|pow|distance|collision/.test(code);
  const hasCollisionCheck = /if\s*\(.*distance|if\s*\(.*collision|if\s*\(.*dx.*dy/.test(code);

  if (!hasDistance || !hasCollisionCheck) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collision detection',
      fix: 'Add: if (Math.hypot(dx, dy) < hitbox) { ... }'
    });
  }

  // Check 5: Score increment
  const scoreIncrement = /score\s*\+=|score\s*=\s*score\s*\+|points\s*\+=/.test(code);
  if (!scoreIncrement) {
    issues.push({
      severity: 'critical',
      issue: 'Score does not increase',
      fix: 'Add: score += 10 on collectible hit'
    });
  }

  // Check 6: Lives decrement
  const livesDecrement = /lives\s*--|-=|lives\s*=\s*lives\s*-/.test(code);
  if (!livesDecrement) {
    issues.push({
      severity: 'critical',
      issue: 'Lives do not decrease',
      fix: 'Add: lives-- on hazard hit'
    });
  }

  return issues;
}

// 80s Arcade Flavor - Simple version for cron job
function getArcadeFlavorForType(gameType: string): string {
  const arcadePatterns: Record<string, string> = {
    'space': 'Space Invaders-style waves with formations, 50-100 point scoring, escalating speeds',
    'runner': 'Obstacle avoidance with progressive difficulty, distance-based scoring, predictable patterns',
    'puzzle': 'Progressive puzzle complexity, level-based advancement, time bonuses',
    'racing': 'Traffic/obstacle patterns with escalating density, distance/overtake scoring',
    'shooter': 'Enemy formations, wave progression, multiplier chains on kills',
    'flying': 'Obstacle patterns with altitude stages, avoidance scoring, escalation',
    'collecting': 'Collection loops with pursuing enemies, Pac-Man-like ghost patterns',
    'fighting': 'Wave-based opponent battles, combo scoring, escalating difficulty',
    'strategy': 'Escalating AI strategies, turn-based progression, objective scoring'
  };
  return arcadePatterns[gameType] || arcadePatterns['space'];
}

// Helper functions (copied from main generation route)
function buildGamePrompt(submission: GameSubmission): string {
  // Safe access to JSON fields with explicit type assertions
  const difficulty = (submission.difficulty as Record<string, unknown> | null) || {};
  const visualStyle = (submission.visualStyle as Record<string, unknown> | null) || {};
  const controls = (submission.controls as Record<string, unknown> | null) || {};

  // Extract values with safe fallbacks
  const difficultyOverall = typeof difficulty === 'object' && difficulty !== null && 'overall' in difficulty ? Number(difficulty.overall) || 3 : 3;
  const difficultySpeed = typeof difficulty === 'object' && difficulty !== null && 'speed' in difficulty ? Number(difficulty.speed) || 3 : 3;
  const lives = typeof difficulty === 'object' && difficulty !== null && 'lives' in difficulty ? Number(difficulty.lives) || 3 : 3;
  const colors = typeof visualStyle === 'object' && visualStyle !== null && 'colors' in visualStyle ? String(visualStyle.colors) : 'colorful';
  const artStyle = typeof visualStyle === 'object' && visualStyle !== null && 'artStyle' in visualStyle ? String(visualStyle.artStyle) : 'cartoon';
  const background = typeof visualStyle === 'object' && visualStyle !== null && 'background' in visualStyle ? String(visualStyle.background) : 'space';
  const movement = typeof controls === 'object' && controls !== null && 'movement' in controls ? String(controls.movement) : 'four-way';
  const specialAction = typeof controls === 'object' && controls !== null && 'specialAction' in controls ? String(controls.specialAction) : 'shoot';

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

DIFFICULTY: ${difficultyOverall}/5
SPEED: ${difficultySpeed}/5

VISUAL STYLE:
- Colors: ${colors}
- Art: ${artStyle}
- Background: ${background}

CONTROLS:
- Movement: ${movement}
- Action: ${specialAction}

80S ARCADE FLAVOR (Your Choices Respected):
Game Type Pattern: ${getArcadeFlavorForType(submission.gameType)}
- Implement wave/level progression
- Score multipliers on combos (1x, 1.5x, 2x)
- Visible progression counter (waves, levels, distance)
- Escalating difficulty: +5-10% per wave
- First 30s very easy, then ramp difficulty
- Arcade-style point values: 10, 25, 50, 100, 500, 1000
- Lives counter visible (${lives} lives)
- Clear visual feedback on every action

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

function generatePlaceholderAssets(title: string): { hero: string; screenshots: string[] } {
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
