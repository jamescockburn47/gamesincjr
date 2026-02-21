# Claude Code — Games Inc Jr Configuration
# Auto-loaded on every session start

/init

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION — READ THIS BEFORE TOUCHING ANY GAME CODE
═══════════════════════════════════════════════════════════════

**The unified game framework lives at `/public/game-framework/`.**

Every game — new OR existing — MUST use it. No exceptions, ever.

Framework files (DO NOT MODIFY these unless explicitly asked):
  /public/game-framework/overlay-styles.css   ← shared UI/overlays
  /public/game-framework/game-engine.js       ← GameEngine + InputManager
  /public/game-framework/game-utils.js        ← GameUtils + ParticleSystem
  /public/game-framework/game-template.html   ← canonical starting point

**BEFORE WRITING ANY NEW GAME:**
1. Read `/public/game-framework/game-template.html` in full
2. Copy it verbatim to `/public/demos/[slug]/index.html`
3. Fill in the GAME config object (slug, title, description, instructions, controls)
4. Add game logic ONLY in the three marked sections: onRestart / onUpdate / onRender
5. Never rewrite the HTML structure, overlay IDs, or framework script tags

**BEFORE EDITING AN EXISTING GAME:**
1. Confirm the game already links the framework CSS + JS (most do now)
2. If it doesn't, add the links — see "Porting Checklist" below
3. Never remove or bypass framework wiring already in place

═══════════════════════════════════════════════════════════════
DEPLOYMENT ENVIRONMENT (SERVERLESS — CRITICAL)
═══════════════════════════════════════════════════════════════

THIS IS A SERVERLESS DEPLOYMENT ON VERCEL. THERE IS NO LOCAL DATABASE.

Architecture:
  - Vercel Serverless Functions (API routes)
  - Vercel Postgres (cloud database)
  - Prisma ORM with connection pooling
  - All processing happens in the cloud
  - Git push → auto-deploy to Vercel

Environment Variables (must be in Vercel):
  DATABASE_URL="postgres://...?pgbouncer=true&connection_limit=1"
  DIRECT_URL="postgres://..."   # For migrations only
  ANTHROPIC_API_KEY="sk-ant-api03-..."
  ADMIN_EMAIL="your@email.com"

Testing:
  ❌ Local testing NOT possible (no local database)
  ✅ Use Vercel preview deployments
  ✅ Use `vercel dev` (connects to cloud database)

═══════════════════════════════════════════════════════════════
FRAMEWORK API — WHAT EVERY GAME MUST USE
═══════════════════════════════════════════════════════════════

### HTML structure (copy from game-template.html — never write from scratch)

```html
<div id="gij-wrap">
  <div id="gij-try-overlay"          class="gij-overlay">         ... </div>
  <div id="gij-instructions-overlay" class="gij-overlay hidden">  ... </div>
  <div id="gij-gameover-overlay"     class="gij-overlay hidden">  ... </div>
  <div id="gij-stage">
    <div id="gij-hud" class="hidden"> ... </div>
    <canvas id="gij-canvas"></canvas>
    <div id="gij-controls"></div>
  </div>
</div>
```

Required `<head>` links (must appear in every game):
```html
<link rel="stylesheet" href="/game-framework/overlay-styles.css" />
```

Required `<script>` tags (must appear before game code):
```html
<script src="/game-framework/game-engine.js"></script>
<script src="/game-framework/game-utils.js"></script>
```

### Initialisation (mandatory boilerplate)

```javascript
const GAME = {
  slug:         'my-game',          // must match games.json slug
  title:        'My Game',
  description:  'One-sentence hook.',
  instructions: [
    '<strong>← →:</strong> Move',
    '<strong>Space:</strong> Jump',
    '<strong>Goal:</strong> Survive as long as possible',
  ],
  controls: [                        // shown on touch devices automatically
    { label: '◀', action: 'left'  },
    { label: '▶', action: 'right' },
    { label: '⚡', action: 'space', cls: 'gij-ctrl-space' },
  ],
  width:  800,
  height: 600,
};

const canvas    = document.getElementById('gij-canvas');
const game      = new GameEngine(canvas).setup(GAME);  // wires ALL overlays
const input     = new InputManager();                   // keyboard + touch
const particles = new ParticleSystem();                 // particle pool
```

