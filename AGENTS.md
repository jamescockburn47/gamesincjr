# AI Agents Configuration - Games Inc Jr

> Configuration file for AI coding assistants (Cursor, GitHub Copilot, GPT Codex)

---

## 🤖 Project Context

**Project Name**: Games Inc Jr  
**Type**: Next.js 15 serverless games platform  
**Target Audience**: Kids ages 8-12  
**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, Upstash KV  
**Deployment**: Vercel

---

## 📋 Coding Standards

### File Organization
- **Routes**: Use App Router in `src/app/`
- **Components**: Place in `src/components/` (use `'use client'` when needed)
- **Utils**: Place in `src/lib/`
- **Types**: Co-locate with files or in `src/types/` for shared types
- **API**: Serverless functions in `src/app/api/`

### Naming Conventions
- **Files**: kebab-case for routes (`game-detail/page.tsx`)
- **Components**: PascalCase (`GamePlayer.tsx`)
- **Functions**: camelCase (`getGameBySlug`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_SCORE`)

### TypeScript Rules
- Always use TypeScript (`.ts`, `.tsx`)
- Define explicit return types for functions
- Use `interface` for objects, `type` for unions/intersections
- Avoid `any` - use `unknown` and narrow with type guards
- Use Zod for runtime validation of external data

### React Best Practices
- Prefer function components over class components
- Use hooks (`useState`, `useEffect`, etc.)
- Extract reusable logic into custom hooks
- Use `'use client'` directive only when necessary (interactivity, hooks, browser APIs)
- Wrap error-prone components in Error Boundaries

### CSS/Styling
- Use Tailwind CSS utility classes
- Use shadcn/ui components from `@/components/ui/`
- Avoid inline styles except for dynamic values
- Keep responsive design mobile-first
- Test on iPhone, Android, tablets

---

## 🎮 Game-Specific Rules

> **The unified framework at `/public/game-framework/` is mandatory for ALL games.**
> No game may be created or edited without it. See `CLAUDE.md` for the full spec.

### Creating New Games — Required Steps

1. **Read** `/public/game-framework/game-template.html` first — do not skip this
2. **Copy** it verbatim to `/public/demos/[slug]/index.html`
3. **Fill** the `GAME` config object (slug, title, description, instructions, controls)
4. **Write** game logic ONLY in `onRestart` / `onUpdate(dt)` / `onRender(ctx)`
5. **Add** entry to `/src/data/games.json`
6. **Create** hero + screenshot assets

**The three framework files that MUST be linked in every game:**
```html
<link rel="stylesheet" href="/game-framework/overlay-styles.css" />
<script src="/game-framework/game-engine.js"></script>
<script src="/game-framework/game-utils.js"></script>
```

### The Physics Law — Never Broken

Every movement, timer, and counter MUST multiply by `dt`:

```javascript
// ✅ CORRECT
obj.x  += obj.vx * dt;        // px/s × seconds = pixels
obj.vy += GRAVITY * dt;       // px/s² × seconds = px/s
timer  -= dt;                 // countdown in real seconds

// ❌ NEVER DO THIS — framerate-dependent
obj.x  += obj.vx;             // breaks at 120Hz, 144Hz
obj.vy += GRAVITY;            // wrong on every screen
```

Speeds are in **px/s** (not px/frame). Multiply old px/frame values × 60 to convert.

### Framework API — What Every Game Uses

| Object | Key Methods |
|---|---|
| `game` | `.addScore(n)`, `.setScore(n)`, `.endGame()`, `.shake(i,d)`, `.state`, `.W`, `.H` |
| `input` | `.isPressed('left'/'right'/'up'/'down'/'space'/'fire')` |
| `particles` | `.burst(x,y,n,opts)`, `.update(dt)`, `.draw(ctx)`, `.clear()` |
| `GameUtils` | `.hitTest(a,b,0.7)`, `.applyGravity(obj,G,dt)`, `.applyVelocity(obj,dt)` |
| `GameUtils` | `.clampToCanvas(obj,W,H)`, `.bounceOffWalls(obj,W,H)`, `.wrap(obj,W,H)` |
| `GameUtils` | `.distance(x1,y1,x2,y2)`, `.lerp(a,b,t)`, `.randomRange(a,b)` |

### Absolute Rules (No Exceptions)

- ❌ Never write overlays from scratch — use the template
- ❌ Never call `alert()` or `prompt()` in game code — draw on canvas or use `game.endGame()`
- ❌ Never write a custom score/highscore system — use `game.addScore()` / `game.getHigh()`
- ❌ Never build mobile controls manually — declare in `GAME.controls` array
- ❌ Never use `position += velocity` without `* dt`
- ❌ Never use `frames % n === 0` logic — use a seconds timer (`timer -= dt; if (timer <= 0)`)
- ✅ Always use `GameUtils.hitTest(a, b, 0.7)` with 70% forgiveness for collisions
- ✅ Always use `particles.burst()` for hit/collect/death feedback
- ✅ Always call `game.endGame()` to end — never set state manually

### Game Data Schema
```typescript
{
  slug: string;            // lowercase-with-hyphens, matches demo folder
  title: string;           // Display name
  description: string;     // English description (max 200 chars)
  description_it?: string; // Italian translation (optional)
  demoPath: string;        // /demos/[slug]/index.html
  status: 'released' | 'coming-soon';
  gameType: 'html5' | 'video-preview' | 'download' | 'ai-powered';
  tags: string[];          // e.g., ["action", "arcade", "8+"]
  hero: string;            // /games/[slug]/hero.svg
  screenshots?: string[];  // /games/[slug]/s1.svg, etc.
}
```

---

## 🔐 Security Requirements

### Input Validation
- **ALWAYS** validate user input with Zod schemas
- Sanitize all text input (strip HTML tags)
- Never trust data from `games.json` without validation
- Validate slugs with regex: `/^[a-z0-9-]+$/`

### API Routes
- Rate limit all POST endpoints (use Upstash Ratelimit or in-memory)
- Return proper HTTP status codes (400, 401, 404, 500)
- Log errors to console for debugging
- Never expose stack traces to users

### CSP Headers
- CSP is configured in `next.config.ts`
- Do NOT weaken CSP unless absolutely necessary
- Game demos can use `unsafe-eval` (they're sandboxed)

---

## 📦 Dependencies

### When to Add New Dependencies
- **Search npm first**: Check if functionality exists in current deps
- **Check bundle size**: Use https://bundlephobia.com
- **Prefer**: Well-maintained libraries with TypeScript support
- **Avoid**: Unmaintained packages, packages with CVEs

### Approved Dependencies
- `zod` - Runtime validation
- `@vercel/blob` - File storage
- `openai` - AI features (future)
- `@prisma/client` - Database ORM
- `lucide-react` - Icons

### Adding New Dependency Checklist
- [ ] Justify why existing deps can't solve the problem
- [ ] Check last commit date (prefer <6 months old)
- [ ] Check bundle size (prefer <50KB)
- [ ] Add to `package.json` with `pnpm add [package]`
- [ ] Document usage in code comments

---

## 🗄️ Database & Storage

### Upstash KV (Redis)
**Purpose**: Fast, simple key-value storage  
**Usage**: High scores, community messages  
**Access**: Via REST API (env vars: `KV_REST_API_URL`, `KV_REST_API_TOKEN`)

**Example**:
```typescript
// Storing a score
await kvPipeline([
  ['ZADD', 'gi:scores:game-slug', score, playerName],
  ['ZREMRANGEBYRANK', 'gi:scores:game-slug', 0, -6], // Keep top 5
]);
```

### PostgreSQL + Prisma
**Purpose**: Structured data for Times Tables Mega Stars  
**Usage**: User accounts, progress tracking, spaced repetition  
**Status**: Schema exists but NOT yet used in code  
**Access**: Via `@prisma/client` (env var: `DATABASE_URL`)

**DO NOT use Prisma yet** - schema is for future feature (Q1 2025)

### Vercel Blob
**Purpose**: File storage (S3-like)  
**Usage**: Fallback for community messages if KV unavailable  
**Access**: Via `@vercel/blob` package

---

## 🌐 Internationalization

**Current Status**: Partial Italian support (3/16 games translated)

### URL Structure
- English: `/games/[slug]`
- Italian: `/it/games/[slug]`

### Adding Translations
- Add `description_it` field to `games.json`
- Duplicate route in `/src/app/it/` (mirrors English structure)
- Use Italian copy in components when `lang === 'it'`

**Future**: May switch to `next-intl` or delete `/it` routes entirely

---

## 📝 Comments & Documentation

### When to Comment
- Complex algorithms (explain the "why")
- Non-obvious workarounds (link to issue/PR)
- Public API functions (JSDoc with examples)
- TODO items with issue tracker link

### When NOT to Comment
- Obvious code (`// increment counter` before `i++`)
- Redundant information already in code
- Outdated comments (worse than no comment)

### Documentation Files
- `/docs/ARCHITECTURE.md` - Technical architecture
- `/docs/DEPLOYMENT_CHECKLIST.md` - Vercel setup
- `/README.md` - Project overview
- `/prisma/schema.prisma` - Database schema with comments

---

## 🧪 Testing (Future)

**Current Status**: No automated tests yet

**Planned** (Q1 2025):
- Vitest for unit tests
- Playwright for E2E tests
- Test API routes, validation logic, game loading

**Manual Testing Checklist** (Do Now):
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iPhone, Android phone
- [ ] Test all games load and play
- [ ] Test score submission
- [ ] Test community feed

---

## 🚀 Deployment

### Vercel Configuration
- **Production Branch**: `master`
- **Auto-Deploy**: Enabled
- **Build Command**: `pnpm build` (NOT `pnpm build --turbopack`)
- **Environment Variables**: See `/docs/DEPLOYMENT_CHECKLIST.md`

### Before Deploying
- [ ] Run `pnpm build` locally (must succeed)
- [ ] Check for console errors in browser
- [ ] Test on mobile device
- [ ] Update version in `package.json` (optional)

### After Deploying
- [ ] Visit production URL
- [ ] Test critical paths (homepage, game page, score submit)
- [ ] Monitor Vercel function logs for errors
- [ ] Check Upstash dashboard for usage spikes

---

## 🎯 Common Tasks (Quick Reference)

### Add a New Game
```bash
# 1. Copy the canonical template
cp public/game-framework/game-template.html public/demos/my-game/index.html

# 2. Edit the GAME config object at the top of the file
#    - slug, title, description, instructions[], controls[]

# 3. Implement onRestart / onUpdate(dt) / onRender(ctx)
#    - ALL physics must use dt (px/s, not px/frame)
#    - Use GameUtils.*, ParticleSystem, game.addScore(), game.endGame()

# 4. Add entry to src/data/games.json

# 5. Create assets: public/games/my-game/hero.svg + s1.svg

# 6. Commit and push (triggers Vercel deploy)
git add .
git commit -m "feat: add my-game"
git push origin master
```

### Add a New API Route
```bash
# 1. Create route file
touch src/app/api/my-endpoint/route.ts

# 2. Implement GET/POST handler
# 3. Add rate limiting if POST
# 4. Test with curl
curl http://localhost:3000/api/my-endpoint
```

### Update Dependencies
```bash
# Check for outdated packages
pnpm outdated

# Update a specific package
pnpm update [package]

# Update all (be careful!)
pnpm update

# Test after updating
pnpm build && pnpm dev
```

---

## ⚠️ DO NOT

**TypeScript / Next.js:**
- ❌ Use `any` type in TypeScript
- ❌ Add `--turbopack` to production build
- ❌ Commit secrets to git (use `.env.local`)
- ❌ Weaken CSP headers without justification
- ❌ Skip input validation on API routes
- ❌ Modify Prisma schema without documenting
- ❌ Delete `/it` routes without deciding on i18n strategy
- ❌ Add large dependencies (>100KB) without justification

**Game demos — absolute prohibitions:**
- ❌ Write game HTML without using `/public/game-framework/game-template.html`
- ❌ Write overlay HTML from scratch (must use `gij-*` IDs from template)
- ❌ Use `position += velocity` without multiplying by `dt`
- ❌ Use `frames % n === 0` for timing — use `timer -= dt` instead
- ❌ Call `alert()` or `prompt()` — use canvas messages or `game.endGame()`
- ❌ Build a custom score/highscore system — use `game.addScore()` / `game.getHigh()`
- ❌ Build mobile controls manually — use `GAME.controls[]` array in config
- ❌ Link external CDN JS/CSS in game demos (framework files are local)
- ❌ Modify framework files (`game-engine.js`, `game-utils.js`, `overlay-styles.css`) without explicit instruction

---

## 💡 AI Assistant Hints

### When Suggesting Code
- Provide TypeScript with explicit types
- Include error handling
- Add JSDoc comments for exported functions
- Suggest Tailwind classes for styling
- Consider mobile/touch interactions

### When Debugging
- Check browser console first
- Check Vercel function logs
- Verify environment variables are set
- Test API routes with curl
- Use React DevTools for component state

### When Refactoring
- Keep changes small and atomic
- Run `pnpm build` after each change
- Test in browser
- Update related documentation

---

## 📞 Support Resources

- **Docs**: `/docs/` folder (ARCHITECTURE.md, DEPLOYMENT_CHECKLIST.md)
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Upstash**: https://upstash.com/docs
- **Tailwind**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

**Last updated**: 2026-01-31  
**Project Owner**: James Cockburn  
**Email**: hello@gamesincjr.com  

**Game Framework v2** — canonical source of truth for all game demos:  
`/public/game-framework/` (game-template.html · game-engine.js · game-utils.js · overlay-styles.css)
