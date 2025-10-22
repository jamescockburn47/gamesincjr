# Games Inc Jr - Architecture Documentation

> Target audience: 8-12 year olds  
> Last updated: 2025-10-22

## Overview

Games Inc Jr is a Next.js 15 (App Router) serverless games platform deployed on Vercel. Kids can play HTML5 browser games with optional score tracking and community features.

---

## Tech Stack

- **Framework**: Next.js 15.5.2 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: PostgreSQL via Prisma (for future Times Tables Mega Stars AI features)
- **Storage**: Upstash KV (score tracking, community feed) with Vercel Blob fallback
- **Deployment**: Vercel (serverless functions)
- **Package Manager**: pnpm

---

## Storage Systems Explained

### Upstash KV (Redis-compatible key-value store)
**What it is**: A serverless Redis database that charges per request. Think of it as a fast, simple storage system for small bits of data.

**What we use it for**:
1. **High scores**: Sorted sets (`ZADD`, `ZRANGE`) storing player names + scores per game
2. **Community messages**: List (`LPUSH`, `LRANGE`) storing player comments/feedback

**How it works**:
- Requires `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables
- If not configured, falls back to in-memory storage (dev only) or Vercel Blob (prod fallback)
- See `/src/lib/community-store.ts` for implementation

**Cost**: Free tier: 10,000 commands/day. Estimated usage: ~50-200 commands/day (well within limits)

### Vercel Blob (File storage)
**What it is**: An S3-like file storage service by Vercel.

**What we use it for**:
- Fallback storage for community messages when KV isn't configured
- Future: uploaded game assets, player avatars

**Cost**: Free tier: 100 GB storage + 100 GB bandwidth

### PostgreSQL + Prisma
**What it is**: Traditional relational database.

**What we use it for**:
- **Future feature**: Times Tables Mega Stars - an educational times-tables game with:
  - Spaced repetition algorithm (track user mastery per multiplication fact)
  - AI-powered hints and randomised question generation
  - Session tracking and badge system
  
**Status**: Schema exists in `/prisma/schema.prisma` but not yet connected to UI. Planned for Q1 2025.

---

## Game Types Supported

1. **`html5`**: Self-contained HTML/JS/CSS games in `/public/demos/[slug]/index.html`
   - Embedded via iframe with sandbox restrictions
   - Touch + keyboard controls
   - Score submission via `/api/scores/save`

2. **`video-preview`**: Video trailers (for games not yet playable in browser)

3. **`download`**: Downloadable executables (future - not yet implemented)

4. **`ai-powered`**: Games with LLM-generated content (future - not yet implemented)

---

## Security Model

### Content Security Policy (CSP)
- **Default**: Strict CSP blocking external scripts/styles
- **Demos exception**: Game iframes use `sandbox="allow-scripts allow-same-origin"` to prevent:
  - Access to parent page cookies
  - Access to localStorage with user data
  - XSS attacks escaping iframe boundary

### Headers (next.config.ts)
- `Referrer-Policy: no-referrer` - Don't leak URLs to third parties
- `X-Content-Type-Options: nosniff` - Prevent MIME-type confusion attacks
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking (deprecated, use CSP)
- `Permissions-Policy` - Block camera, microphone, geolocation, payment APIs

### Input Validation
- User-submitted scores: Clamped to 0-10,000,000, name sanitized to alphanumeric + spaces
- Community messages: Max 500 chars, stripped of HTML tags
- Game slugs: Validated against `games.json` whitelist

---

## Internationalization (i18n)

**Current status**: Partial Italian translation

### URL Structure
- English: `/games/[slug]`
- Italian: `/it/games/[slug]`

### Content Translation
- Games: `description_it` field in `games.json` (only 3/16 games translated)
- UI strings: Hardcoded in components (needs extraction to i18n library)

**TODO**: Either commit fully to i18n (use `next-intl`, translate all strings) or remove `/it` routes.

---

## Deployment Workflow

1. **Local dev**: `pnpm dev` → http://localhost:3000
2. **Git push to `master`** → Auto-deploys to Vercel production
3. **Environment variables** (set in Vercel dashboard):
   - `DATABASE_URL` - Postgres connection string
   - `KV_REST_API_URL` - Upstash Redis URL
   - `KV_REST_API_TOKEN` - Upstash auth token
   - `NEXT_PUBLIC_BASE_URL` - https://gamesincjr.com
   - `OPENAI_API_KEY` - For future AI features (optional)

---

## API Routes

### Scores
- `POST /api/scores/save` - Submit score (requires `slug`, `score`, `name`)
- `GET /api/scores/top?slug=X` - Fetch top 5 scores for a game

### Community
- `GET /api/community/list` - Get last 100 community messages
- `POST /api/community/post` - Submit message (requires `name`, `text`)

### Future (not yet implemented)
- `/api/auth/*` - Magic link authentication
- `/api/tables/*` - Times Tables Mega Stars endpoints
- `/api/ai-games/*` - LLM-powered game sessions

---

## Known Limitations

1. **No authentication system**: Cookies store fake tier for preview purposes only
2. **No rate limiting**: `/api/community/post` vulnerable to spam (TODO: add Upstash rate limit)
3. **No error boundaries**: Game load failures crash entire page (TODO: add React error boundary)
4. **Mobile controls overlap canvas**: Bottom 20% of screen obstructed on small devices (TODO: reposition controls)
5. **Only 10/16 games playable**: 6 marked as "coming soon" but broken iframes render

---

## File Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (public)/          # Marketing pages (no layout header)
│   ├── games/[slug]/      # Game detail pages
│   ├── it/                # Italian translations
│   ├── api/               # Serverless API routes
│   └── layout.tsx         # Root layout with Header
├── components/            # React components (shadcn/ui + custom)
├── lib/                   # Utilities, data access
│   ├── games.ts          # games.json loader + validation
│   └── community-store.ts # KV/Blob abstraction
└── data/                  # Static JSON data
    └── games.json        # Game catalog

public/
├── demos/                 # Self-contained game demos
│   └── [slug]/index.html # Each game is a single HTML file
└── games/                 # Hero images, screenshots

prisma/
└── schema.prisma         # Future Times Tables Mega Stars schema
```

---

## Adding a New Game

1. Create demo: `/public/demos/my-game/index.html`
2. Add entry to `/src/data/games.json`:
   ```json
   {
     "slug": "my-game",
     "title": "My Awesome Game",
     "description": "Play as a...",
     "hero": "/games/my-game/hero.svg",
     "demoPath": "/demos/my-game/index.html",
     "gameType": "html5",
     "status": "released",
     "tags": ["action", "8+"]
   }
   ```
3. Commit + push to `master` → auto-deploys

---

## Parent Dashboard (Planned)

**Target launch**: Q2 2025

Features:
- Screen time limits per day/week
- Content filtering (block specific games)
- Progress reports (games played, scores)
- Breathing exercises/mindfulness breaks
- Email digests for parents

**Access control**: Cookie-based tier system (will be replaced with proper auth)

---

## Contact & Support

- **Email**: hello@gamesincjr.com
- **GitHub**: [Private repo]
- **Vercel Project**: gamesincjr

---

## Changelog

### 2025-10-22
- Added architecture documentation
- Documented Upstash KV, Prisma, Blob storage systems
- Clarified game type support + future roadmap
