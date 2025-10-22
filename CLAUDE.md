# Claude Code - Games Inc Jr Configuration
# Auto-loaded on every session start

/init

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION - READ FIRST
═══════════════════════════════════════════════════════════════

**BEFORE WRITING ANY CODE FOR ANY GAME:**

1. Read `/docs/GAME_TEMPLATE_EXACT.html` 
2. COPY IT VERBATIM as your starting point
3. Replace ONLY the {{PLACEHOLDERS}} with game-specific values
4. Add your game logic in the marked sections

**DO NOT write HTML/overlays from scratch. Use the template.**

This ensures 100% consistency across ALL games.

═══════════════════════════════════════════════════════════════
DEPLOYMENT ENVIRONMENT (SERVERLESS - CRITICAL)
═══════════════════════════════════════════════════════════════

**THIS IS A SERVERLESS DEPLOYMENT ON VERCEL. THERE IS NO LOCAL DATABASE.**

**Architecture:**
- Vercel Serverless Functions (API routes)
- Vercel Postgres (cloud database)
- Prisma ORM with connection pooling
- All processing happens in the cloud
- Git push → auto-deploy to Vercel

**Environment Variables (Must be in Vercel):**
```
DATABASE_URL="postgres://...?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://..."        # For migrations
ANTHROPIC_API_KEY="sk-ant-api03-..."
ADMIN_EMAIL="your@email.com"
```

**To add environment variables:**
```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add ADMIN_EMAIL production
```

**Database Schema:**
- Located in `prisma/schema.prisma`
- Includes `GameSubmission` model for "Make Your Game" feature
- Uses connection pooling (required for serverless)

**To run migrations:**
```bash
# Push schema changes to Vercel Postgres
npx prisma db push

# Or create formal migration
npx prisma migrate dev --name add_feature
git push  # Vercel auto-deploys
```

**Connection Pooling (CRITICAL):**
```prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")  // Direct connection (migrations only)
}
```

**Testing:**
- ❌ Local testing NOT possible (no local database)
- ✅ Use Vercel preview deployments
- ✅ Use `vercel dev` (connects to cloud database)

═══════════════════════════════════════════════════════════════
MANDATORY TEMPLATE USAGE
═══════════════════════════════════════════════════════════════

**File: `/docs/GAME_TEMPLATE_EXACT.html`**

This template contains the standardized structure used by ALL Games Inc Jr games.

**Your workflow for ANY game:**

### Step 1: Copy Template
Read `/docs/GAME_TEMPLATE_EXACT.html` and copy entire contents

### Step 2: Replace Placeholders
Find and replace these {{PLACEHOLDERS}}:

| Placeholder | Example | Purpose |
|-------------|---------|---------|
| {{GAME_TITLE}} | "Space Runner" | Title in h1 and overlays |
| {{GAME_SLUG}} | "space-runner" | For score submission API |
| {{ONE_SENTENCE_DESCRIPTION}} | "Dodge asteroids..." | Try Now overlay |
| {{GAME_CONTEXT_PARAGRAPH}} | "You're the last pilot..." | Story/context |
| {{CONTROL_X_NAME}} | "Arrow Keys" | Control labels |
| {{CONTROL_X_DESC}} | "Move your ship..." | Control explanations |

### Step 3: Add Game Code
Implement in marked sections only:
- `resetGame()` - Initialize game state
- `update(dt)` - Game logic per frame
- `render()` - Draw game
- `endGame()` - Set final metrics

### Step 4: DO NOT Modify
❌ Overlay HTML structure
❌ Overlay CSS
❌ Initialization JavaScript
❌ Button event handlers
❌ State management

═══════════════════════════════════════════════════════════════
GAME DESIGN STANDARDS (Apply to ALL Games)
═══════════════════════════════════════════════════════════════

## Target Audience: Age 10

**Cognitive:** 500ms reaction time, 3-4 instructions max
**Motor:** 2 simultaneous inputs max, 44px touch targets
**Emotional:** Low frustration tolerance, high reward sensitivity

## Mandatory Requirements (Every Game)

✅ **Animated sprites** - 3+ frames (NO static rectangles)
✅ **Particle effects** - on collect, damage, death, power-up
✅ **Sound effects** - on ALL player actions
✅ **Background depth** - gradients OR parallax (NO flat colors)
✅ **Tutorial-easy first 30s** - 90% success rate
✅ **Forgiving hitboxes** - 70% of visual sprite size
✅ **Dual controls** - Keyboard AND touch support
✅ **Instant restart** - R key, no menu navigation
✅ **Score persistence** - localStorage for high scores
✅ **60 FPS stable** - performance requirement

## Difficulty Calibration Formula

```javascript
const baseDifficulty = 1.0;
const minutesElapsed = gameTime / 60;
const difficulty = baseDifficulty * (1 + minutesElapsed * 0.05);
const maxDifficulty = baseDifficulty * 2.5;

// Phases:
// 0-0.5 min: Tutorial (90% win rate)
// 0.5-2 min: Learning (70% win rate)
// 2+ min: Gradual ramp (5% per minute)
// Cap at 2.5x base difficulty
```

## Hitbox Formula (Use in ALL Games)

```javascript
const SPRITE_SIZE = 32;
const HITBOX_SIZE = SPRITE_SIZE * 0.7; // 70% = forgiving
const HITBOX_OFFSET = (SPRITE_SIZE - HITBOX_SIZE) / 2;

function checkCollision(sprite1, sprite2) {
  const x1 = sprite1.x + HITBOX_OFFSET;
  const y1 = sprite1.y + HITBOX_OFFSET;
  const x2 = sprite2.x + HITBOX_OFFSET;
  const y2 = sprite2.y + HITBOX_OFFSET;
  
  return (
    x1 < x2 + HITBOX_SIZE &&
    x1 + HITBOX_SIZE > x2 &&
    y1 < y2 + HITBOX_SIZE &&
    y1 + HITBOX_SIZE > y2
  );
}
```

