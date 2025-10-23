import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { prisma } from '@/lib/tables/db/prisma';

// Constants
// Rate limit: submissions per day per email address
// Set to 50 for testing/development, reduce to 3 for production
const RATE_LIMIT_PER_DAY = 50;
const MAX_TOKENS = 16000;
const ESTIMATED_GENERATION_TIME_SECONDS = 300;
const AI_GENERATION_TIMEOUT_MS = 300000; // 5 minutes
const MIN_VALID_CODE_LENGTH = 5000;
const API_RETRY_ATTEMPTS = 3;

// Validation schema
const GameSubmissionSchema = z.object({
  gameType: z.enum(['space', 'runner', 'puzzle', 'racing', 'shooter', 'flying', 'collecting', 'fighting', 'strategy']),
  difficulty: z.number().min(1).max(5),
  speed: z.number().min(1).max(5),
  lives: z.number(),
  colors: z.enum(['colorful', 'dark-neon', 'bright', 'retro']),
  artStyle: z.enum(['geometric', 'cartoon', 'pixel', 'fancy']),
  background: z.enum(['space', 'city', 'forest', 'ocean', 'sky']),
  movement: z.enum(['left-right', 'four-way', 'mouse', 'auto-move']),
  specialAction: z.enum(['none', 'shoot', 'jump', 'powerup']),
  collectibles: z.array(z.string()),
  hazards: z.array(z.string()),
  features: z.array(z.string()),
  gameTitle: z.string().min(1).max(30),
  gameDescription: z.string().min(1).max(300),
  creatorName: z.string().min(1).max(30),
  creatorEmail: z.string().email(),
});

type GameSubmission = z.infer<typeof GameSubmissionSchema>;

// Helper: Generate unique slug with collision handling
async function generateUniqueSlug(title: string): Promise<string> {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Limit slug length
  if (baseSlug.length > 40) {
    baseSlug = baseSlug.substring(0, 40).replace(/-$/, '');
  }

  let attempt = 0;
  while (attempt < 100) { // Prevent infinite loop
    const testSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    const existing = await prisma.gameSubmission.findUnique({
      where: { gameSlug: testSlug },
      select: { id: true }
    });

    if (!existing) {
      return testSlug;
    }
    attempt++;
  }

  // Fallback to UUID-based slug
  return `${baseSlug}-${crypto.randomUUID().substring(0, 8)}`;
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const submission = GameSubmissionSchema.parse(body);
    
    // AI-powered content moderation
    const moderation = await moderateContent(submission);
    if (!moderation.approved) {
      return NextResponse.json(
        { error: moderation.reason || 'Submission contains inappropriate content' },
        { status: 400 }
      );
    }
    
    // Rate limiting (check per email)
    const canSubmit = await checkRateLimit(submission.creatorEmail);
    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Too many submissions today. Please try again tomorrow!' },
        { status: 429 }
      );
    }
    
    // Generate submission ID and unique slug
    const submissionId = crypto.randomUUID();
    const gameSlug = await generateUniqueSlug(submission.gameTitle);

    // Save to database (building status)
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
        difficulty: {
          overall: submission.difficulty,
          speed: submission.speed,
          lives: submission.lives
        },
        visualStyle: {
          colors: submission.colors,
          artStyle: submission.artStyle,
          background: submission.background
        },
        controls: {
          movement: submission.movement,
          specialAction: submission.specialAction
        },
        elements: {
          collectibles: submission.collectibles,
          hazards: submission.hazards,
          features: submission.features
        }
      }
    });
    
    // Start async generation (don't await)
    // Fire and forget with comprehensive error handling
    generateGameAsync(submissionId, gameSlug, submission)
      .catch(error => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Game Generator] CRITICAL: Generation failed for ${submissionId}:`, errorMsg);
        // Attempt to update database with error
        return updateSubmission(submissionId, {
          status: SubmissionStatus.REJECTED,
          reviewNotes: `[FATAL] ${errorMsg}`
        }).catch(dbError => {
          console.error(`[Game Generator] CRITICAL: Failed to update database for ${submissionId}:`, dbError);
        });
      });

    // Return immediately
    return NextResponse.json({
      submissionId,
      status: 'building',
      estimatedTime: ESTIMATED_GENERATION_TIME_SECONDS
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Invalid submission' },
      { status: 400 }
    );
  }
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
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = 1000 * Math.pow(2, attempt);
      console.log(`[Game Generator] Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('All retry attempts failed');
}

