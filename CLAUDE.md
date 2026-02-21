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

### Converting old code

  If you encounter per-frame values in an existing game:
  - px/frame → px/s: multiply by 60
  - Gravity/frame² → px/s²: multiply by 3600 (but usually ~300–600 works)
  - Frame countdown → seconds: divide by 60

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

Difficulty formula:
  difficulty = 1.0 + (survivalSeconds / 60) * 0.05   // +5% per minute
  cap at 2.5×

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
COMMON PITFALLS — AUTO-AVOID
═══════════════════════════════════════════════════════════════

❌ Writing overlay HTML from scratch → copy game-template.html
❌ physics without dt → ALWAYS multiply by dt
❌ alert() / prompt() → draw on canvas or use game.endGame()
❌ Reinventing collision → use GameUtils.hitTest(a, b, 0.7)
❌ Reinventing particles → use ParticleSystem.burst()
❌ Reinventing score/highscore → use game.addScore() / game.getHigh()
❌ Reinventing mobile controls → declare in GAME.controls array
❌ Flat colour background → add gradient or parallax layer
❌ Static rectangle "sprites" → animate with 3+ canvas shapes or frames
❌ Pixel-perfect hitboxes → use 0.7 forgiveness in hitTest
❌ Forgetting games.json → game won't appear on site
❌ Hardcoded dt=0.016 → use the actual measured dt from onUpdate

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

Quality:
  □ Animated sprites (3+ frames)
  □ Particles on key events
  □ Background has depth
  □ Hitboxes use 70% forgiveness
  □ First 30s tutorial-easy
  □ 60 FPS stable, no console errors

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
2. `/public/game-framework/game-engine.js`      ← GameEngine + InputManager API
3. `/public/game-framework/game-utils.js`       ← GameUtils + ParticleSystem API
4. `/public/game-framework/overlay-styles.css`  ← CSS classes reference
5. THIS FILE (CLAUDE.md)                        ← Standards + workflow
6. `/docs/GAME_DESIGN_SPEC.md`                  ← Full design specification
7. `/docs/GAME_MECHANICS_LIBRARY.md`            ← Reusable gameplay patterns

DO NOT reference `/docs/GAME_TEMPLATE_EXACT.html` — it is superseded by
`/public/game-framework/game-template.html`.

═══════════════════════════════════════════════════════════════
END OF CONFIGURATION
═══════════════════════════════════════════════════════════════

Universal Principles:
  - Quality over speed
  - Polish matters — target age 8–12
  - Make it fun, fair, and forgiving
  - Use the framework. Always. No exceptions.
  - Serverless deployment (Vercel) — no local database
  - Physics must use dt. Always.
  - No alert() or prompt(). Ever.

This configuration applies to EVERY game built.
No exceptions. Complete consistency.