### Game loop (the only three functions you write)

```javascript
game.onRestart(() => {
  // reset ALL game state back to initial values
  particles.clear();
});

game.onUpdate((dt) => {                   // dt = 1/60 s, fixed timestep
  if (game.state !== 'playing') return;
  // ALL movement MUST use dt:  position += velocity * dt
  GameUtils.applyVelocity(obj, dt);
  GameUtils.clampToCanvas(obj, game.W, game.H);
  particles.update(dt);
});

game.onRender((ctx) => {
  ctx.fillRect(0, 0, game.W, game.H);    // clear background
  particles.draw(ctx);
});
```

### Framework API — quick reference

| Call | What it does |
|---|---|
| `game.addScore(pts)` | Add points, updates HUD, auto-saves high score |
| `game.setScore(n)` | Set score to exact value |
| `game.getScore()` | Read current score |
| `game.getHigh()` | Read all-time high score |
| `game.endGame()` | Show game-over overlay, save high score, submit to API |
| `game.shake(intensity, duration)` | Screen shake (intensity px, duration sec) |
| `game.state` | `'waiting'` / `'playing'` / `'paused'` / `'gameover'` |
| `game.W`, `game.H` | Logical canvas dimensions (800×600 default) |
| `input.isPressed('left')` | True if left key/touch held |
| `input.isPressed('up/down/right/space/fire')` | Same for other actions |
| `particles.burst(x,y,n,opts)` | Spawn n particles from point |
| `GameUtils.hitTest(a, b, 0.7)` | AABB collision, 70% forgiveness |
| `GameUtils.applyGravity(obj, G, dt)` | obj.vy += G * dt |
| `GameUtils.applyVelocity(obj, dt)` | obj.x/y += vx/vy * dt |
| `GameUtils.clampToCanvas(obj, W, H)` | Keep object inside bounds |
| `GameUtils.bounceOffWalls(obj, W, H)` | Bounce vx/vy on edges |
| `GameUtils.wrap(obj, W, H)` | Wrap around edges |
| `GameUtils.distance(x1,y1,x2,y2)` | Euclidean distance |
| `GameUtils.lerp(a, b, t)` | Linear interpolation |
| `GameUtils.randomRange(a, b)` | Random float in [a,b] |

═══════════════════════════════════════════════════════════════
PHYSICS RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════

### The one rule that must NEVER be broken:

  ALL movement, physics, timers, and counters MUST be multiplied by `dt`.

```javascript
// ✅ CORRECT — framerate-independent
obj.x   += obj.vx * dt;
obj.vy  += GRAVITY * dt;
timer   -= dt;
speed    = baseSpeed + elapsed * 0.05;

// ❌ WRONG — runs faster on 120Hz than 60Hz
obj.x   += obj.vx;
obj.vy  += GRAVITY;
timer   -= 1;
```

### Velocity units

  All speeds are in **pixels per second** (px/s), NOT pixels per frame.

  Typical values at game.W=800, game.H=600:
  - Player movement:  200–400 px/s
  - Gravity:          300–600 px/s²
  - Jump velocity:   −400 to −700 px/s (upward = negative)
  - Projectile:       400–800 px/s
  - Slow background:   20–80 px/s

### Never use prompt() or alert()

  NEVER call `alert()` or `prompt()` for game feedback.
  Use canvas-drawn text, the game-over overlay, or `game.endGame()`.

═══════════════════════════════════════════════════════════════
GAME DESIGN STANDARDS (Apply to ALL Games)
═══════════════════════════════════════════════════════════════

Target Audience: Age 8–12

Mandatory per game:
  ✅ Animated sprites — 3+ frames (NO static solid rectangles for main actors)
  ✅ Particle effects — on collect, damage, death, and power-up events
  ✅ Background depth — gradient, stars, or parallax (NO flat single-colour fill)
  ✅ Forgiving hitboxes — `GameUtils.hitTest(a, b, 0.7)` (70% of visual size)
  ✅ Tutorial-easy first 30s — 90% success rate for new players
  ✅ Dual controls — keyboard AND auto-built touch buttons via GAME.controls
  ✅ Screen shake on impact — `game.shake(intensity, duration)`
  ✅ Score persistence — `game.addScore()` and `game.endGame()` handle this
  ✅ 60 FPS stable — never create O(n²) loops or synchronous heavy work
  ✅ No console errors in production

