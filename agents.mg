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

### Creating New Games
1. Place demo in `/public/demos/[slug]/index.html`
2. Self-contained: inline CSS/JS or CDN imports only
3. Must have keyboard controls (WASD or arrows)
4. Must have touch controls for mobile
5. Must submit scores to `/api/scores/save` (optional but recommended)
6. Add entry to `/src/data/games.json` with Zod-validated fields

### Game Data Schema
```typescript
{
  slug: string;           // lowercase-with-hyphens
  title: string;          // Display name
  description: string;    // English description (max 200 chars)
  description_it?: string; // Italian translation (optional)
  demoPath: string;       // /demos/[slug]/index.html
  status: 'released' | 'coming-soon';
  gameType: 'html5' | 'video-preview' | 'download' | 'ai-powered';
  tags: string[];         // e.g., ["action", "arcade", "8+"]
  hero: string;           // /games/[slug]/hero.svg
  screenshots?: string[]; // /games/[slug]/s1.svg, etc.
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
# 1. Create demo
touch public/demos/my-game/index.html

# 2. Add to games.json
# 3. Test locally
pnpm dev

# 4. Commit and push
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

- ❌ Use `any` type in TypeScript
- ❌ Add `--turbopack` to production build
- ❌ Commit secrets to git (use `.env.local`)
- ❌ Weaken CSP headers without justification
- ❌ Skip input validation on API routes
- ❌ Use external dependencies in game demos (keep self-contained)
- ❌ Modify Prisma schema without documenting (it's for Times Tables feature)
- ❌ Delete `/it` routes without deciding on i18n strategy
- ❌ Add large dependencies (>100KB) without justification

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

**Last updated**: 2025-10-22  
**Project Owner**: James Cockburn  
**Email**: hello@gamesincjr.com

