# Games Inc Jr — AI-Coding Education Pivot: Analysis & Plan

**Date:** 2026-07-05
**Status:** Approved by James 2026-07-05 ("do it"). Phases 1–2 implemented same day
(Moorstead link, front-page/tutorials repositioning, `docs/game-design/` library,
`game-audio.js`, CLAUDE.md + generator wiring). Phases 3–5 outstanding.

**Pedagogical through-line (added on approval):** the product's core message is that
coding games with AI is training in instructing LLMs *generally* — cover your ideas fully,
test them against reality, iterate precisely, persevere past the first bad build, and pick
up software architecture and languages on the job. Every kid-facing surface and every
curriculum artefact should carry this framing (see PROMPT-RECIPES.md).

---

## 1. The business thesis

Games Inc Jr becomes the centrepiece of a business teaching children (8–14, via schools and parents) how to **AI-code**: describing, specifying, iterating and shipping software with AI as the tool. Games are the hook; education apps are the second act; general-purpose AI-coding literacy is the product. The pitch to parents/schools: *this is one of the most valuable skills their children will ever acquire, and the way to learn it is to build real things that get published.*

The site therefore has two jobs:

1. **Proof** — the games library demonstrates what a child + AI can produce. If the games are bad, the proof fails. This is why game quality is a business problem, not a polish problem.
2. **Platform** — the place where students' games are published, played, and scored. Publication with creator credit is the motivational engine (the infrastructure for this already exists: `GameSubmission` model, admin review pipeline, "Player Made" badges).

---

## 2. Where the site is today (audit summary)

### 2.1 Strong bones — more is built than the brief implied

- **Stack:** Next.js 15 / React 19 / Tailwind 4 on Vercel; Prisma + Postgres; Upstash Redis for scores and community feed; Anthropic/OpenAI/Gemini SDKs wired in.
- **Games:** 21 demos, 19 released, all on a unified framework (`/public/game-framework/`) with fixed-timestep dt physics, shared overlays, touch controls, score persistence and a top-5 leaderboard API.
- **AI game generator:** `/make-your-game` — 4-step wizard → AI generates a game → admin review (`/admin/game-submissions`) → deploy. A cron processes submissions every 2 minutes.
- **Education surface already exists:** `/tutorials` (£25/30-min AI-coding sessions), `/tables` (math practice with SM-2 spaced repetition, parent and teacher dashboards, AI hint/explain coach), Magic AI Friends (6 characters, admin-editable prompts, guardrails).
- **Bilingual** (EN + IT), tiered accounts (£1–£3/yr), community feed, admin console.

### 2.2 The two credibility gaps

**Gap A — the games are shallow.** Independent audit of 8 representative games confirms James's own assessment:

| Failure pattern | Prevalence | Effect on an 8–12-year-old |
|---|---|---|
| Single-mechanic loop (dodge-only, catch-only, drop-only) | ~60% of library | Mastered in 30 seconds, abandoned in 3 minutes |
| Zero meta-progression (no unlocks, modes, cosmetics, persistent goals) | 100% | Replay value is pure score-chasing |
| Purely numeric difficulty (spawn rate/speed scalars, no phases or bosses) | ~100% | Difficulty feels arbitrary; either boring or a cliff |
| Placeholder visuals (rectangles/gradients rather than sprites) | ~50% | Reads as unfinished |
| No audio at all | 100% | Flat feel; framework has no audio layer |
| Trivial/absent enemy behaviour | ~90% | Playing against a clock, not an opponent |

Tier list from the audit: **Frog Cross Dash** (7.5/10, 1,082 LOC) is the only near-good game; Alien Unicorn Alliance, Neon Invaders, Vector Asteroids, Turbo Outracer are solid-but-shallow (6.5–7); Tower Frenzy, Banana Bonanza thin (6); Rogue Dungeon Mini weak (5 — bump-combat, pointless coins); Space Runner/Pixel Pac Run passive one-button loops.

Root cause: the CLAUDE.md standards govern **correctness and feel** (dt physics, hitboxes, speeds) but say almost nothing about **design depth** — mechanics count, phase structure, meta-progression, decision-making. AI generation dutifully produces compliant, shallow games. This is exactly what the custom .md files must fix.

**Gap B — the site doesn't teach AI-coding.** The education offer is a sales page, not a product:

- `/tutorials` is a brochure (email us for a £25 session). No curriculum, no self-serve path, no artefacts.
- `/make-your-game` is a **form wizard** — the child picks dropdown options and an AI generates the game. The child never writes a prompt, never iterates, never sees code. It exercises none of the skills the business claims to teach. It's a vending machine, not a lesson.
- The front page positions the site as "play games" ("Play inventive games guided by kid-trained AI companions"), not "learn to build games with AI".
- No school-facing offer: no scheme of work, no teacher accounts for game-building (teacher dashboards exist only in `/tables`), no safeguarding/data-protection statement (relevant: UK AADC / ICO Children's Code, parental consent for under-13s — currently only a consent note on tutorials).

### 2.3 Housekeeping defects found in passing

- `/about` tier table: Explorer (£2/yr) shows the same "Unlock 3 full games" copy as Starter — copy bug, and the £1–£3/yr price ladder is not a serious pricing structure for the new business.
- "1000+ players" stat on the front page is presumably unverified — a liability when pitching schools.
- 3 demo folders have no `games.json` entry (arctic-survival, crystal-caverns-td, space-runner incomplete) — dead inventory.
- No "moorstead" reference exists yet anywhere in the repo.

---

## 3. Moorstead link (small, do first)

Moorstead is the live showcase: a fully procedural Three.js world (moorstead.app, source in `Desktop\Moorcraft`) with ~100 AI-driven villagers — built by the same person teaching your kids. It is the strongest available proof of "AI-coding can build astonishing things".

**Plan:** a front-page "From our studio" section (not a nav-bar afterthought): card with a Moorstead still/live screenshot, one line — *"Moorstead: a living 3D world on the North York Moors, every texture and creature generated in code — built the same way we teach"* — linking to https://www.moorstead.app (external, new tab). Optionally mirrored on `/about` and `/tutorials` as the "where this leads" exhibit.

---

## 4. The .md design library (the core ask)

A set of markdown files that make AI-generated/AI-assisted games **interesting, variable and playable** — explicitly not 3D-dependent. They serve two audiences at once:

- **The AI** (Claude Code sessions, the make-your-game generator): loaded as design constraints alongside the existing framework rules.
- **The students** (later): the same files, lightly rewritten, become kid-facing "design cards" and prompt recipes — the curriculum's raw material.

Proposed structure: `docs/game-design/` (referenced from CLAUDE.md), with a slim mandatory core and a browsable library:

### 4.1 Mandatory core (loaded for every game build)

1. **`DEPTH-STANDARD.md`** — the anti-shallowness gate. A game ships only if it has:
   - ≥ 2 interacting mechanics (a second verb, not a second hazard);
   - ≥ 1 meaningful decision per ~10 seconds (risk/reward, routing, resource spend — not just reflex);
   - phase structure: something qualitatively new at fixed milestones (new enemy behaviour, mini-boss, rule twist every ~45–60s), not just faster;
   - a session arc: tutorial-easy first 30s → escalation → climax; target 4–8 min to first "good" death;
   - meta-progression: at minimum, milestone unlocks stored in localStorage (modes/palettes/characters).
   Includes a 10-point "fun test" rubric the AI must self-score before declaring a game done.
2. **`JUICE-CHECKLIST.md`** — feedback standards: hit-stop, screen shake budget, particle events, squash/stretch, floating score text, combo announcements, death spectacle, and a simple WebAudio recipe (the framework needs a tiny sound module — bleeps via oscillators, no asset files, Moorstead-style).
3. **`DIFFICULTY-AND-ONBOARDING.md`** — codifies the ramp: first-30-seconds rules, cliff detection, rubber-banding, "Try Easy?" on second consecutive fast death, per-genre pacing tables.

### 4.2 Variability library (pick per game)

4. **`VARIETY-MATRIX.md`** — the generator's anti-clone device. Three orthogonal axes:
   - *Genre skeleton* (≈12: runner, shooter, catcher, lander, brawler, tower-defence, puzzle-grid, racing, stealth, snake-like, breakout, autobattler…)
   - *Twist* (≈20 rule mutators: gravity flips, you-are-the-boss, control inversion, two-characters-one-input, darkness + light radius, time rewind, size changes matter, terrain you paint…)
   - *Theme/tone* (≈15) —
   with the rule that a new game must differ from every existing library entry on ≥ 2 axes. This single file converts "another dodge game" into a combinatorial space of thousands.
5. **Genre playbooks** (`genres/*.md`, one per skeleton) — each: core loop, the canonical second mechanic, 3 escalation patterns, 2 boss patterns, known failure modes (e.g. *catcher: random spawn = no decisions; use telegraphed waves*), tuned parameter block extending the existing GAMEPLAY_PRESETS.
6. **`ENEMY-BEHAVIOUR-PATTERNS.md`** — a dozen reusable behaviours (patrol, ambush, coward, shielder, splitter, mimic, leader+swarm) with pseudocode, so "enemy AI" stops meaning "move toward player".
7. **`META-PROGRESSION-PATTERNS.md`** — localStorage-based unlock trees, daily challenge seeds, mastery badges — sized for static HTML games.

### 4.3 Dual-use (curriculum seed)

8. **`PROMPT-RECIPES.md`** — kid-facing later, AI-facing now: worked examples of specifying a game in plain language ("brief → build → play → critique → iterate" loop), including how to *ask for* depth ("give my game a rule twist and a boss every minute"). This file is the bridge from the design library to the teaching product.

### 4.4 Wiring

- CLAUDE.md gains a short pointer: mandatory core must be read before any game build; VARIETY-MATRIX consulted for every new game; audit checklist gains the depth gate.
- The make-your-game generator prompt gets the same files injected, so user-generated games inherit the standard.

---

## 5. Game library remediation plan

Not all 21 games deserve rescue. Triage:

- **Flagship five (deep fix):** Frog Cross Dash (fix the wave-5 cliff + snake fairness; add crossing milestones/unlockable frogs), Alien Unicorn Alliance (faster pulse economy, drone behaviour variety, milestone unlocks), Turbo Outracer (rival blocking AI, slipstream nerf, 3 track layouts), Vector Asteroids (UFOs, power-ups, boss rock every 5 waves), Neon Invaders (shields, weapon drops, formation variants — differentiate from the 1978 original).
- **Second-mechanic pass (cheap uplift):** Banana Bonanza, Tower Frenzy, Rogue Dungeon Mini (real attack verb + rooms with intent), Pixel Pac Run, Space Runner — each gets exactly one second verb + phase structure + the juice checklist, as forced by DEPTH-STANDARD.md.
- **Cull or finish:** arctic-survival vs arctic-bear-survival duplication, crystal-caverns-td, space-runner's missing catalog entry — release properly or delete. A 12-game library of good games beats 21 mediocre ones, especially as sales collateral.
- **Framework addition:** one small shared module — `game-audio.js` (procedural WebAudio SFX + optional music loop) — the single highest-leverage engineering item, since 100% of games are silent.
- Each remediated game becomes a before/after case study — literally teaching material ("here's the shallow version, here's what one design pass does").

## 6. Site/product plan for the education pivot

**Positioning shift (front page):** headline moves from "play games" to build/learn framing — e.g. *"Play our games. Then learn to build your own — with AI."* Three-panel proof strip: (1) the games library, (2) a student-made game with creator credit, (3) Moorstead as the ceiling. Keep play-first for kids; add a clearly-signposted parents/schools path.

**Rebuild `/make-your-game` as the first lesson, not a vending machine.** Replace the dropdown wizard with a guided prompt-writing flow: the child *writes* the brief (with scaffolding), sees the AI's interpretation, plays the draft, then iterates with follow-up prompts ("make the boss appear sooner", "add double-jump"). Three iterations minimum before submission. That is AI-coding, age-appropriately. The existing moderation pipeline stays.

**Education offer ladder:**
1. **Free:** play the library; one guided make-your-game build.
2. **Parents (B2C):** £25 taster session (exists) → a structured 6–8-session course ("Build and publish your own game"), each session mapping to the .md curriculum files; graduate games published with credit.
3. **Schools (B2B):** half-day workshops and after-school club packs — scheme of work, teacher notes, safeguarding/data statement, class dashboard (extend the existing `/tables` teacher model to game-building). This is the scalable revenue line.
4. Retire the £1–£3/yr game-unlock tiers; games become free marketing, revenue comes from teaching.

**Compliance workstream (required before schools pitch):** UK AADC/Children's Code position statement, parental consent flow beyond a footnote, AI-chat moderation documentation, verified-claims-only marketing copy (drop "1000+ players" unless real).

## 7. Phasing

| Phase | Scope | Effort |
|---|---|---|
| **1. Quick wins** | Moorstead front-page section; fix about-page tier copy bug; cull/finish orphan games; drop unverifiable stats | Hours |
| **2. Design library** | Write the 8 .md files; wire into CLAUDE.md + generator prompt; add `game-audio.js` | Days |
| **3. Library uplift** | Flagship five deep-fixed; second-mechanic pass on five more; each validated against DEPTH-STANDARD | 1–2 weeks of sessions |
| **4. Education product** | Front-page repositioning; make-your-game → guided prompt flow; course outline + parents/schools pages | 1–2 weeks |
| **5. Schools pack** | Scheme of work, teacher dashboard, compliance docs, pilot with one school/club | After 4 |

Sequencing logic: the .md library (Phase 2) must precede the uplift (Phase 3) so fixes are done *to the new standard*, and the standard is what later becomes curriculum. Moorstead link is independent — do immediately.

---

## 8. Risks / open questions for James

1. **Brand split:** does the education business trade as Games Inc Jr, or is GIJ the kids-facing brand under a separate consultancy umbrella (relevant given the existing AI consultancy plans and Harcus Parker position)? Affects front-page copy, not architecture.
2. **Generator cost/abuse:** guided iterative generation multiplies LLM calls per child; needs per-account budgets (the 3-games/day cap is a start).
3. **Safeguarding is the school-sale gatekeeper** — worth doing properly early, not as an afterthought.
4. **Moorstead audience fit:** moorstead.app is not built for children; verify content is fine for an 8-year-old audience before linking prominently (it appears to be, but confirm).
5. Pricing for the course/club tiers is asserted, not researched — validate against Code Ninjas / local club rates before publishing numbers.