═══════════════════════════════════════════════════════════════
CATALOG INTEGRATION (Mandatory for Every New Game)
═══════════════════════════════════════════════════════════════

Add entry to `/src/data/games.json`:

```json
{
  "slug": "your-game-slug",
  "title": "Your Game Title",
  "tags": ["genre", "mechanic", "theme"],
  "description": "One-sentence pitch in English",
  "description_it": "One-sentence pitch in Italian",
  "hero": "/games/your-game-slug/hero.svg",
  "screenshots": ["/games/your-game-slug/s1.svg"],
  "demoPath": "/demos/your-game-slug/index.html",
  "gameType": "html5",
  "engine": "vanilla-js",
  "version": "1.0.0",
  "status": "released"
}
```

Required assets:
  1. `/public/games/[slug]/hero.svg` (16:9, 800×450)
  2. `/public/games/[slug]/s1.svg`, `s2.svg` (16:9)

═══════════════════════════════════════════════════════════════
DEVELOPMENT WORKFLOW — NEW GAME
═══════════════════════════════════════════════════════════════

Phase 1: Bootstrap (5 minutes)
  1. Read `/public/game-framework/game-template.html`
  2. Copy to `/public/demos/[slug]/index.html`
  3. Fill in GAME config object (slug, title, description, instructions, controls)
  4. Confirm three framework links are present (CSS + 2× JS)

Phase 2: Core loop (60–90 minutes)
  5. Implement `game.onRestart(reset)` — initialise ALL state
  6. Implement `game.onUpdate(dt)` — physics, input, collision
     - All velocities × dt, all timers − dt
     - Use `GameUtils.*` for physics helpers
     - Call `game.addScore()`, `game.shake()`, `game.endGame()` at the right moments
  7. Implement `game.onRender(ctx)` — draw background, sprites, particles
  8. Add extra HUD badges inside `#gij-hud` if needed

Phase 3: Polish (30–45 minutes)
  9. Add `particles.burst()` calls on hit/collect/death
  10. Animate sprites (3+ canvas-drawn frames or sprite sheet)
  11. Add parallax or gradient background
  12. Tune difficulty ramp
  13. Playtest for 10 minutes — fix feel issues

Phase 4: Integration (15 minutes)
  14. Add games.json entry
  15. Create hero.svg + screenshots
  16. `git add . && git commit -m "feat: add [game-title]" && git push origin master`
  17. Check Vercel deploy and test on production

═══════════════════════════════════════════════════════════════
PORTING CHECKLIST (Editing an Existing Game)
═══════════════════════════════════════════════════════════════

When touching ANY existing demo HTML file, verify:

  □ `<link rel="stylesheet" href="/game-framework/overlay-styles.css" />` in <head>
  □ `<script src="/game-framework/game-engine.js">` before game code
  □ `<script src="/game-framework/game-utils.js">` before game code
  □ `#gij-wrap` wraps the page
  □ Overlays use `gij-try-overlay`, `gij-instructions-overlay`, `gij-gameover-overlay` IDs
  □ Canvas is `<canvas id="gij-canvas">`
  □ Mobile controls div is `<div id="gij-controls">`
  □ No `alert()` / `prompt()` calls
  □ All physics multiply by `dt`
  □ Scores go through `game.addScore()` / `game.endGame()`

If ANY box is unchecked, fix it before adding new features.

═══════════════════════════════════════════════════════════════
GAMEPLAY PARAMETERS — USE THESE STARTING VALUES
═══════════════════════════════════════════════════════════════

These values are encoded in `GAMEPLAY_PRESETS` in `game-utils.js` and
represent tested, playable feel across the library. Start here — tune ±20%
for your specific game, but do NOT start from scratch.

### Player sprite sizing
  Player sprite should fill 6-8% of canvas width.
    800px canvas  → 48–64px player width
    960px canvas  → 58–77px player width
  Larger than this and movement FEELS slow even at high px/s.

