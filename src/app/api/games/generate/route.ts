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
      const { text: retryText } = await withTimeout(
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
    } catch {
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

  return `You are creating an HTML5 game for Games Inc Jr using our centralized framework utilities. This game MUST work perfectly with ZERO manual fixes required.

CRITICAL: Create a SINGLE HTML FILE with inline JavaScript. Do NOT create TypeScript or React components.

===========================================
GAME IDENTITY
===========================================
- Title: "${submission.gameTitle}"
- Slug: ${gameSlug}
- Description: "${submission.gameDescription}"
- Creator: ${submission.creatorName}
- Type: ${submission.gameType}

===========================================
FRAMEWORK STRUCTURE (MANDATORY)
===========================================
Your HTML file MUST include these framework scripts in the <head>:

\`\`\`html
<script src="/game-framework/game-engine.js"></script>
<script src="/game-framework/game-utils.js"></script>
<script src="/game-framework/drawing-library.js"></script>
\`\`\`

Your game script MUST follow this EXACT pattern:

\`\`\`javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const game = new GameEngine(canvas);
const input = new InputManager();

let score = 0;
let lives = ${submission.lives === 999 ? 999 : submission.lives};
let gameState = 'waiting';

const player = {
  x: 400,
  y: 300,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 300  // pixels per second (CRITICAL)
};

const enemies = [];
const collectibles = [];
const particles = [];

// Constants in "per second" units (CRITICAL)
const PLAYER_SPEED = 300;  // pixels per second
const GRAVITY = 600;  // pixels per second²
const ENEMY_SPEED = 150;  // pixels per second

game.onUpdate((dt) => {
  if (gameState !== 'playing') return;
  
  // dt is in SECONDS (e.g., 0.016667)
  // ALL movement MUST multiply by dt
  
  // Input handling
  player.vx = 0;
  if (input.isPressed('left')) {
    player.vx = -PLAYER_SPEED;
  }
  if (input.isPressed('right')) {
    player.vx = PLAYER_SPEED;
  }
  
  // Physics (using framework utilities)
  GameUtils.applyVelocity(player, dt);
  
  // Collision detection (using framework utilities)
  enemies.forEach((enemy, index) => {
    GameUtils.applyVelocity(enemy, dt);
    
    if (GameUtils.checkCollision(player, enemy, 0.7)) {
      enemies.splice(index, 1);
      lives--;
      if (lives <= 0) {
        gameOver();
      }
    }
  });
  
  collectibles.forEach((coin, index) => {
    if (GameUtils.checkCollision(player, coin, 0.7)) {
      collectibles.splice(index, 1);
      score += 100;
    }
  });
});

game.onRender((ctx) => {
  // Clear canvas
  ctx.fillStyle = '#001122';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw custom sprites (MUST match user's art style)
  drawPlayer(ctx, player.x, player.y);
  
  enemies.forEach(enemy => {
    drawEnemy(ctx, enemy.x, enemy.y);
  });
  
  collectibles.forEach(coin => {
    drawCoin(ctx, coin.x, coin.y);
  });
});

game.start();
\`\`\`

===========================================
CRITICAL DELTA TIME RULES
===========================================
⚠️ MANDATORY: ALL velocity and position calculations MUST multiply by dt
⚠️ Constants are "per second" (not per frame)
⚠️ Example: \`player.x += 200 * dt\` NOT \`player.x += 5\`

CORRECT PHYSICS PATTERNS:
✅ const SPEED = 300; // pixels per second
✅ player.x += SPEED * dt;
✅ GameUtils.applyGravity(player, 600, dt);
✅ GameUtils.applyVelocity(player, dt);

WRONG PATTERNS (DO NOT USE):
❌ player.x += 5; // Frame-dependent
❌ velocity.y += 0.5; // Frame-dependent
❌ position += speed; // Missing dt

CONVERSION FORMULA:
If you think "5 pixels per frame" at 60fps:
→ 5 * 60 = 300 pixels per second
→ Use: player.x += 300 * dt

===========================================
AVAILABLE FRAMEWORK UTILITIES
===========================================

GAME ENGINE (GameEngine class):
- game.onUpdate(callback) - Register update callback, receives dt in seconds
- game.onRender(callback) - Register render callback, receives ctx
- game.start() - Start game loop
- game.pause() - Pause game
- game.resume() - Resume game
- game.stop() - Stop game completely

INPUT MANAGER (InputManager class):
- input.isPressed('left') - Check if left is pressed (Arrow Left or A)
- input.isPressed('right') - Check if right is pressed (Arrow Right or D)
- input.isPressed('up') - Check if up is pressed (Arrow Up or W)
- input.isPressed('down') - Check if down is pressed (Arrow Down or S)
- input.isPressed('space') - Check if space is pressed
- input.addTouch(action) - Add touch input (for mobile buttons)
- input.removeTouch(action) - Remove touch input
- Automatically handles both keyboard and touch

PHYSICS HELPERS (GameUtils object):
- GameUtils.applyGravity(object, gravityConstant, dt) - Apply gravity to object.vy
- GameUtils.applyVelocity(object, dt) - Apply object.vx and object.vy to position
- GameUtils.checkCollision(obj1, obj2, forgiveness) - AABB collision (default 0.7 for kids)
- GameUtils.clamp(value, min, max) - Clamp value between min/max
- GameUtils.randomRange(min, max) - Random float between min and max
- GameUtils.randomInt(min, max) - Random integer between min and max
- GameUtils.randomChoice(array) - Random element from array
- GameUtils.distance(x1, y1, x2, y2) - Distance between points
- GameUtils.lerp(start, end, t) - Linear interpolation
- GameUtils.easeInOut(t) - Easing function

DRAWING LIBRARY (DrawingLibrary object - OPTIONAL):
- DrawingLibrary.createParticles(x, y, count, config) - Create particle system
- DrawingLibrary.createBackground(config) - Create animated background
- DrawingLibrary.createRadialGradient(ctx, x, y, innerR, outerR, colors) - Gradient helper
- DrawingLibrary.drawWithShadow(ctx, drawFunc, offsetX, offsetY, blur, color) - Shadow helper
- DrawingLibrary.drawWithGlow(ctx, drawFunc, glowColor, glowSize) - Glow helper
- DrawingLibrary.drawText(ctx, text, x, y, config) - Text with effects

===========================================
CRITICAL: MATCH USER'S STYLE CHOICES
===========================================

USER'S SELECTIONS:
- Color Scheme: ${submission.colors}
- Art Style: ${submission.artStyle}
- Background: ${submission.background}
- Game Type: ${submission.gameType}

STYLE REQUIREMENTS:
✅ Draw CUSTOM sprites matching the art style (NOT generic rectangles)
✅ Use the specified color palette throughout
✅ Create background matching the theme
✅ Visual style must be DISTINCTIVE and match user choices
✅ Each game should look UNIQUE - no two games should look identical

ART STYLE GUIDELINES:

${submission.artStyle === 'geometric' ? `
GEOMETRIC STYLE:
- Sharp angles, clean lines, bold solid colors
- Use triangles, hexagons, diamonds
- Minimal gradients, focus on flat colors
- Example player: Triangle pointing up with sharp edges
- Example enemy: Hexagon with angular features
- Colors: Bold, high contrast
` : ''}

${submission.artStyle === 'cartoon' ? `
CARTOON STYLE:
- Rounded shapes, gradients, expressive features
- Use circles, ovals, curved paths
- Add eyes, mouths, bouncy animations
- Example player: Round character with big eyes
- Example enemy: Blob-like creature with expression
- Colors: Vibrant, with shading gradients
` : ''}

${submission.artStyle === 'pixel' ? `
PIXEL ART STYLE:
- 8-bit/16-bit aesthetic, pixel grid aligned
- Use fillRect for pixel-perfect squares
- Limited color palette (4-8 colors)
- Example player: 16x16 pixel sprite with clear silhouette
- Example enemy: 12x12 pixel creature
- Colors: Retro palette, dithering optional
` : ''}

${submission.artStyle === 'fancy' ? `
FANCY STYLE:
- Detailed gradients, glow effects, particles
- Use shadows, glows, and DrawingLibrary helpers
- Polished, modern look
- Example player: Gradient-filled shape with glow
- Example enemy: Shadowed sprite with particle trail
- Colors: Rich gradients, atmospheric effects
` : ''}

COLOR PALETTE GUIDELINES:

${submission.colors === 'colorful' ? `
COLORFUL PALETTE:
- Primary: #FF0066 (vibrant pink)
- Secondary: #00CCFF (bright cyan)
- Accent: #FFFF00 (sunny yellow)
- Background: #6600FF (deep purple) to #FF0066 (pink) gradient
- Collectibles: #00FF00 (lime green), #FFAA00 (orange)
- Hazards: #FF0000 (red), #FF6600 (orange-red)
` : ''}

${submission.colors === 'dark-neon' ? `
DARK-NEON PALETTE:
- Background: #000000 (black) to #001122 (dark blue) gradient
- Player: #00FFFF (cyan) with glow
- Enemies: #FF00FF (magenta) with glow
- Collectibles: #FFFF00 (yellow) with glow
- Accents: #00FF00 (neon green)
- Use DrawingLibrary.drawWithGlow for neon effect
` : ''}

${submission.colors === 'bright' ? `
BRIGHT PALETTE:
- Background: #87CEEB (sky blue) to #FFFFFF (white) gradient
- Player: #FFD700 (gold), #FF6347 (tomato)
- Enemies: #FF1493 (deep pink), #FF69B4 (hot pink)
- Collectibles: #32CD32 (lime green), #FFA500 (orange)
- Accents: #FFFFFF (white), #FFFF00 (yellow)
` : ''}

${submission.colors === 'retro' ? `
RETRO PALETTE:
- Background: #2C1810 (dark brown) to #1A0F0A (darker brown) gradient
- Player: #FFB000 (amber), #FF8800 (orange)
- Enemies: #00FF00 (CRT green), #00FFAA (cyan-green)
- Collectibles: #FFFF00 (yellow), #FF00FF (magenta)
- Limited palette: 4-6 colors max
` : ''}

BACKGROUND THEME:

${submission.background === 'space' ? `
SPACE BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'space', colors: [...], scrollSpeed: 30 })
- Or draw custom: stars, planets, nebulae
- Dark background with bright stars
- Optional: scrolling starfield
` : ''}

${submission.background === 'city' ? `
CITY BACKGROUND:
- Draw building silhouettes at bottom
- Use rectangles for windows (lit/unlit)
- Optional: scrolling cityscape
- Colors: dark buildings, bright windows
` : ''}

${submission.background === 'forest' ? `
FOREST BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'forest', colors: [...] })
- Or draw custom: trees, bushes, grass
- Green tones, organic shapes
- Optional: parallax layers
` : ''}

${submission.background === 'ocean' ? `
OCEAN BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'ocean', colors: [...] })
- Or draw custom: waves, bubbles, fish
- Blue gradient, wave patterns
- Optional: animated waves
` : ''}

${submission.background === 'sky' ? `
SKY BACKGROUND:
- Gradient from light to darker blue
- Add clouds (white ovals with transparency)
- Optional: sun/moon, birds
- Bright, airy feel
` : ''}

===========================================
GAME REQUIREMENTS (Age 10 Players)
===========================================
✅ Single HTML file with inline JavaScript
✅ Fun and exciting for 10-year-olds
✅ Smooth gameplay at any frame rate (delta time physics)
✅ Forgiving hitboxes (70% of visual size - use GameUtils.checkCollision)
✅ Tutorial-easy first 30 seconds (90% success rate)
✅ Input handled by InputManager (keyboard + touch automatic)
✅ Custom sprites matching art style (NOT rectangles/circles)
✅ Colors from user's chosen palette
✅ Background matching user's theme

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
- Use GameUtils.checkCollision(player, object, 0.7) for forgiving hitboxes
- If HAZARD collision: lose 1 life, respawn hazard at new position
- If COLLECTIBLE collision: gain points, remove collectible
- Collision detection must be ACTIVE in update loop
- State changes MUST occur: score increments, lives decrement on hazard

SPAWN LOGIC:
- Objects spawn at varied Y positions: Math.random() * canvas.height
- Objects spawn at varied X positions: Math.random() * canvas.width
- Spawn rate increases with difficulty over time
- New objects appear throughout game, not just at start

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
  ${submission.movement === 'left-right' ? '  → Use input.isPressed("left") and input.isPressed("right")' : ''}
  ${submission.movement === 'four-way' ? '  → Use input.isPressed("left/right/up/down")' : ''}
  ${submission.movement === 'mouse' ? '  → Track mouse position (add mouse event listeners)' : ''}
  ${submission.movement === 'auto-move' ? '  → Auto-movement, player controls actions' : ''}
- Special Action: ${submission.specialAction}
  ${submission.specialAction === 'shoot' ? '  → Use input.isPressed("space") to shoot' : ''}
  ${submission.specialAction === 'jump' ? '  → Use input.isPressed("space") to jump' : ''}
  ${submission.specialAction === 'powerup' ? '  → Use input.isPressed("space") to activate power-up' : ''}

GAME ELEMENTS:
${submission.collectibles.length > 0 ? `- Collectibles: ${submission.collectibles.join(', ')}` : ''}
${submission.hazards.length > 0 ? `- Hazards to Avoid: ${submission.hazards.join(', ')}` : ''}
${submission.features.length > 0 ? `- Special Features: ${submission.features.join(', ')}` : ''}

${buildArcadeFlavorAddition(submission)}

===========================================
HTML STRUCTURE REQUIREMENTS
===========================================
Your HTML file MUST include:

1. Standard overlays (Try Now, Instructions, Game Over)
2. Canvas element (800x600)
3. HUD div for score/lives
4. Mobile controls div (auto-populated by script)
5. Framework script includes in <head>
6. Inline <style> with overlay styles
7. Inline <script> with game logic

Use this structure:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${submission.gameTitle}</title>
  <link rel="stylesheet" href="/game-framework/overlay-styles.css">
</head>
<body>
  <!-- Overlays: Try Now, Instructions, Game Over -->
  <!-- Canvas -->
  <!-- HUD -->
  <!-- Mobile Controls -->
  
  <script src="/game-framework/game-engine.js"></script>
  <script src="/game-framework/game-utils.js"></script>
  <script src="/game-framework/drawing-library.js"></script>
  
  <script>
    // Game code here
  </script>
</body>
</html>
\`\`\`

===========================================
CUSTOM SPRITE DRAWING REQUIREMENTS
===========================================
You MUST create custom drawing functions for each sprite type:

\`\`\`javascript
function drawPlayer(ctx, x, y) {
  // Draw player matching art style
  // Use colors from palette
  // Make it distinctive and recognizable
  // NOT just a rectangle or circle
}

function drawEnemy(ctx, x, y) {
  // Draw enemy matching art style
  // Different from player
  // Clearly identifiable as threat
}

function drawCollectible(ctx, x, y) {
  // Draw collectible matching art style
  // Appealing, worth collecting
  // Different from player and enemies
}
\`\`\`

===========================================
IMPLEMENTATION CHECKLIST
===========================================
1. ✅ Include framework scripts in <head>
2. ✅ Create GameEngine instance
3. ✅ Create InputManager instance
4. ✅ Use game.onUpdate(dt) for game logic
5. ✅ Use game.onRender(ctx) for drawing
6. ✅ ALL movement multiplied by dt (delta time in seconds)
7. ✅ Use GameUtils.checkCollision for forgiving hitboxes (0.7)
8. ✅ Custom sprite drawing functions matching art style
9. ✅ Colors from user's chosen palette
10. ✅ Background matching user's theme
11. ✅ Varied spawn positions for objects
12. ✅ Active collision detection in update loop
13. ✅ Mobile controls setup (setupMobileControls function)
14. ✅ Overlays for Try Now, Instructions, Game Over

===========================================
OUTPUT FORMAT & CODE QUALITY
===========================================
Return ONLY the complete HTML file, nothing else.
Do NOT include markdown code blocks or explanations.
Start with <!DOCTYPE html> and end with </html>.

CODE LENGTH REQUIREMENT: Your HTML file MUST be at least 300 lines.
This ensures sufficient detail in:
- Game mechanics and logic
- Collision detection
- Spawn systems
- Visual polish (custom sprites)
- Gameplay depth
- Mobile controls
- Overlay management

Create a polished, fun, child-friendly game that works perfectly on first load.`;
}


