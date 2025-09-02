# Games Inc Jr

A simple, educational Next.js site showcasing small HTML5 games built by a kid with AI assistance.

## Tech Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Static data in `src/data/games.json`
- Demos embedded via iframe from `/public/demos/<slug>/index.html`
- Security headers in `next.config.ts`
- Path-based i18n: `/` (EN), `/it` (Italian)

## Structure
- `src/app` — routes (App Router). Notable:
  - `/games` — games list; `/games/[slug]` — game detail
  - `/about`, `/tutorials`, `/community`, `/account`
  - `/api/*` — minimal APIs (community feed, auth, healthz)
  - `/it/*` — Italian pages mirroring English
- `src/lib/games.ts` — typed data access + validation
- `src/components` — Header, GamePlayer, ComingSoon, LangSwitch
- `public/demos/*` — standalone HTML5 demos

## Data
- Games live in `src/data/games.json`. Minimal fields:
  - `slug`, `title`, `description` (optional `description_it`), `hero`, `screenshots`, `demoPath`, `status`, `gameType`, `engine`, `version`

## Demos
- Each game demo is a self-contained HTML file under `public/demos/<slug>/index.html`.
- Requirements: keyboard and touch controls, visible status, no downloads.

## Community Feed
- GET `/api/community/list` — returns `{items}`
- POST `/api/community/post` — body `{ name, text }`
- Storage: Upstash KV when `KV_REST_API_URL` and `KV_REST_API_TOKEN` exist; otherwise memory fallback (dev only).

## Auth & Tiers (minimal)
- Cookie-based fake tier selector in `/account` for previews; real subscription & magic-link auth can replace later.
- Demos are always playable for level 1.

## Internationalisation
- Path-based: `/` EN; `/it` Italian.
- Italian pages: `/it`, `/it/games`, `/it/games/[slug]`, `/it/about`, `/it/tutorials`, `/it/community`, `/it/account`.
- Add `description_it` (and later `title_it`) to data for game copy.

## Email
- Contact: `hello@gamesincjr.com`.
- Forwarding (ImprovMX) or Workspace MX + SPF (+ DMARC). DKIM recommended when using outbound send.

## Deploy
- Vercel project with custom domain.
- Push to `master` triggers deploy; use `revalidate = 0` on dynamic pages.

## Local Dev
```bash
pnpm i
pnpm dev
```
Visit `http://localhost:3000`.

## Next Steps
- Add 2+ more playable demos (Gravity Lander, Pixel Pac Run)
- Add top-5 scoreboard per demo (KV)
- Magic-link auth + protected asset streaming
- Translate game detail labels for `/it` routes
- Replace `<img>` with `next/image` where appropriate