### Hitbox rules (DIFFERENT by genre — do not apply uniformly)
  Shmup / shooter:   Circle radius = 30% of sprite width (very forgiving — rewards skill)
  Platformer / beat-em-up: AABB 70% of sprite (GameUtils.hitTest default)
  Runner:             AABB 75% of sprite
  Breakout / precise: AABB 100% (exact) — frustration comes from ball physics, not hitboxes

### Canonical values by genre

  SHMUP (Space Runner, Neon Invaders, Alien Unicorn Alliance):
    playerSpeed:        380 px/s
    playerAccel:        820 px/s²
    playerDamp:         0.90 (per-60Hz-frame)
    hitboxRadius:       30% of visual width
    enemySpeedMin:      130 px/s at game start
    enemySpeedMax:      280 px/s at difficulty peak
    bulletSpeed:        380 px/s
    spawnIntervalStart: 2.0 s
    spawnIntervalFloor: 0.55 s (hard cap)

  PLATFORMER (Robots vs Unicorns):
    runSpeed:     260 px/s
    jumpVelocity: -520 px/s (negative = upward)
    gravity:      780 px/s²
    hitboxRatio:  0.70

  RUNNER (Pixel Pac Run, Frog Cross Dash):
    obstacleSpeedStart: 240 px/s
    obstacleSpeedMax:   440 px/s
    speedRamp:          15 px/s per second
    gravity:            900 px/s²
    jumpVelocity:       -520 px/s

  BREAKOUT (Brick Blitz '84):
    paddleSpeed:   420 px/s
    ballSpeedBase: 340 px/s
    ballSpeedMax:  600 px/s

  CATCHER (Banana Bonanza):
    playerSpeed:   380 px/s
    objectFallMin: 160 px/s
    objectFallMax: 340 px/s

### Difficulty ramp formula (use in ALL games)
  difficulty = 1.0 + (elapsedSeconds / 60) * 0.3  // 30% faster per minute
  enemySpeed = baseSpeed * difficulty
  Cap difficulty at 2.5 (150% increase max)

═══════════════════════════════════════════════════════════════
SPRITE STRATEGY — WHEN TO USE KENNEY VS CANVAS DRAWING
═══════════════════════════════════════════════════════════════

Free CC0 sprite packs are committed to `/public/assets/kenney/`.
They come from kenney.nl (CC0 — no attribution required).

  /public/assets/kenney/space/      ← Space Shooter Redux (ships, enemies, asteroids, lasers)
  /public/assets/kenney/animals/    ← Animal Pack Redux (frog, bear, monkey, horse, snake…)
  /public/assets/kenney/platformer/ ← Platformer Pack Redux (characters, enemies, coins, gems)

### When to USE Kenney sprites
  - Generic game objects where visual distinctiveness doesn't matter much:
    spaceships, asteroids, platformer tiles, coins, gems, basic enemies
  - When the game genre matches a Kenney pack (space shooter → kenney/space/)
  - Saves development time and produces higher quality than basic canvas shapes

### When to USE canvas drawing (and NOT Kenney sprites)
  - The character IS the brand/creative centrepiece: unicorn, custom protagonist
  - You need animation that PNGs cannot express: flowing mane, glowing horn, pulsing aura
  - The aesthetic requires procedural effects: glow, gradients, `globalCompositeOperation`
  - The game's visual identity depends on a specific look (Nine Men's Morris board, etc.)

### How to load sprites (AssetLoader — in game-engine.js)

```javascript
const assets = new AssetLoader();
await assets.load({
  ship:     '/assets/kenney/space/playerShip1_blue.png',
  asteroid: '/assets/kenney/space/meteorBrown_big1.png',
}, {
  ship:     0.55,   // pre-scale to ~54×41px at load time (never scale in drawImage)
  asteroid: 0.55,
});

// In onRender:
assets.draw(ctx, 'ship', centerX, centerY);     // draws centred at cx,cy
assets.draw(ctx, 'ship', cx, cy, width, height); // override display size
```

  - ALWAYS pre-scale at load time via the second argument (scales map)
  - NEVER pass unscaled images into drawImage() in the render loop
  - Always provide procedural fallback for when sprites fail to load
  - Use `spritesReady && assets.has('name')` to guard sprite draws

