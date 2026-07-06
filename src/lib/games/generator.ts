import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { prisma } from '@/lib/tables/db/prisma';

export const RATE_LIMIT_PER_DAY = 50; // submissions per day per email (reduce for production)
export const MAX_TOKENS = 16000;
export const AI_GENERATION_TIMEOUT_MS = 300000; // 5 minutes
export const API_RETRY_ATTEMPTS = 3;
export const GRAPHICS_ENHANCEMENT_TIMEOUT_MS = 120000; // 2 minutes

// ─── Schemas ────────────────────────────────────────────────────────────────

export const GameSubmissionSchema = z.object({
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
export type GameSubmission = z.infer<typeof GameSubmissionSchema>;

// The guided make-your-game flow: the child writes their own second verb and
// twist in plain language, rather than picking from a dropdown. These two
// fields are the whole point of "guided prompt-writing" — the AI must build
// exactly what was described, not substitute its own idea.
export const DraftBriefSchema = GameSubmissionSchema.extend({
  secondVerb: z.string().min(3).max(200),
  twist: z.string().min(3).max(200),
});
export type DraftBrief = z.infer<typeof DraftBriefSchema>;

// ─── Slug / timeout / retry helpers ────────────────────────────────────────

export async function generateUniqueSlug(title: string): Promise<string> {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (baseSlug.length > 40) {
    baseSlug = baseSlug.substring(0, 40).replace(/-$/, '');
  }

  let attempt = 0;
  while (attempt < 100) {
    const testSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const existing = await prisma.gameSubmission.findUnique({
      where: { gameSlug: testSlug },
      select: { id: true },
    });
    if (!existing) return testSlug;
    attempt++;
  }
  return `${baseSlug}-${crypto.randomUUID().substring(0, 8)}`;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

export async function generateWithRetry(prompt: string, maxRetries = API_RETRY_ATTEMPTS) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateText({
        model: anthropic('claude-haiku-4-5', { cacheControl: true }),
        maxTokens: MAX_TOKENS,
        temperature: 1.0,
        prompt,
      });
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delayMs = 1000 * Math.pow(2, attempt);
      console.log(`[Game Generator] Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('All retry attempts failed');
}

// ─── 80s arcade flavour ─────────────────────────────────────────────────────

interface ArcadePattern {
  enemyFormation: string;
  scoringSystem: string;
  progressionPattern: string;
  arcadeElement: string;
}

export function mapGameTypeToArcadePattern(gameType: string): ArcadePattern {
  const patterns: Record<string, ArcadePattern> = {
    space: {
      enemyFormation: 'wave-based formations (like Space Invaders) that descend and accelerate',
      scoringSystem: '50 points per enemy killed, 100 for wave completion, bonus for perfect waves',
      progressionPattern: 'waves start slow with few enemies, escalate with more enemies/faster speeds',
      arcadeElement: 'Implement arcade scoring multipliers: 1x baseline, 1.5x for speed, 2x for perfection',
    },
    runner: {
      enemyFormation: 'obstacles and enemies spawning in predictable patterns with increasing frequency',
      scoringSystem: '10 points per obstacle avoided, 100 for distance milestones, 50 for collectibles',
      progressionPattern: 'starts with sparse obstacles, density increases every 30 seconds, speed ramps',
      arcadeElement: 'Add visible level progression counter showing distance/waves completed',
    },
    puzzle: {
      enemyFormation: 'patterns to solve that increase in complexity each level',
      scoringSystem: '100 points per puzzle solved, time bonus if fast, 50 for hints avoided',
      progressionPattern: 'progressive difficulty: simple 3-step puzzles become 7-10 step challenges',
      arcadeElement: 'Visible puzzle counter, level progression, timer for speed bonus',
    },
    racing: {
      enemyFormation: 'traffic patterns that become denser and more chaotic at higher speeds',
      scoringSystem: '1 point per distance unit, 50 for successful overtakes, bonuses for clean runs',
      progressionPattern: 'track difficulty escalates: clear roads to traffic to aggressive opponents',
      arcadeElement: 'Speed indicator, lap/section counter, best times saved',
    },
    shooter: {
      enemyFormation: 'arcade-style enemy waves in formations (V-patterns, grids, spirals)',
      scoringSystem: '25 for basic enemy, 100 for formation completion, 500 for wave clear',
      progressionPattern: 'waves start with 5 enemies, grow to 20+, movement speeds increase',
      arcadeElement: 'Wave counter, enemy counter, multiplier chain on consecutive kills',
    },
    flying: {
      enemyFormation: 'obstacles and enemies that patrol predictable paths in formation',
      scoringSystem: '10 per hazard dodged, 50 per enemy defeated, 200 for wave clear',
      progressionPattern: 'altitude stages unlock progressively harder patterns',
      arcadeElement: 'Altitude counter, enemy formation radar, speed escalation indicator',
    },
    collecting: {
      enemyFormation: 'ghost-like enemies that patrol maze or arena, avoid or outsmart for points',
      scoringSystem: '10 per collectible, 50 per ghost escape, 100 for maze clear',
      progressionPattern: 'ghosts move slower then faster, mazes change pattern per level',
      arcadeElement: 'Collection counter, ghost speed indicator, maze progression visual',
    },
    fighting: {
      enemyFormation: 'enemy waves with increasing difficulty: single opponent to group battles',
      scoringSystem: '50 per combo hit, 100 per enemy defeated, 500 for wave clear',
      progressionPattern: 'opponents get stronger, quicker, more aggressive each wave',
      arcadeElement: 'Combo counter, wave indicator, enemy health/difficulty visual',
    },
    strategy: {
      enemyFormation: 'AI opponents with escalating strategies and tactics',
      scoringSystem: '100 per successful action, 200 per objective, 1000 per victory',
      progressionPattern: 'turns increase in complexity, opponents play smarter',
      arcadeElement: 'Turn counter, resource indicators, strategic depth visual',
    },
  };
  return patterns[gameType] || patterns.space;
}

export function buildArcadeFlavorAddition(submission: GameSubmission): string {
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
Title: "${submission.gameTitle}"
Description: "${submission.gameDescription}"
Type: ${submission.gameType}
Colors: ${submission.colors}
Art Style: ${submission.artStyle}
Difficulty: ${submission.difficulty}/5
Speed: ${submission.speed}/5
Lives: ${submission.lives}
Movement: ${submission.movement}
Action: ${submission.specialAction}
Collectibles: ${submission.collectibles.join(', ') || 'default'}
Hazards: ${submission.hazards.join(', ') || 'default'}

Make this an authentic arcade game that respects these choices while capturing
the addictive, simple, skill-based gameplay that made 80s arcades legendary.`;
}

// ─── Style guideline blocks (shared by both prompt builders) ──────────────

function artStyleBlock(artStyle: GameSubmission['artStyle']): string {
  return {
    geometric: `
GEOMETRIC STYLE:
- Sharp angles, clean lines, bold solid colors
- Use triangles, hexagons, diamonds
- Minimal gradients, focus on flat colors
- Example player: Triangle pointing up with sharp edges
- Example enemy: Hexagon with angular features
- Colors: Bold, high contrast`,
    cartoon: `
CARTOON STYLE:
- Rounded shapes, gradients, expressive features
- Use circles, ovals, curved paths
- Add eyes, mouths, bouncy animations
- Example player: Round character with big eyes
- Example enemy: Blob-like creature with expression
- Colors: Vibrant, with shading gradients`,
    pixel: `
PIXEL ART STYLE:
- 8-bit/16-bit aesthetic, pixel grid aligned
- Use fillRect for pixel-perfect squares
- Limited color palette (4-8 colors)
- Example player: 16x16 pixel sprite with clear silhouette
- Example enemy: 12x12 pixel creature
- Colors: Retro palette, dithering optional`,
    fancy: `
FANCY STYLE:
- Detailed gradients, glow effects, particles
- Use shadows, glows, and DrawingLibrary helpers
- Polished, modern look
- Example player: Gradient-filled shape with glow
- Example enemy: Shadowed sprite with particle trail
- Colors: Rich gradients, atmospheric effects`,
  }[artStyle];
}

function colorPaletteBlock(colors: GameSubmission['colors']): string {
  return {
    colorful: `
COLORFUL PALETTE:
- Primary: #FF0066 (vibrant pink)
- Secondary: #00CCFF (bright cyan)
- Accent: #FFFF00 (sunny yellow)
- Background: #6600FF (deep purple) to #FF0066 (pink) gradient
- Collectibles: #00FF00 (lime green), #FFAA00 (orange)
- Hazards: #FF0000 (red), #FF6600 (orange-red)`,
    'dark-neon': `
DARK-NEON PALETTE:
- Background: #000000 (black) to #001122 (dark blue) gradient
- Player: #00FFFF (cyan) with glow
- Enemies: #FF00FF (magenta) with glow
- Collectibles: #FFFF00 (yellow) with glow
- Accents: #00FF00 (neon green)
- Use DrawingLibrary.drawWithGlow for neon effect`,
    bright: `
BRIGHT PALETTE:
- Background: #87CEEB (sky blue) to #FFFFFF (white) gradient
- Player: #FFD700 (gold), #FF6347 (tomato)
- Enemies: #FF1493 (deep pink), #FF69B4 (hot pink)
- Collectibles: #32CD32 (lime green), #FFA500 (orange)
- Accents: #FFFFFF (white), #FFFF00 (yellow)`,
    retro: `
RETRO PALETTE:
- Background: #2C1810 (dark brown) to #1A0F0A (darker brown) gradient
- Player: #FFB000 (amber), #FF8800 (orange)
- Enemies: #00FF00 (CRT green), #00FFAA (cyan-green)
- Collectibles: #FFFF00 (yellow), #FF00FF (magenta)
- Limited palette: 4-6 colors max`,
  }[colors];
}

function backgroundThemeBlock(background: GameSubmission['background']): string {
  return {
    space: `
SPACE BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'space', colors: [...], scrollSpeed: 30 })
- Or draw custom: stars, planets, nebulae
- Dark background with bright stars
- Optional: scrolling starfield`,
    city: `
CITY BACKGROUND:
- Draw building silhouettes at bottom
- Use rectangles for windows (lit/unlit)
- Optional: scrolling cityscape
- Colors: dark buildings, bright windows`,
    forest: `
FOREST BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'forest', colors: [...] })
- Or draw custom: trees, bushes, grass
- Green tones, organic shapes
- Optional: parallax layers`,
    ocean: `
OCEAN BACKGROUND:
- Use DrawingLibrary.createBackground({ type: 'ocean', colors: [...] })
- Or draw custom: waves, bubbles, fish
- Blue gradient, wave patterns
- Optional: animated waves`,
    sky: `
SKY BACKGROUND:
- Gradient from light to darker blue
- Add clouds (white ovals with transparency)
- Optional: sun/moon, birds
- Bright, airy feel`,
  }[background];
}

function movementControlsLine(movement: GameSubmission['movement']): string {
  return {
    'left-right': '  -> Use input.isPressed("left") and input.isPressed("right")',
    'four-way': '  -> Use input.isPressed("left/right/up/down")',
    mouse: '  -> Track mouse position (add mouse event listeners)',
    'auto-move': '  -> Auto-movement, player controls actions',
  }[movement];
}

function specialActionLine(specialAction: GameSubmission['specialAction']): string {
  return {
    none: '',
    shoot: '  -> Use input.isPressed("space") to shoot',
    jump: '  -> Use input.isPressed("space") to jump',
    powerup: '  -> Use input.isPressed("space") to activate power-up',
  }[specialAction];
}

const FRAMEWORK_HEADER = `CRITICAL: Create a SINGLE HTML FILE with inline JavaScript. Do NOT create TypeScript or React components.

===========================================
FRAMEWORK STRUCTURE (MANDATORY)
===========================================
Your HTML file MUST include these framework scripts in the <head>:

\`\`\`html
<script src="/game-framework/game-engine.js"></script>
<script src="/game-framework/game-utils.js"></script>
<script src="/game-framework/drawing-library.js"></script>
<script src="/game-framework/game-audio.js"></script>
\`\`\`

Your game script MUST follow this EXACT pattern:

\`\`\`javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const game = new GameEngine(canvas);
const input = new InputManager();

let score = 0;
let gameState = 'waiting';

const player = { x: 400, y: 300, width: 40, height: 40, vx: 0, vy: 0, speed: 300 };
const enemies = [];
const collectibles = [];
const particles = [];

const PLAYER_SPEED = 300;  // pixels per second
const GRAVITY = 600;       // pixels per second squared

game.onUpdate((dt) => {
  if (gameState !== 'playing') return;
  // dt is in SECONDS. ALL movement MUST multiply by dt.
  player.vx = 0;
  if (input.isPressed('left'))  player.vx = -PLAYER_SPEED;
  if (input.isPressed('right')) player.vx = PLAYER_SPEED;
  GameUtils.applyVelocity(player, dt);
  // ... collisions, spawning, etc.
});

game.onRender((ctx) => {
  ctx.fillStyle = '#001122';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPlayer(ctx, player.x, player.y);
});

game.start();
\`\`\`

===========================================
CRITICAL DELTA TIME RULES
===========================================
MANDATORY: ALL velocity and position calculations MUST multiply by dt.
Constants are "per second" (not per frame). player.x += 200 * dt, NOT player.x += 5.

AVAILABLE FRAMEWORK UTILITIES
GameEngine: game.onUpdate(cb), game.onRender(cb), game.start/pause/resume/stop()
InputManager: input.isPressed('left'|'right'|'up'|'down'|'space'), touch auto-handled
GameUtils: applyGravity, applyVelocity, checkCollision(a,b,forgiveness=0.7), clamp,
  randomRange, randomInt, randomChoice, distance, lerp, easeInOut
DrawingLibrary (optional): createParticles, createBackground, createRadialGradient,
  drawWithShadow, drawWithGlow, drawText`;

const DEPTH_REQUIREMENTS_BLOCK = (gameSlug: string) => `
===========================================
DESIGN DEPTH REQUIREMENTS (ANTI-SHALLOWNESS GATE)
===========================================
Shallow single-mechanic games are REJECTED at review. Your game MUST have:

1. TWO INTERACTING VERBS: the player can do two meaningfully different things that
   affect each other. A second hazard is NOT a second verb.
2. A DECISION EVERY ~10 SECONDS: risk/reward the player weighs.
3. PHASE STRUCTURE: every 45-60 seconds something QUALITATIVELY new appears — a new
   enemy behaviour, a rule twist, a mini-boss with 3 HP and a telegraphed attack.
   Numeric speed scaling alone is NOT progression.
4. ENEMY VARIETY: at least 2 distinct enemy behaviours. Never only "drift toward
   player". EVERY threat is telegraphed 0.4-0.8s before it can hit.
5. META-PROGRESSION: at least 3 unlockables (colour palettes, character skins, or a
   hard mode) stored in localStorage under 'gij-meta:${gameSlug}', plus a visible
   "Next goal: ..." line in the HUD or game-over screen.
6. SESSION ARC: first 30s tutorial-easy (spawn interval x1.8, enemy speed x0.75), then
   escalate; a good first-session run should last 4-8 minutes.

AUDIO (REQUIRED): also include <script src="/game-framework/game-audio.js"></script>
with the other framework scripts. Call GameAudio.play('collect'), 'hit', 'jump',
'powerup', 'explosion', 'levelup', 'combo', 'gameover' at the matching events (it
auto-initialises on first user gesture and is safe to call anywhere).`;

const HTML_STRUCTURE_BLOCK = (gameTitle: string) => `
===========================================
HTML STRUCTURE REQUIREMENTS
===========================================
Your HTML file MUST include: standard overlays (Try Now, Instructions, Game Over),
canvas element (800x600), HUD div for score/lives, mobile controls div (auto-populated
by script), framework script includes in <head>, inline <style> with overlay styles,
inline <script> with game logic.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${gameTitle}</title>
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
  <script src="/game-framework/game-audio.js"></script>

  <script>
    // Game code here
  </script>
</body>
</html>
\`\`\`

===========================================
CUSTOM SPRITE DRAWING REQUIREMENTS
===========================================
You MUST create custom drawing functions for each sprite type (player, enemy,
collectible) matching the art style — NOT generic rectangles or circles.

===========================================
OUTPUT FORMAT & CODE QUALITY
===========================================
Return ONLY the complete HTML file, nothing else. Do NOT include markdown code
blocks or explanations. Start with <!DOCTYPE html> and end with </html>.
CODE LENGTH REQUIREMENT: your HTML file MUST be at least 300 lines.`;

// ─── Legacy single-shot prompt (dropdown-wizard flow, still used by the
// original async /api/games/generate endpoint) ─────────────────────────────

export function buildEnhancedGamePrompt(gameSlug: string, submission: GameSubmission): string {
  return `You are creating an HTML5 game for Games Inc Jr using our centralized framework utilities. This game MUST work perfectly with ZERO manual fixes required.

===========================================
GAME IDENTITY
===========================================
- Title: "${submission.gameTitle}"
- Slug: ${gameSlug}
- Description: "${submission.gameDescription}"
- Creator: ${submission.creatorName}
- Type: ${submission.gameType}

${FRAMEWORK_HEADER}

===========================================
CRITICAL: MATCH USER'S STYLE CHOICES
===========================================
- Color Scheme: ${submission.colors}
- Art Style: ${submission.artStyle}
- Background: ${submission.background}
- Game Type: ${submission.gameType}
Each game should look UNIQUE - no two games should look identical.
${artStyleBlock(submission.artStyle)}
${colorPaletteBlock(submission.colors)}
${backgroundThemeBlock(submission.background)}

===========================================
GAME REQUIREMENTS (Age 10 Players)
===========================================
Single HTML file, fun for 10-year-olds, delta-time physics, forgiving hitboxes
(70%), tutorial-easy first 30 seconds, custom sprites matching art style.

CONTROLS:
- Movement: ${submission.movement}
${movementControlsLine(submission.movement)}
- Special Action: ${submission.specialAction}
${specialActionLine(submission.specialAction)}

GAME ELEMENTS:
${submission.collectibles.length > 0 ? `- Collectibles: ${submission.collectibles.join(', ')}` : ''}
${submission.hazards.length > 0 ? `- Hazards to Avoid: ${submission.hazards.join(', ')}` : ''}
${submission.features.length > 0 ? `- Special Features: ${submission.features.join(', ')}` : ''}

${buildArcadeFlavorAddition(submission)}
${DEPTH_REQUIREMENTS_BLOCK(gameSlug)}
${HTML_STRUCTURE_BLOCK(submission.gameTitle)}

Create a polished, fun, child-friendly game that works perfectly on first load.`;
}

// ─── Guided draft prompt: builds EXACTLY what the child wrote ─────────────

export function buildGuidedDraftPrompt(gameSlug: string, brief: DraftBrief): string {
  return `You are creating an HTML5 game for Games Inc Jr. A CHILD wrote the brief below in
their own words. Your job is to build EXACTLY what they described — do not silently
substitute a different idea because it seems easier. This game MUST work perfectly
with ZERO manual fixes required.

===========================================
GAME IDENTITY
===========================================
- Title: "${brief.gameTitle}"
- Slug: ${gameSlug}
- Description: "${brief.gameDescription}"
- Creator: ${brief.creatorName}
- Type: ${brief.gameType}

===========================================
THE CREATOR'S OWN WORDS (BUILD EXACTLY THIS)
===========================================
SECOND VERB (besides moving, this is the one extra thing the player can do —
this MUST be a real, distinct action that interacts with movement, not a
cosmetic label):
"${brief.secondVerb}"

TWIST (what makes this game different from an ordinary version of the same
genre — a rule, a mechanic, or an interaction that isn't standard):
"${brief.twist}"

Both of these are non-negotiable. If either is vague, interpret it as
generously and concretely as possible in the spirit the child intended, but
implement SOMETHING real for each — never drop them silently.

${FRAMEWORK_HEADER}

===========================================
CRITICAL: MATCH THE CREATOR'S STYLE CHOICES
===========================================
- Color Scheme: ${brief.colors}
- Art Style: ${brief.artStyle}
- Background: ${brief.background}
- Game Type: ${brief.gameType}
${artStyleBlock(brief.artStyle)}
${colorPaletteBlock(brief.colors)}
${backgroundThemeBlock(brief.background)}

===========================================
GAME REQUIREMENTS (Age 10 Players)
===========================================
Single HTML file, fun for 10-year-olds, delta-time physics, forgiving hitboxes
(70%), tutorial-easy first 30 seconds, custom sprites matching art style.

CONTROLS:
- Movement: ${brief.movement}
${movementControlsLine(brief.movement)}
- Special Action (the PRIMARY action, distinct from the second verb above): ${brief.specialAction}
${specialActionLine(brief.specialAction)}

GAME ELEMENTS:
${brief.collectibles.length > 0 ? `- Collectibles: ${brief.collectibles.join(', ')}` : ''}
${brief.hazards.length > 0 ? `- Hazards to Avoid: ${brief.hazards.join(', ')}` : ''}
${brief.features.length > 0 ? `- Special Features: ${brief.features.join(', ')}` : ''}

${buildArcadeFlavorAddition(brief)}

===========================================
DESIGN DEPTH REQUIREMENTS (ANTI-SHALLOWNESS GATE)
===========================================
1. TWO INTERACTING VERBS: movement PLUS the creator's stated second verb above —
   they must interact (e.g. the second verb changes what a hazard does, spends a
   resource earned by the primary action, or creates a risk/reward moment).
2. THE TWIST changes a real rule of the genre, not just the visuals.
3. A DECISION EVERY ~10 SECONDS arising naturally from the second verb and twist.
4. PHASE STRUCTURE: every 45-60 seconds something QUALITATIVELY new appears.
5. ENEMY VARIETY: at least 2 distinct behaviours, each telegraphed 0.4-0.8s
   before it can hit. Never only "drift toward player".
6. META-PROGRESSION: at least 3 unlockables stored in localStorage under
   'gij-meta:${gameSlug}', plus a visible "Next goal: ..." line.
7. SESSION ARC: first 30s tutorial-easy, then escalate; 4-8 minutes to a good
   first-session run.

AUDIO (REQUIRED): include <script src="/game-framework/game-audio.js"></script>
and call GameAudio.play('collect'|'hit'|'jump'|'powerup'|'explosion'|'levelup'|
'combo'|'gameover') at the matching events.
${HTML_STRUCTURE_BLOCK(brief.gameTitle)}

Build the creator's own idea faithfully. Do not water down the second verb or
the twist to something generic.`;
}

// ─── Revision prompt: apply ONE change, keep everything else the same ─────

export function buildRevisePrompt(currentCode: string, instruction: string, gameTitle: string): string {
  return `You are revising an existing HTML5 game called "${gameTitle}" for Games Inc Jr, based
on the creator's own playtest feedback.

THE CREATOR'S REQUESTED CHANGE (apply exactly this, nothing more):
"${instruction}"

RULES:
1. Apply ONLY the requested change. Keep every other mechanic, visual, sound,
   and unlock EXACTLY as it was — do not "improve" anything that wasn't asked for.
2. Keep all framework wiring intact: the gij-* overlay IDs and structure, the
   <script> tags for game-engine.js / game-utils.js / drawing-library.js /
   game-audio.js, the GameEngine/InputManager usage, game.addScore()/game.endGame().
3. Keep ALL physics dt-multiplied (pixels per second, never per-frame).
4. Keep the existing localStorage meta-progression key and unlock logic working.
5. If the request is ambiguous, make the single most natural interpretation and
   implement it concretely — do not ask a question, this is a one-shot rewrite.
6. If the request is impossible to do safely (e.g. "remove the framework" or
   "delete all the code"), instead make the closest safe change that respects
   the spirit of the request while keeping the game functional.

CURRENT GAME CODE:
\`\`\`html
${currentCode}
\`\`\`

Return ONLY the complete, updated HTML file. Do NOT include markdown code blocks
or explanations. Start with <!DOCTYPE html> and end with </html>.`;
}

export function buildIterationFeedbackPrompt(originalPrompt: string, issues: GameplayIssue[]): string {
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

export function buildGraphicsEnhancementPrompt(gameCode: string, submission: Pick<GameSubmission, 'gameTitle' | 'colors' | 'artStyle'>): string {
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
Only modify: CSS styles, sprite drawing code, particle effect patterns,
background visuals, visual feedback effects.

DO NOT change: game logic, movement mechanics, collision detection,
score/lives mechanics, sound effects, event handlers, game state variables.

Return the COMPLETE improved HTML file with enhanced visuals.
Start with <!DOCTYPE html> and end with </html>.

CURRENT CODE:
${gameCode}`;
}

// ─── Extraction / validation ────────────────────────────────────────────────

export function extractHTMLFromResponse(text: string): string {
  let code = text;
  code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '');

  const doctypeIndex = code.indexOf('<!DOCTYPE');
  if (doctypeIndex !== -1) {
    code = code.substring(doctypeIndex);
  } else {
    const htmlIndex = code.indexOf('<html');
    if (htmlIndex !== -1) code = code.substring(htmlIndex);
  }

  const htmlEndIndex = code.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) code = code.substring(0, htmlEndIndex + 7);

  return code.trim();
}

export function validateGeneratedCode(code: string): boolean {
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
  return true;
}

export interface GameplayIssue {
  severity: 'critical' | 'warning';
  issue: string;
  fix: string;
}

export function analyzeGameplayMechanics(code: string): GameplayIssue[] {
  const issues: GameplayIssue[] = [];

  const hasPlayerVar = /\bplayer\s*=|let\s+player|const\s+player|var\s+player/.test(code);
  const hasPlayerXY = /player\s*\.x|player\s*\.y|playerX|playerY/.test(code);
  if (!hasPlayerVar || !hasPlayerXY) {
    issues.push({ severity: 'critical', issue: 'Missing player position tracking (player.x, player.y)', fix: 'Create a player object with x and y properties that track position' });
  }

  const hasHazardArray = /\bhazards\s*=\s*\[|let\s+hazards|const\s+hazards|enemies\s*=\s*\[|let\s+enemies|const\s+enemies/.test(code);
  if (!hasHazardArray) {
    issues.push({ severity: 'critical', issue: 'Missing hazards/enemies array to track obstacles', fix: 'Create a hazards or enemies array to store all hazard objects: const enemies = [];' });
  }

  const hasCollectArray = /\bcollectibles\s*=\s*\[|let\s+collectibles|const\s+collectibles|coins\s*=\s*\[|let\s+coins|const\s+coins/.test(code);
  if (!hasCollectArray) {
    issues.push({ severity: 'critical', issue: 'Missing collectibles array to track items', fix: 'Create a collectibles array: const collectibles = [];' });
  }

  const hasCollisionCheck = /GameUtils\.checkCollision|checkCollision/.test(code);
  if (!hasCollisionCheck) {
    issues.push({ severity: 'critical', issue: 'Missing collision detection using GameUtils.checkCollision', fix: 'Add collision detection: GameUtils.checkCollision(player, object, 0.7)' });
  }

  const scoreIncrement = /score\s*\+=|score\s*=\s*score\s*\+|points\s*\+=/.test(code);
  if (!scoreIncrement) {
    issues.push({ severity: 'critical', issue: 'Score does not increase when collectibles are hit', fix: 'Add score += 10 (or similar) inside the collectible collision check' });
  }

  const livesDecrement = /lives\s*--|-=|lives\s*=\s*lives\s*-/.test(code);
  if (!livesDecrement) {
    issues.push({ severity: 'critical', issue: 'Lives do not decrease when hazards are hit', fix: 'Add lives-- (or lives -= 1) inside the hazard collision check' });
  }

  const hasRandom = /Math\.random/.test(code);
  const hasSpawn = /spawn|create|new.*object|push.*hazard|push.*collectible|push.*enemy|push.*coin/.test(code);
  if (!hasRandom && hasSpawn) {
    issues.push({ severity: 'warning', issue: 'Objects might not spawn at varied positions', fix: 'Use Math.random() when spawning objects at x: Math.random() * canvas.width' });
  }

  const yVariation = /Math\.random\(\)\s*\*\s*(?:canvas\.height|height|600)/.test(code);
  if (!yVariation) {
    issues.push({ severity: 'warning', issue: 'Objects may not spawn at varied Y positions', fix: 'Use Math.random() * canvas.height (or width) to vary spawn positions throughout canvas' });
  }

  const distinguishable = /if.*hazard|if.*collectible|if.*enemy|if.*coin|type.*hazard|type.*collectible/.test(code);
  if (!distinguishable) {
    issues.push({ severity: 'warning', issue: 'Hazards and collectibles may not be treated differently', fix: 'Add type checking or use separate arrays for hazards and collectibles' });
  }

  const hasMetaProgression = /localStorage/.test(code);
  if (!hasMetaProgression) {
    issues.push({
      severity: 'critical',
      issue: 'Missing meta-progression: the game does not use localStorage at all',
      fix: `Add this exact pattern near the top of your script and call checkUnlocks() after every game.addScore() and inside your game-over handler:
const META_KEY = 'gij-meta:REPLACE_WITH_SLUG';
let meta = { bestScore: 0, unlocked: [] };
try { meta = { ...meta, ...JSON.parse(localStorage.getItem(META_KEY) || '{}') }; } catch (e) {}
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }
const UNLOCKS = [
  { id: 'skin2', at: 500,  label: 'Second colour skin' },
  { id: 'mode2', at: 1500, label: 'Hard mode' },
  { id: 'skin3', at: 3000, label: 'Third colour skin' },
];
function checkUnlocks() {
  if (score > meta.bestScore) meta.bestScore = score;
  for (const u of UNLOCKS) if (meta.bestScore >= u.at && !meta.unlocked.includes(u.id)) meta.unlocked.push(u.id);
  saveMeta();
}
// In your HUD or game-over screen, show the next locked unlock:
// const next = UNLOCKS.find(u => !meta.unlocked.includes(u.id));
// if (next) drawText(ctx, 'Next goal: ' + next.label + ' at ' + next.at, ...);
Adapt the unlock thresholds and effects (palette swap, mode toggle) to fit this specific game, but keep the localStorage read/write and the visible next-goal text.`,
    });
  }

  return issues;
}

export function generatePlaceholderAssets(title: string) {
  const hero = `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="450" fill="#1a237e"/>
    <text x="400" y="225" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#fff">
      ${title}
    </text>
  </svg>`;
  return { hero, screenshots: [hero, hero] };
}

// ─── Moderation & rate limiting ─────────────────────────────────────────────

export async function moderateContent(submission: { gameTitle: string; gameDescription: string; creatorName: string }): Promise<{ approved: boolean; reason?: string }> {
  try {
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
}`,
      }),
      30000,
      'Moderation timeout'
    );

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    return { approved: result.approved === true, reason: result.reason || undefined };
  } catch (error) {
    console.error('[Moderation] Error:', error);
    console.warn('[Moderation] Approved with warning due to service unavailability');
    return { approved: true, reason: 'Auto-approved due to moderation service timeout. Admin review recommended.' };
  }
}

