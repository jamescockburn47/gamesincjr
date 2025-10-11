## Setup

1. Copy `docs/ENV.example` to `.env.local` and fill values.
2. Start dev server: `pnpm dev`.
3. Visit `/tables` to use the Times Tables module.
4. Optional: visit `/api/tables/selftest` to run a quick self-test.

Notes:
- AI is optional. With `AI_ENABLED=false`, hints and word problems use deterministic fallbacks.
- KV is optional. If unset, caching is disabled and in-memory fallbacks are used.
- PWA: A minimal `public/manifest.json` is included. Service worker can be added later.


