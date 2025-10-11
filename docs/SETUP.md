## Setup

1. Copy `docs/ENV.example` to `.env.local` and fill values.
2. Start dev server: `pnpm dev`.
3. Visit `/tables` to use the Times Tables module.

Notes:
- AI is optional. With `AI_ENABLED=false`, hints and word problems use deterministic fallbacks.
- KV is optional. If unset, caching is disabled and in-memory fallbacks are used.