async function generateGameAsync(
  submissionId: string,
  gameSlug: string,
  submission: GameSubmission
) {
  const startTime = Date.now();

  // Build the prompt with strict requirements for functional output
  const prompt = buildEnhancedGamePrompt(gameSlug, submission);

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Game Generator] ✓ Starting generation for: ${submissionId}`);

    // Call Claude Haiku 4.5 with timeout and retry logic
    const { text, usage } = await withTimeout(
      generateWithRetry(prompt),
      AI_GENERATION_TIMEOUT_MS,
      'AI generation timed out after 5 minutes'
    );

    const genTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [Game Generator] ✓ Claude responded (${genTime}ms)`);
    console.log('[Game Generator] Tokens used:', usage);

    // Extract HTML code from response
    const generatedCode = extractHTMLFromResponse(text);
    console.log(`[Game Generator] Extracted ${generatedCode.length} bytes of HTML`);

    // Validate the generated code
    if (!validateGeneratedCode(generatedCode)) {
      throw new Error('Generated code failed validation');
    }

    console.log('[Game Generator] ✓ Code validated, generating assets...');

    // Generate placeholder assets
    const assets = generatePlaceholderAssets(submission.gameTitle);

    // Save generated content
    await updateSubmission(submissionId, {
      status: SubmissionStatus.REVIEW,
      generatedCode,
      heroSvg: assets.hero,
      screenshotsSvg: assets.screenshots,
    });

    const totalTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [Game Generator] ✓✓✓ COMPLETE (${totalTime}ms total)! Status: REVIEW for ${submissionId}`);

    // TODO: Notify admin via email
    // await notifyAdmin(submissionId, submission, gameSlug);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [Game Generator] ✗ ERROR after ${totalTime}ms for ${submissionId}:`);
    console.error(`[Game Generator] Message: ${errorMsg}`);
    console.error(`[Game Generator] Stack:`, error instanceof Error ? error.stack : 'N/A');

    // Determine if it was a timeout
    const isTimeout = totalTime > AI_GENERATION_TIMEOUT_MS;
    const reasonPrefix = isTimeout ? '[TIMEOUT] ' : '[ERROR] ';

    try {
      await updateSubmission(submissionId, {
        status: SubmissionStatus.REJECTED,
        reviewNotes: `${reasonPrefix}${errorMsg}\nTime elapsed: ${totalTime}ms`
      });
      console.error(`[Game Generator] ✓ Error recorded in database for ${submissionId}`);
    } catch (dbError) {
      console.error(`[Game Generator] ✗✗✗ CRITICAL: Failed to update database for ${submissionId}:`, dbError);
      console.error('[Game Generator] This submission will be stuck in BUILDING status');
    }
  }
}

