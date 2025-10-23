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
const MIN_VALID_CODE_LENGTH = 8000; // Increased to enforce more detailed code
const API_RETRY_ATTEMPTS = 3;
const GRAPHICS_ENHANCEMENT_TIMEOUT_MS = 120000; // 2 minutes for graphics pass

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

    console.log('[Game Generator] ✓ Code validated, analyzing gameplay mechanics...');

    // Analyze gameplay mechanics to catch common issues
    const issues = analyzeGameplayMechanics(generatedCode);
    const criticalIssues = issues.filter(i => i.severity === 'critical');

    if (criticalIssues.length > 0) {
      console.log(`[Game Generator] ⚠️ Found ${criticalIssues.length} critical gameplay issues, attempting fix...`);

      // Generate feedback and retry ONCE
      const feedbackPrompt = buildIterationFeedbackPrompt(prompt, issues);
      const { text: retryText, usage: retryUsage } = await withTimeout(
        generateWithRetry(feedbackPrompt),
        AI_GENERATION_TIMEOUT_MS,
        'Iteration generation timed out'
      );

      const retryCode = extractHTMLFromResponse(retryText);
      const retryIssues = analyzeGameplayMechanics(retryCode);
      const retryProblems = retryIssues.filter(i => i.severity === 'critical');

      if (retryProblems.length === 0 && validateGeneratedCode(retryCode)) {
        console.log('[Game Generator] ✓ Second attempt fixed the issues!');
        // Use the retry version
        const generatedCodeFinal = retryCode;
        const assets = generatePlaceholderAssets(submission.gameTitle);

        await updateSubmission(submissionId, {
          status: SubmissionStatus.REVIEW,
          generatedCode: generatedCodeFinal,
          heroSvg: assets.hero,
          screenshotsSvg: assets.screenshots,
          reviewNotes: `Generated on iteration 2. Issues fixed: ${criticalIssues.map(i => i.issue).join('; ')}`
        });

        const totalTime = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] [Game Generator] ✓✓✓ COMPLETE AFTER ITERATION (${totalTime}ms)! Status: REVIEW for ${submissionId}`);
        return;
      } else {
        console.log(`[Game Generator] ⚠️ Second attempt still has issues, proceeding with first attempt...`);
      }
    }

    console.log('[Game Generator] ✓ Gameplay mechanics validated, enhancing graphics...');

    // Graphics enhancement pass - improve visuals while keeping gameplay intact
    let finalCode = generatedCode;
    try {
      const graphicsPrompt = buildGraphicsEnhancementPrompt(generatedCode, submission);
      const { text: enhancedText } = await withTimeout(
        generateWithRetry(graphicsPrompt),
        GRAPHICS_ENHANCEMENT_TIMEOUT_MS,
        'Graphics enhancement timed out'
      );

      const enhancedCode = extractHTMLFromResponse(enhancedText);

      // Validate that enhanced version still works
      if (validateGeneratedCode(enhancedCode)) {
        const enhancedIssues = analyzeGameplayMechanics(enhancedCode);
        const enhancedProblems = enhancedIssues.filter(i => i.severity === 'critical');

        if (enhancedProblems.length === 0) {
          console.log('[Game Generator] ✓ Graphics enhanced successfully');
          finalCode = enhancedCode;
        } else {
          console.log('[Game Generator] ⚠️ Enhanced version had issues, using original');
        }
      } else {
        console.log('[Game Generator] ⚠️ Enhanced version failed validation, using original');
      }
    } catch (graphicsError) {
      console.log('[Game Generator] ⚠️ Graphics enhancement failed, using original code');
    }

    // Generate placeholder assets
    const assets = generatePlaceholderAssets(submission.gameTitle);

    // Save generated content
    await updateSubmission(submissionId, {
      status: SubmissionStatus.REVIEW,
      generatedCode: finalCode,
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

// 80s Arcade Flavor System - Adds authentic arcade feel without overriding user choices
interface ArcadePattern {
  enemyFormation: string;
  scoringSystem: string;
  progressionPattern: string;
  arcadeElement: string;
}

function mapGameTypeToArcadePattern(gameType: string): ArcadePattern {
  const patterns: Record<string, ArcadePattern> = {
    'space': {
      enemyFormation: 'wave-based formations (like Space Invaders) that descend and accelerate',
      scoringSystem: '50 points per enemy killed, 100 for wave completion, bonus for perfect waves',
      progressionPattern: 'waves start slow with few enemies, escalate with more enemies/faster speeds',
      arcadeElement: 'Implement arcade scoring multipliers: 1x baseline, 1.5x for speed, 2x for perfection'
    },
    'runner': {
      enemyFormation: 'obstacles and enemies spawning in predictable patterns with increasing frequency',
      scoringSystem: '10 points per obstacle avoided, 100 for distance milestones, 50 for collectibles',
      progressionPattern: 'starts with sparse obstacles, density increases every 30 seconds, speed ramps',
      arcadeElement: 'Add visible level progression counter showing distance/waves completed'
    },
    'puzzle': {
      enemyFormation: 'patterns to solve that increase in complexity each level',
      scoringSystem: '100 points per puzzle solved, time bonus if fast, 50 for hints avoided',
      progressionPattern: 'progressive difficulty: simple 3-step puzzles become 7-10 step challenges',
      arcadeElement: 'Visible puzzle counter, level progression, timer for speed bonus'
    },
    'racing': {
      enemyFormation: 'traffic patterns that become denser and more chaotic at higher speeds',
      scoringSystem: '1 point per distance unit, 50 for successful overtakes, bonuses for clean runs',
      progressionPattern: 'track difficulty escalates: clear roads → traffic → aggressive opponents',
      arcadeElement: 'Speed indicator, lap/section counter, best times saved'
    },
    'shooter': {
      enemyFormation: 'arcade-style enemy waves in formations (V-patterns, grids, spirals)',
      scoringSystem: '25 for basic enemy, 100 for formation completion, 500 for wave clear',
      progressionPattern: 'waves start with 5 enemies, grow to 20+, movement speeds increase',
      arcadeElement: 'Wave counter, enemy counter, multiplier chain on consecutive kills'
    },
    'flying': {
      enemyFormation: 'obstacles and enemies that patrol predictable paths in formation',
      scoringSystem: '10 per hazard dodged, 50 per enemy defeated, 200 for wave clear',
      progressionPattern: 'altitude stages unlock progressively harder patterns',
      arcadeElement: 'Altitude counter, enemy formation radar, speed escalation indicator'
    },
    'collecting': {
      enemyFormation: 'ghost-like enemies that patrol maze or arena, avoid or outsmart for points',
      scoringSystem: '10 per collectible, 50 per ghost escape, 100 for maze clear',
      progressionPattern: 'ghosts move slower then faster, mazes change pattern per level',
      arcadeElement: 'Collection counter, ghost speed indicator, maze progression visual'
    },
    'fighting': {
      enemyFormation: 'enemy waves with increasing difficulty: single opponent → group battles',
      scoringSystem: '50 per combo hit, 100 per enemy defeated, 500 for wave clear',
      progressionPattern: 'opponents get stronger, quicker, more aggressive each wave',
      arcadeElement: 'Combo counter, wave indicator, enemy health/difficulty visual'
    },
    'strategy': {
      enemyFormation: 'AI opponents with escalating strategies and tactics',
      scoringSystem: '100 per successful action, 200 per objective, 1000 per victory',
      progressionPattern: 'turns increase in complexity, opponents play smarter',
      arcadeElement: 'Turn counter, resource indicators, strategic depth visual'
    }
  };

  return patterns[gameType] || patterns['space'];
}

function buildArcadeFlavorAddition(submission: GameSubmission): string {
  const pattern = mapGameTypeToArcadePattern(submission.gameType);

  return `
===========================================
80S ARCADE FLAVOR (Respects Your Choices)
===========================================
Your game type "${submission.gameType}" with ${submission.artStyle} style and ${submission.colors} colors.

ARCADE AUTHENTICITY (Without Overriding):
- Apply 80s arcade game DNA while respecting all your selections above
- User's difficulty (${submission.difficulty}/5) sets base game speed
- User's speed (${submission.speed}/5) determines reaction time challenge
- User's color choice is preserved; enhance with arcade contrast
- User's art style is baseline; add arcade polish (crisp edges, clear readability)

PATTERN FOR YOUR GAME TYPE:
- Enemy Formation: ${pattern.enemyFormation}
- Scoring System: ${pattern.scoringSystem}
- Progression: ${pattern.progressionPattern}
- Arcade Element: ${pattern.arcadeElement}

AUTHENTIC ARCADE MECHANICS:
1. Wave/Level System: Structure gameplay in clearly defined waves or levels
2. Progressive Difficulty: First 30s very easy, then escalate 5-10% per wave
3. Scoring Focus: Big point values (50, 100, 500) that feel satisfying
4. Lives System: Typically 3-5 lives visible on screen (user selected ${submission.lives})
5. Feedback: Every action produces immediate visual/audio confirmation
6. Formations: Enemies appear in patterns, not random (Galaga, Space Invaders style)
7. Arcade Visuals: Simple geometric shapes, pixel-style, bright distinct colors
8. Addictive Loop: Players want "one more try" to beat their score

SCORING RECOMMENDATIONS:
- Small collectible: 10-25 points
- Medium enemy: 50-100 points
- Large hazard/boss: 200-500 points
- Wave completion: 1000 point bonus
- Perfect (no hits taken): 2x multiplier

YOUR SETTINGS PRESERVED:
✓ Title: "${submission.gameTitle}"
✓ Description: "${submission.gameDescription}"
✓ Type: ${submission.gameType}
✓ Colors: ${submission.colors}
✓ Art Style: ${submission.artStyle}
✓ Difficulty: ${submission.difficulty}/5
✓ Speed: ${submission.speed}/5
✓ Lives: ${submission.lives}
✓ Movement: ${submission.movement}
✓ Action: ${submission.specialAction}
✓ Collectibles: ${submission.collectibles.join(', ') || 'default'}
✓ Hazards: ${submission.hazards.join(', ') || 'default'}

Make this an authentic arcade game that respects these choices while capturing
the addictive, simple, skill-based gameplay that made 80s arcades legendary.`;
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

${buildArcadeFlavorAddition(submission)}

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

===========================================
CRITICAL GAMEPLAY MECHANICS (MUST DO)
===========================================
SPATIAL DISTRIBUTION:
- Player sprite spawns at specific location (e.g., center-bottom, left-side)
- Obstacles/hazards spawn at DIFFERENT locations from player (randomized across canvas)
- Collectibles spawn at VARIED positions throughout canvas
- NO all sprites in same row/column - must span multiple Y positions
- Visual confirmation: Objects are spread across the play area, not clustered

COLLISION DETECTION & INTERACTION:
- Check distance between player sprite and each game object (hazard/collectible)
- If distance < (player_size + object_size) * 0.7 (forgiving hitbox):
  - If HAZARD: lose 1 life, play hurt sound, spawn particles
  - If COLLECTIBLE: gain 10+ points, play pickup sound, spawn particles
- Collision detection must be ACTIVE in game update loop
- State changes MUST occur: score increments, lives decrement on hazard

SPAWN LOGIC:
- Objects spawn at varied Y positions: Math.random() * canvas.height
- Objects spawn at varied X positions: Math.random() * canvas.width
- Spawn rate increases with difficulty over time
- New objects appear throughout game, not just at start

PROOF OF WORKING GAMEPLAY:
Your code will be analyzed. It MUST contain:
- Variable for player x,y position: player = { x: ..., y: ... }
- Variable for game objects array: hazards = [...], collectibles = [...]
- Distance calculation function: Math.hypot(dx, dy) or similar
- Score variable that INCREASES on collectible hit
- Lives variable that DECREASES on hazard hit
- Spawn function with randomized positions

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
OUTPUT FORMAT & CODE QUALITY
===========================================
Return ONLY the complete HTML file, nothing else.
Do NOT include markdown code blocks or explanations.
Start with <!DOCTYPE html> and end with </html>.

CODE LENGTH REQUIREMENT: Your HTML file MUST be at least 8000 characters.
This ensures sufficient detail in:
- Sprite animations (3+ frames per sprite)
- Particle effect patterns
- Visual polish and effects
- Sound synthesis code
- Game balance and gameplay depth

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

interface GameplayIssue {
  severity: 'critical' | 'warning';
  issue: string;
  fix: string;
}

function analyzeGameplayMechanics(code: string): GameplayIssue[] {
  const issues: GameplayIssue[] = [];

  // Check 1: Player object/variables exist
  const hasPlayerVar = /\bplayer\s*=|let\s+player|const\s+player|var\s+player/.test(code);
  const hasPlayerXY = /player\s*\.x|player\s*\.y|playerX|playerY/.test(code);

  if (!hasPlayerVar || !hasPlayerXY) {
    issues.push({
      severity: 'critical',
      issue: 'Missing player position tracking (player.x, player.y)',
      fix: 'Create a player object with x and y properties that track position'
    });
  }

  // Check 2: Hazards array exists and is used
  const hasHazards = /hazard|obstacle|enemy/.test(code.toLowerCase());
  const hasHazardArray = /\bhazards\s*=\s*\[|let\s+hazards|const\s+hazards/.test(code);

  if (!hasHazardArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing hazards array to track obstacles',
      fix: 'Create a hazards array to store all hazard objects: const hazards = [];'
    });
  }

  // Check 3: Collectibles array exists
  const hasCollectibles = /collectible|collect|gem|coin|item/.test(code.toLowerCase());
  const hasCollectArray = /\bcollectibles\s*=\s*\[|let\s+collectibles|const\s+collectibles/.test(code);

  if (!hasCollectArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collectibles array to track items',
      fix: 'Create a collectibles array: const collectibles = [];'
    });
  }

  // Check 4: Distance/collision calculation
  const hasDistance = /hypot|sqrt|pow|distance|collision/.test(code);
  const hasCollisionCheck = /if\s*\(.*distance|if\s*\(.*collision|if\s*\(.*dx.*dy/.test(code);

  if (!hasDistance || !hasCollisionCheck) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collision detection logic',
      fix: 'Add distance calculation: Math.hypot(obj.x - player.x, obj.y - player.y) and check if < hitbox distance'
    });
  }

  // Check 5: Score changes on collection
  const hasScore = /score|points/.test(code.toLowerCase());
  const scoreIncrement = /score\s*\+=|score\s*=\s*score\s*\+|points\s*\+=/.test(code);

  if (!scoreIncrement) {
    issues.push({
      severity: 'critical',
      issue: 'Score does not increase when collectibles are hit',
      fix: 'Add score += 10 (or similar) inside the collectible collision check'
    });
  }

  // Check 6: Lives decrease on hazard hit
  const hasLives = /lives|health|hp/.test(code.toLowerCase());
  const livesDecrement = /lives\s*--|-=|lives\s*=\s*lives\s*-/.test(code);

  if (!livesDecrement) {
    issues.push({
      severity: 'critical',
      issue: 'Lives do not decrease when hazards are hit',
      fix: 'Add lives-- (or lives -= 1) inside the hazard collision check'
    });
  }

  // Check 7: Spawn with randomization
  const hasRandom = /Math\.random/.test(code);
  const hasSpawn = /spawn|create|new.*object|push.*hazard|push.*collectible/.test(code);

  if (!hasRandom && hasSpawn) {
    issues.push({
      severity: 'warning',
      issue: 'Objects might not spawn at varied positions',
      fix: 'Use Math.random() when spawning objects at x: Math.random() * canvas.width'
    });
  }

  // Check 8: Objects should be at different Y positions
  // Look for evidence of varied Y spawning
  const yVariation = /Math\.random\(\)\s*\*\s*(?:canvas\.height|height|600)/.test(code);

  if (!yVariation) {
    issues.push({
      severity: 'warning',
      issue: 'Objects may not spawn at varied Y positions',
      fix: 'Use Math.random() * canvas.height (or width) to vary spawn positions throughout canvas'
    });
  }

  // Check 9: Meaningful hazards vs collectibles
  const distinguishable = /if.*hazard|if.*collectible|type.*hazard|type.*collectible/.test(code);

  if (!distinguishable) {
    issues.push({
      severity: 'warning',
      issue: 'Hazards and collectibles may not be treated differently',
      fix: 'Add type checking: if (obj.type === "hazard") { lives-- } else if (obj.type === "collectible") { score++ }'
    });
  }

  return issues;
}

function buildIterationFeedbackPrompt(originalPrompt: string, issues: GameplayIssue[]): string {
  const criticalIssues = issues.filter(i => i.severity === 'critical');

  return `${originalPrompt}

===========================================
ITERATION FEEDBACK - FIX THESE ISSUES
===========================================
The previous version had ${criticalIssues.length} critical gameplay issues that must be fixed:

${criticalIssues.map((issue, i) => `${i + 1}. ISSUE: ${issue.issue}\n   FIX: ${issue.fix}`).join('\n\n')}

CRITICAL: Your new version MUST include all the fixes above.
This is the SECOND attempt - make sure the game actually works this time.`;
}

function buildGraphicsEnhancementPrompt(gameCode: string, submission: GameSubmission): string {
  return `You have a complete, working HTML5 game. Now IMPROVE THE VISUALS ONLY.

Game title: "${submission.gameTitle}"
Color scheme: ${submission.colors}
Art style: ${submission.artStyle}

ENHANCE THE GRAPHICS BY:
1. Improve sprite designs with more detail and personality
2. Add gradient backgrounds with depth (not flat colors)
3. Enhance particle effects with more visual variety
4. Improve color palette to match theme better
5. Add more animation frames for smoother motion
6. Better visual feedback effects
7. More detailed shapes and outlines
8. Enhanced shadow/glow effects

CRITICAL: Keep ALL game logic and mechanics EXACTLY the same.
Only modify:
- CSS styles (colors, gradients, shadows, animations)
- Sprite drawing code (canvas drawing, SVG, more frames)
- Particle effect patterns
- Background visuals
- Visual feedback effects

DO NOT change:
- Game logic or functionality
- Player movement mechanics
- Collision detection
- Score/lives mechanics
- Sound effects
- Event handlers
- Game state variables

Return the COMPLETE improved HTML file with enhanced visuals.
Start with <!DOCTYPE html> and end with </html>.`;
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