/** Lightweight moderation for a single free-text instruction (the revise loop). */
export async function moderateText(text: string, context: string): Promise<{ approved: boolean; reason?: string }> {
  try {
    const { text: reply } = await withTimeout(
      generateText({
        model: anthropic('claude-haiku-4-5'),
        maxTokens: 150,
        temperature: 0,
        prompt: `You are a content moderator for a children's game platform (ages 8-14).
Context: ${context}

Review this text a child typed. Flag ONLY if it contains graphic violence/gore beyond
cartoon action, sexual content, hate speech, drug references, or self-harm themes.
DO NOT flag mild scary themes, fantasy combat, or ordinary game-design requests.

TEXT: "${text}"

Respond with JSON only: {"approved": true/false, "reason": "brief reason if rejected"}`,
      }),
      15000,
      'Moderation timeout'
    );
    const cleaned = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    return { approved: result.approved === true, reason: result.reason || undefined };
  } catch (error) {
    console.error('[Moderation] Text-moderation error:', error);
    return { approved: true, reason: 'Auto-approved due to moderation service timeout.' };
  }
}

export async function checkRateLimit(email: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await prisma.gameSubmission.count({
    where: { creatorEmail: email, createdAt: { gte: today } },
  });
  return count < RATE_LIMIT_PER_DAY;
}