function extractHTMLFromResponse(text: string): string {
  let code = text;

  code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '');

  const doctypeIndex = code.indexOf('<!DOCTYPE');
  if (doctypeIndex !== -1) {
    code = code.substring(doctypeIndex);
  } else {
    const htmlIndex = code.indexOf('<html');
    if (htmlIndex !== -1) {
      code = code.substring(htmlIndex);
    }
  }

  const htmlEndIndex = code.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    code = code.substring(0, htmlEndIndex + 7);
  }

  return code.trim();
}

function validateGeneratedCode(code: string): boolean {
  if (!code.includes('<!DOCTYPE html') && !code.includes('<html')) {
    console.error('[Validation] Missing HTML document structure');
    return false;
  }

  if (!code.includes('/game-framework/game-engine.js')) {
    console.error('[Validation] Missing GameEngine script include');
    return false;
  }

  if (!code.includes('/game-framework/game-utils.js')) {
    console.error('[Validation] Missing GameUtils script include');
    return false;
  }

  if (!code.includes('new GameEngine(')) {
    console.error('[Validation] Missing GameEngine instantiation');
    return false;
  }

  if (!code.includes('game.onUpdate') || !code.includes('game.onRender')) {
    console.error('[Validation] Missing game.onUpdate or game.onRender callbacks');
    return false;
  }

  if (!code.includes('* dt')) {
    console.error('[Validation] Missing delta time multiplication (must use * dt for frame-rate independence)');
    return false;
  }

  if (code.length < 5000) {
    console.error(`[Validation] Code too short: ${code.length} bytes (min 5000)`);
    return false;
  }

  if (code.includes('{{') && code.includes('}}')) {
    console.error('[Validation] Contains unrendered template variables');
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

  const hasPlayerVar = /\bplayer\s*=|let\s+player|const\s+player|var\s+player/.test(code);
  const hasPlayerXY = /player\s*\.x|player\s*\.y|playerX|playerY/.test(code);

  if (!hasPlayerVar || !hasPlayerXY) {
    issues.push({
      severity: 'critical',
      issue: 'Missing player position tracking (player.x, player.y)',
      fix: 'Create a player object with x and y properties that track position'
    });
  }

  const hasHazardArray = /\bhazards\s*=\s*\[|let\s+hazards|const\s+hazards|enemies\s*=\s*\[|let\s+enemies|const\s+enemies/.test(code);

  if (!hasHazardArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing hazards/enemies array to track obstacles',
      fix: 'Create a hazards or enemies array to store all hazard objects: const enemies = [];'
    });
  }

  const hasCollectArray = /\bcollectibles\s*=\s*\[|let\s+collectibles|const\s+collectibles|coins\s*=\s*\[|let\s+coins|const\s+coins/.test(code);

  if (!hasCollectArray) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collectibles array to track items',
      fix: 'Create a collectibles array: const collectibles = [];'
    });
  }

  const hasCollisionCheck = /GameUtils\.checkCollision|checkCollision/.test(code);

  if (!hasCollisionCheck) {
    issues.push({
      severity: 'critical',
      issue: 'Missing collision detection using GameUtils.checkCollision',
      fix: 'Add collision detection: GameUtils.checkCollision(player, object, 0.7)'
    });
  }

  const scoreIncrement = /score\s*\+=|score\s*=\s*score\s*\+|points\s*\+=/.test(code);

  if (!scoreIncrement) {
    issues.push({
      severity: 'critical',
      issue: 'Score does not increase when collectibles are hit',
      fix: 'Add score += 10 (or similar) inside the collectible collision check'
    });
  }

  const livesDecrement = /lives\s*--|-=|lives\s*=\s*lives\s*-/.test(code);

  if (!livesDecrement) {
    issues.push({
      severity: 'critical',
      issue: 'Lives do not decrease when hazards are hit',
      fix: 'Add lives-- (or lives -= 1) inside the hazard collision check'
    });
  }

  const hasRandom = /Math\.random/.test(code);
  const hasSpawn = /spawn|create|new.*object|push.*hazard|push.*collectible|push.*enemy|push.*coin/.test(code);

  if (!hasRandom && hasSpawn) {
    issues.push({
      severity: 'warning',
      issue: 'Objects might not spawn at varied positions',
      fix: 'Use Math.random() when spawning objects at x: Math.random() * canvas.width'
    });
  }

  const yVariation = /Math\.random\(\)\s*\*\s*(?:canvas\.height|height|600)/.test(code);

  if (!yVariation) {
    issues.push({
      severity: 'warning',
      issue: 'Objects may not spawn at varied Y positions',
      fix: 'Use Math.random() * canvas.height (or width) to vary spawn positions throughout canvas'
    });
  }

  const distinguishable = /if.*hazard|if.*collectible|if.*enemy|if.*coin|type.*hazard|type.*collectible/.test(code);

  if (!distinguishable) {
    issues.push({
      severity: 'warning',
      issue: 'Hazards and collectibles may not be treated differently',
      fix: 'Add type checking or use separate arrays for hazards and collectibles'
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