═══════════════════════════════════════════════════════════════
CATALOG INTEGRATION (Mandatory for Every Game)
═══════════════════════════════════════════════════════════════

After creating ANY game, add entry to `/src/data/games.json`:

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

**Required Assets:**
1. Hero image: `/public/games/[slug]/hero.svg` (16:9, 800×450px)
2. Screenshots: `/public/games/[slug]/s1.svg`, `s2.svg` (16:9)

═══════════════════════════════════════════════════════════════
COMMON PITFALLS (Auto-Avoid These)
═══════════════════════════════════════════════════════════════

❌ Writing overlays from scratch → Use GAME_TEMPLATE_EXACT.html
❌ Modifying overlay structure → Only add game logic in marked sections
❌ Pixel-perfect hitboxes → Use 70% of sprite size
❌ Flat color backgrounds → Use gradients or parallax
❌ Static rectangle sprites → Animate with 3+ frames
❌ No particle effects → Add on all key events
❌ Framerate-dependent physics → Use delta time
❌ Forgetting games.json entry → Game won't appear on website

═══════════════════════════════════════════════════════════════
DEVELOPMENT WORKFLOW (For Any Game)
═══════════════════════════════════════════════════════════════

### Phase 1: Setup (5 minutes)
1. Read /docs/GAME_TEMPLATE_EXACT.html
2. Copy to /public/demos/[slug]/index.html
3. Replace all {{PLACEHOLDERS}}

### Phase 2: Core Implementation (60-90 minutes)
4. Implement resetGame() function
5. Implement update(dt) function
6. Implement render() function
7. Add game-specific HUD badges
8. Add mobile controls (if needed)
9. Test core gameplay loop

### Phase 3: Polish (30-45 minutes)
10. Add particle effects
11. Add sound effects
12. Add animations (3+ frames)
13. Add background depth
14. Tune difficulty progression
15. Test 10-minute playtest session

### Phase 4: Integration (15 minutes)
16. Update endGame() with final metrics
17. Add games.json entry
18. Create hero.svg placeholder
19. Create s1.svg, s2.svg placeholders
20. Verify all slugs match

### Phase 5: Deployment (5 minutes)
21. Commit changes: `git add .`
22. Commit: `git commit -m "Add [game-title]"`
23. Push: `git push origin main`
24. Vercel auto-deploys (watch at vercel.com/dashboard)
25. Test live on production

**Total time: 2-3 hours per game**

═══════════════════════════════════════════════════════════════
MAKE YOUR GAME FEATURE STATUS
═══════════════════════════════════════════════════════════════

**Phase 1: Frontend** ✅ COMPLETE
✓ 7-step guided form (/make-your-game page)
✓ Child-friendly copy and UI
✓ Building screen animation
✓ Success screen with sharing
✓ Mobile responsive

**Phase 2: Backend API** ✅ COMPLETE
✓ /api/games/generate endpoint
✓ Claude Haiku 4.5 integration
✓ Enhanced prompt (500+ lines)
✓ Code validation
✓ Prisma schema (GameSubmission model)
✓ Serverless-ready code

**Phase 3: Deployment Setup** ⚠️ IN PROGRESS
□ Add ANTHROPIC_API_KEY to Vercel
□ Add ADMIN_EMAIL to Vercel
□ Run Prisma migration on Vercel Postgres
□ Test on preview deployment
□ Verify Claude Haiku 4.5 API access

**Phase 4: Admin Tools** ⏳ TODO
□ Email notifications
□ Admin review dashboard (optional)
□ Deployment automation

═══════════════════════════════════════════════════════════════
FINAL CHECKLIST (Every Game Must Pass)
═══════════════════════════════════════════════════════════════

**Template Compliance:**
□ Used GAME_TEMPLATE_EXACT.html as base
□ Replaced all {{PLACEHOLDERS}}
□ Added game logic ONLY in marked sections
□ Did NOT modify overlay structure

**Game Quality:**
□ Animated sprites (3+ frames)
□ Particle effects on key events
□ Sound effects on all actions
□ Background has depth
□ Hitboxes 70% of sprite size
□ First 30s tutorial-easy (90% win rate)
□ 60 FPS stable
□ No console errors

**Integration:**
□ Entry added to games.json
□ Hero image created
□ 2+ screenshots created
□ All slugs match

**Deployment:**
□ Code committed to git
□ Pushed to GitHub
□ Vercel deployed successfully
□ Game works on production

**NOT FINISHED until ALL boxes checked.**

═══════════════════════════════════════════════════════════════
REFERENCE FILES (In Order of Priority)
═══════════════════════════════════════════════════════════════

1. `/docs/GAME_TEMPLATE_EXACT.html` - MANDATORY starting point
2. THIS FILE (CLAUDE.md) - Core standards
3. `/docs/GAME_DESIGN_SPEC.md` - Full specification
4. `/docs/GAME_MECHANICS_LIBRARY.md` - Reusable patterns
5. `/docs/WORKFLOW.md` - Development process
6. `/docs/MAKE_YOUR_GAME_SYSTEM.md` - User-generated games feature
7. `/docs/VERCEL_ENV_SETUP.md` - Environment setup guide

═══════════════════════════════════════════════════════════════
END OF CONFIGURATION
═══════════════════════════════════════════════════════════════

**Universal Principles:**
- Quality over speed
- Polish matters
- Target age 10
- Make it fun, fair, and forgiving
- Use the template
- Test thoroughly
- Serverless deployment (Vercel)
- No local database

**This configuration applies to EVERY game built.**
**No exceptions. Complete consistency.**
