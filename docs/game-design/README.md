# Game Design Library

Design standards that make Games Inc Jr games deep, varied and playable — and that double
as the raw material for the AI-coding curriculum. The framework rules in CLAUDE.md govern
*correctness* (dt physics, hitboxes, overlays); these files govern *design*.

## Mandatory core — load before ANY game build or fix

| File | What it gates |
|---|---|
| [DEPTH-STANDARD.md](DEPTH-STANDARD.md) | Two interacting verbs, decisions, phases, session arc, meta-progression. The 10-point fun test (ship at 8/10). |
| [JUICE-CHECKLIST.md](JUICE-CHECKLIST.md) | Feedback on every event: particles, shake, hit-stop, floating text, GameAudio. |
| [DIFFICULTY-AND-ONBOARDING.md](DIFFICULTY-AND-ONBOARDING.md) | Easy first 30s, phase cadence, cliff detection, rubber-banding, fairness/telegraph rules. |

## Library — consult as needed

| File | Use when |
|---|---|
| [VARIETY-MATRIX.md](VARIETY-MATRIX.md) | Creating a NEW game. 12 skeletons × 20 twists × 15 themes; must differ from every existing game on ≥2 axes. Keep its ledger updated. |
| [GENRE-PLAYBOOKS.md](GENRE-PLAYBOOKS.md) | Tuned parameters, canonical second mechanic, escalations and bosses per skeleton. |
| [ENEMY-BEHAVIOUR-PATTERNS.md](ENEMY-BEHAVIOUR-PATTERNS.md) | Any game with enemies. 12 behaviours with pseudocode; telegraphing rules. |
| [META-PROGRESSION-PATTERNS.md](META-PROGRESSION-PATTERNS.md) | localStorage unlock systems, badges, daily seeds, "next goal" HUD. |
| [PROMPT-RECIPES.md](PROMPT-RECIPES.md) | Specifying/iterating a game with an AI — and the pedagogy behind the whole business. |

## Audio

`/public/game-framework/game-audio.js` provides procedural WebAudio SFX (no asset files).
Include it with the other framework scripts and call `GameAudio.play('collect')` etc. —
see JUICE-CHECKLIST.md for the event→sound mapping. Silent games do not ship.