// Monitor function to clean up stale submissions (run periodically)
export async function GET() {
  try {
    // This endpoint checks for stale BUILDING submissions and marks them as REJECTED
    // Can be called by a cron job or scheduled task

    const staleThresholdMs = 6 * 60 * 1000; // 6 minutes
    const staleTime = new Date(Date.now() - staleThresholdMs);

    const staleSubmissions = await prisma.gameSubmission.findMany({
      where: {
        status: SubmissionStatus.BUILDING,
        createdAt: { lt: staleTime }
      },
      select: { id: true, createdAt: true }
    });

    if (staleSubmissions.length > 0) {
      console.log(`[Game Generator] Found ${staleSubmissions.length} stale submissions`);

      for (const submission of staleSubmissions) {
        const age = Date.now() - new Date(submission.createdAt).getTime();
        console.log(`[Game Generator] Marking ${submission.id} as REJECTED (age: ${age}ms)`);
        await updateSubmission(submission.id, {
          status: SubmissionStatus.REJECTED,
          reviewNotes: `[TIMEOUT] Generation exceeded 5 minute limit (age: ${age}ms)`
        });
      }
    }

    return NextResponse.json({
      success: true,
      cleanedCount: staleSubmissions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Game Generator] Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

function buildEnhancedGamePrompt(gameSlug: string, submission: GameSubmission): string {
  return `You are creating a complete, production-ready HTML5 game for Games Inc Jr. This game MUST work perfectly with ZERO manual fixes required.

CRITICAL: Use the standard Games Inc Jr template structure shown below.

===========================================
GAME IDENTITY
===========================================
- Title: "${submission.gameTitle}"
- Slug: ${gameSlug}
- Description: "${submission.gameDescription}"
- Creator: ${submission.creatorName}
- Type: ${submission.gameType}

===========================================
MANDATORY TEMPLATE STRUCTURE
===========================================
Your game MUST follow this EXACT structure:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>${submission.gameTitle} - Games Inc Jr</title>
    <style>
        /* RESET & BASE */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
            color: #ffffff;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            touch-action: none;
        }

        /* CANVAS */
        #gameCanvas {
            border: 2px solid #00ffff;
            background: #1a1a2e;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            display: block;
            max-width: 100%;
            max-height: 100%;
        }

        /* UI OVERLAY */
        .ui-overlay {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 255, 0.3);
            font-size: 14px;
            z-index: 100;
        }

        /* MOBILE CONTROLS */
        .mobile-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            gap: 12px;
            z-index: 100;
        }
        .mobile-controls button {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            border: 2px solid #00ffff;
            background: rgba(0, 100, 150, 0.8);
            color: #ffffff;
            font-size: 24px;
            cursor: pointer;
            touch-action: manipulation;
        }
        @media (hover: none) and (pointer: coarse) {
            .mobile-controls { display: flex; }
        }

        /* MODAL OVERLAYS */
        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .overlay.hidden { display: none; }
        .modal {
            background: linear-gradient(135deg, #1a2a4e, #0f1a3a);
            padding: 40px;
            border-radius: 15px;
            border: 3px solid #00ffff;
            text-align: center;
            max-width: 600px;
        }
        .modal h2 { color: #00ffff; margin: 0 0 20px; font-size: 32px; }
        .modal button {
            padding: 14px 28px;
            font-size: 18px;
            color: #ffffff;
            background: linear-gradient(135deg, #00ffff, #0088aa);
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="tryOverlay" class="overlay">
        <div class="modal">
            <h2>${submission.gameTitle}</h2>
            <p>${submission.gameDescription}</p>
            <button id="tryBtn">Try Now</button>
        </div>
    </div>

    <div id="startOverlay" class="overlay hidden">
        <div class="modal">
            <h2>How to Play</h2>
            <p><strong>Goal:</strong> [Write clear goal]</p>
            <p><strong>Controls:</strong> [List controls based on movement type]</p>
            <button id="startBtn">Start Game</button>
        </div>
    </div>

    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <div class="ui-overlay">
        <div class="stat">Score: <span id="score">0</span></div>
        <div class="stat">Lives: <span id="lives">${submission.lives === 999 ? '∞' : submission.lives}</span></div>
    </div>

    <div class="mobile-controls">
        [Add buttons based on movement type]
    </div>

    <script>
        // IMPLEMENT COMPLETE GAME HERE
        // Follow the requirements below...
    </script>
</body>
</html>

===========================================
GAME REQUIREMENTS (Age 10 Players)
===========================================
✅ Complete single-file HTML with embedded CSS and JavaScript
✅ Fun and exciting for 10-year-olds
✅ Animated sprites with 3+ frames (NOT static rectangles)
✅ Particle effects on collect, damage, death
✅ Sound effects using Web Audio API (simple beeps/tones)
✅ Smooth 60 FPS gameplay
✅ Forgiving hitboxes (70% of visual size)
✅ Tutorial-easy first 30 seconds (90% success rate)
✅ Both keyboard (WASD + Arrow Keys) and touch controls
✅ localStorage for high scores

DIFFICULTY SETTINGS:
- Overall Difficulty: ${submission.difficulty}/5
- Game Speed: ${submission.speed}/5
- Lives: ${submission.lives === 999 ? 'Infinite (no game over)' : submission.lives}

VISUAL STYLE:
- Color Scheme: ${submission.colors}
- Art Style: ${submission.artStyle}
- Background Theme: ${submission.background}

CONTROLS:
- Movement: ${submission.movement}
  ${submission.movement === 'left-right' ? '  → Left/Right arrows or A/D keys' : ''}
  ${submission.movement === 'four-way' ? '  → Arrow keys or WASD' : ''}
  ${submission.movement === 'mouse' ? '  → Mouse position or touch' : ''}
  ${submission.movement === 'auto-move' ? '  → Auto-movement, player controls actions' : ''}
- Special Action: ${submission.specialAction}
  ${submission.specialAction === 'shoot' ? '  → Spacebar to shoot' : ''}
  ${submission.specialAction === 'jump' ? '  → Spacebar to jump' : ''}
  ${submission.specialAction === 'powerup' ? '  → Spacebar to activate power-up' : ''}

GAME ELEMENTS:
${submission.collectibles.length > 0 ? `- Collectibles: ${submission.collectibles.join(', ')}` : ''}
${submission.hazards.length > 0 ? `- Hazards to Avoid: ${submission.hazards.join(', ')}` : ''}
${submission.features.length > 0 ? `- Special Features: ${submission.features.join(', ')}` : ''}

===========================================
IMPLEMENTATION CHECKLIST
===========================================
1. ✅ Use requestAnimationFrame for game loop
2. ✅ Implement proper collision detection with 70% hitboxes
3. ✅ Add particle system for visual feedback
4. ✅ Create simple Web Audio synth for sounds
5. ✅ Handle both keyboard and touch input
6. ✅ Show "Try Now" overlay on load
7. ✅ Show "How to Play" after Try click
8. ✅ Start game after "Start Game" click
9. ✅ Display score and lives in UI overlay
10. ✅ Save high score to localStorage

===========================================
OUTPUT FORMAT
===========================================
Return ONLY the complete HTML file, nothing else.
Do NOT include markdown code blocks or explanations.
Start with <!DOCTYPE html> and end with </html>.

Create a polished, fun, child-friendly game that works perfectly on first load.`;
}

function extractHTMLFromResponse(text: string): string {
  let html = text;
  
  // Remove markdown code blocks if present
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  
  // Find <!DOCTYPE html> and take everything from there
  const doctypeIndex = html.indexOf('<!DOCTYPE html>');
  if (doctypeIndex !== -1) {
    html = html.substring(doctypeIndex);
  }
  
  // Remove any text after closing </html>
  const htmlEndIndex = html.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    html = html.substring(0, htmlEndIndex + 7);
  }
  
  return html.trim();
}

function validateGeneratedCode(code: string): boolean {
  // Required HTML structure
  if (!code.includes('<!DOCTYPE html>')) {
    console.error('[Validation] Missing DOCTYPE');
    return false;
  }
  if (!code.includes('<canvas')) {
    console.error('[Validation] Missing canvas element');
    return false;
  }

  // Required game loop
  if (!code.includes('requestAnimationFrame')) {
    console.error('[Validation] Missing requestAnimationFrame');
    return false;
  }

  // Check for JavaScript presence (function or arrow function)
  if (!code.includes('function') && !code.includes('=>')) {
    console.error('[Validation] No JavaScript functions found');
    return false;
  }

  // Minimum viable game size
  if (code.length < MIN_VALID_CODE_LENGTH) {
    console.error(`[Validation] Code too short: ${code.length} bytes (min ${MIN_VALID_CODE_LENGTH})`);
    return false;
  }

  // Check for error patterns
  if (code.match(/\b(undefined|null)\s*;/)) {
    console.error('[Validation] Contains undefined/null statements');
    return false;
  }

  // Check for unrendered template variables
  if (code.includes('{{') && code.includes('}}')) {
    console.error('[Validation] Contains unrendered template variables');
    return false;
  }

  // Validate balanced HTML tags for canvas
  const canvasOpen = (code.match(/<canvas/g) || []).length;
  const canvasClose = (code.match(/<\/canvas>/g) || []).length;
  if (canvasOpen !== canvasClose) {
    console.error('[Validation] Unbalanced canvas tags');
    return false;
  }

  console.log('[Validation] ✓ Code passed all validation checks');
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

async function moderateContent(submission: GameSubmission): Promise<{ approved: boolean; reason?: string }> {
  try {
    // AI-powered content moderation with timeout
    const { text } = await withTimeout(
      generateText({
        model: anthropic('claude-haiku-4-5'),
        maxTokens: 200,
        temperature: 0,
        prompt: `You are a content moderator for a children's game platform (ages 8-14).

Review this game submission. Flag ONLY if it contains:
- Graphic violence/gore (beyond cartoon action)
- Sexual content
- Hate speech or discrimination
- Drug references
- Self-harm themes

DO NOT flag: cartoon combat, mild scary themes, competitive gameplay, fantasy weapons, action verbs like "destroy" or "kill" (enemies/aliens/robots)

Game Title: ${submission.gameTitle}
Game Description: ${submission.gameDescription}
Creator Name: ${submission.creatorName}

Respond with JSON only:
{
  "approved": true/false,
  "reason": "brief explanation if rejected, empty string if approved"
}`
      }),
      30000, // 30 second timeout for moderation
      'Moderation timeout'
    );

    // Parse response
    const cleaned = text.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      approved: result.approved === true,
      reason: result.reason || undefined
    };
  } catch (error) {
    console.error('[Moderation] Error:', error);
    // On moderation error/timeout: approve and flag for admin review
    // This prevents false rejections due to service issues
    // Admins will review in the detail dashboard
    console.warn('[Moderation] Approved with warning due to service unavailability');
    return {
      approved: true,
      reason: 'Auto-approved due to moderation service timeout. Admin review recommended.'
    };
  }
}

async function checkRateLimit(email: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.gameSubmission.count({
    where: {
      creatorEmail: email,
      createdAt: { gte: today }
    }
  });

  return count < RATE_LIMIT_PER_DAY;
}

async function updateSubmission(id: string, updates: Prisma.GameSubmissionUpdateInput): Promise<void> {
  await prisma.gameSubmission.update({
    where: { id },
    data: updates
  });
}
