## Operations Runbook

- Deploys: GitHub → Vercel. Preview on PR, production on main.
- Feature flags: `AI_ENABLED`, `REQUIRE_PARENT_CONSENT_FOR_AI`.
- Health: `/api/tables/scheduler/next` should return 10 targets.
- Incident: set `AI_ENABLED=false` to force fallbacks.