### Adding new sprites
  1. Download from kenney.nl — verify CC0 license
  2. Copy the specific PNGs needed to `/public/assets/kenney/[category]/`
  3. Document in the LICENSE.txt in that directory
  4. Use `AssetLoader.load()` with appropriate pre-scale factors

═══════════════════════════════════════════════════════════════
FINAL CHECKLIST — EVERY GAME MUST PASS
═══════════════════════════════════════════════════════════════

Framework compliance:
  □ Copied game-template.html as starting point
  □ GAME config object at top with slug/title/description/instructions/controls
  □ Framework CSS + JS linked (3 tags)
  □ HTML uses gij-* IDs throughout
  □ onRestart / onUpdate(dt) / onRender(ctx) are the only logic sections

Physics:
  □ ALL velocities and timers multiplied by dt
  □ Speeds in px/s (not px/frame)
  □ No alert() or prompt()
  □ No framerate-dependent counters (frames % n)

Gameplay feel:
  □ Player sprite 6-8% of canvas width
  □ Speeds from GAMEPLAY_PRESETS (or justified deviation)
  □ Hitbox uses correct ratio for game type (shmup=30% circle, platformer=70% AABB)
  □ Difficulty ramps over time (not flat from start to finish)
  □ First 30s tutorial-easy (90% success rate for new player)

Quality:
  □ Animated sprites (3+ frames) OR Kenney sprites used
  □ Particles on key events
  □ Background has depth
  □ 60 FPS stable, no console errors

Sprites:
  □ Generic objects (ships, rocks, coins) use Kenney sprites from /assets/kenney/
  □ Unique characters (unicorn, frog, monkey) use canvas drawing with animation
  □ AssetLoader used for all PNG sprites — pre-scaled at load, not at draw time
  □ Procedural fallback exists for when sprites fail to load

Integration:
  □ Entry added to games.json
  □ Hero image + 2 screenshots created
  □ All slugs match across files

Deployment:
  □ Committed and pushed to master
  □ Vercel deployed successfully
  □ Tested on production (desktop + mobile)

NOT FINISHED until ALL boxes checked.

═══════════════════════════════════════════════════════════════
REFERENCE FILES (Priority Order)
═══════════════════════════════════════════════════════════════

1. `/public/game-framework/game-template.html`  ← MANDATORY starting point
2. `/public/game-framework/game-engine.js`      ← GameEngine + InputManager + AssetLoader API
3. `/public/game-framework/game-utils.js`       ← GameUtils + ParticleSystem + GAMEPLAY_PRESETS
4. `/public/game-framework/overlay-styles.css`  ← CSS classes reference
5. `/public/assets/kenney/`                     ← Free CC0 sprite packs (space, animals, platformer)
6. THIS FILE (CLAUDE.md)                        ← Standards + workflow + gameplay params
7. `/docs/GAME_DESIGN_SPEC.md`                  ← Full design specification
8. `/docs/GAME_MECHANICS_LIBRARY.md`            ← Reusable gameplay patterns

DO NOT reference `/docs/GAME_TEMPLATE_EXACT.html` — it is superseded by
`/public/game-framework/game-template.html`.

═══════════════════════════════════════════════════════════════
SESSION RECOVERY — USE WHEN AI STARTS DRIFTING
═══════════════════════════════════════════════════════════════

Symptoms of context collapse (after ~30 prompts or ~1000-line files):
  - AI reintroduces flat-colour backgrounds
  - Physics drops the * dt multiplier
  - alert() or prompt() reappears
  - Framework IDs get renamed or overlays rewritten from scratch

Re-orientation prompt (paste this verbatim):
  "Read the current game file in full. Confirm:
   (a) all velocity/position updates multiply by dt
   (b) framework CSS and JS links are present
   (c) overlay IDs use gij-* naming
   (d) game uses game.addScore() / game.endGame() — no custom score vars
   List any violations, fix them, then continue."

Session summary prompt (use at end of a long session to hand off):
  "Write a 150-word 'game state summary' covering:
   current game objects and their properties,
   active mechanics, known issues, and next planned step.
   I will paste this at the start of the next session."

═══════════════════════════════════════════════════════════════
END OF CONFIGURATION
═══════════════════════════════════════════════════════════════
