# DEPTH-STANDARD — The Anti-Shallowness Gate

**Purpose:** Every game on Games Inc Jr must pass this gate before it ships. The July 2026
audit found the library's core failure was not physics or polish — it was *shallow design*:
single-mechanic loops, no decisions, no phases, no reason to replay. This file is the fix.

**When to load:** ALWAYS, before building or modifying any game. This file is mandatory
alongside JUICE-CHECKLIST.md and DIFFICULTY-AND-ONBOARDING.md.

---

## Verification is empirical, not a code review — no exceptions

A real incident: a game was remediated, self-scored 7/10, adversarially reviewed, and
shipped — and still had an empty screen for the first 3-4 seconds of play, because every
stage of that pipeline (builder, reviewer, final check) verified compliance by READING
the code and reasoning "the spawn timer is under 5 seconds, so this passes" instead of
actually pressing Start and watching what happens. The rule the game violated
(DIFFICULTY-AND-ONBOARDING.md §7.2: "does something rewarding happen within 5 seconds?")
was written correctly. It was rubber-stamped anyway, because nothing forced anyone to
check it against reality.

**Every item in the 10-point fun test below, and every checklist item in
DIFFICULTY-AND-ONBOARDING.md and JUICE-CHECKLIST.md, must be verified by actually running
the game** — take a screenshot at t=0 (immediately after Start, before any input), and
at realistic time points afterward (t=5s, t=30s, t=60s+). Drive the loop with
`game._onUpdate`/`game._onRender` calls directly if you need precise, reproducible timing
(a real browser tab can throttle rAF when backgrounded — control for this by calling the
engine's update/render hooks yourself rather than waiting on wall-clock time). For any
attrition mechanic (health, warmth, hunger, timers that can end the run), simulate a
FULLY PASSIVE playthrough — zero player input — for at least 60 game-seconds and confirm
no failure state is reached before the stated grace period. "I read the code and the
numbers look right" is not a passing score on any checklist item. If you have not looked
at a screenshot or pixel data, you have not verified it.

---

## The five requirements

A game ships only if ALL five hold. "Mostly" is a fail.

### 1. Two interacting mechanics (a second VERB, not a second hazard)

The player must be able to do at least two meaningfully different things, and the two must
interact. Adding a faster enemy is not a mechanic. Adding a second verb is.

| Shallow (fails) | Deep (passes) |
|---|---|
| Dodge falling objects | Dodge falling objects AND catch some to throw back |
| Jump over obstacles | Jump AND grapple/dash with a cooldown that resets on a perfect jump |
| Move left/right to catch | Catch AND bank your basket (risk carrying more for a multiplier) |
| Shoot descending aliens | Shoot AND deploy a shield that converts blocked shots to ammo |

Test: write the player's verbs as a list. If the list is one item, or the items never
affect each other, redesign before writing more code.

### 2. A meaningful decision every ~10 seconds

Reflex is not a decision. A decision means the player weighs options with different
risk/reward: take the dangerous route for the bonus, spend or save the power-up, chase
the fleeing high-value enemy or hold position, bank the streak or push it.

Concrete devices that create decisions cheaply:
- **Risk placement:** put the best pickups next to the worst hazards.
- **Streak banking:** combo multiplier that resets on damage — push or play safe?
- **Cooldown economy:** one strong ability, ~5s cooldown, several valid uses.
- **Route choice:** two lanes/paths with visibly different risk profiles.

Test: ACTUALLY RUN THE GAME and watch 30 seconds of real play — press Start, take
screenshots, or drive the loop with `game._onUpdate`/`_onRender` and inspect the canvas.
Reasoning about the code from reading it is not a substitute and has already produced a
shipped game with an empty screen for the first several seconds because "the spawn timer
looked fine on paper." Count moments where two options are both sensible. Fewer than 3 →
fail.

### 3. Phase structure — something NEW at fixed milestones

Difficulty must change *qualitatively*, not just numerically. Every 45–60 seconds (or
every N waves/crossings/laps) introduce a new element: a new enemy behaviour (see
ENEMY-BEHAVIOUR-PATTERNS.md), a rule twist, a terrain change, a mini-boss, a bonus round.

Numeric scaling (the CLAUDE.md difficulty formula) runs underneath; phases run on top.
A player who survives 3 minutes must have seen at least 3 things that were not present
in minute 1.

### 4. A session arc

- **0–30s:** tutorial-easy (90% new-player success — see DIFFICULTY-AND-ONBOARDING.md).
- **30s–2min:** build — the second mechanic becomes necessary, first phase change lands.
- **2min+:** escalation — phases stack, decisions sharpen.
- **Target:** a good first-session death at 4–8 minutes, feeling "I know what I'd do differently."

A game where the 10th minute plays identically to the 1st (only faster) fails.

### 5. Meta-progression — a reason to press Restart

Minimum bar (see META-PROGRESSION-PATTERNS.md for recipes):
- At least **3 unlockables** (palette, character skin, mode, harder variant) stored in
  localStorage, keyed `gij-meta:<slug>`.
- A visible **"Next goal"** in the HUD or game-over screen ("Reach 2,000 for the Night
  palette").
- Best-run tracking beyond the single high score (best streak, furthest distance, etc.).

---

## The 10-point fun test

Before declaring a game done, score it honestly, 1 point each. **Ship threshold: 8/10.**

1. The player has ≥2 verbs, and they interact.
2. In any 30s window there are ≥3 real decisions.
3. Minute 3 contains something minute 1 did not (other than speed).
4. There is a boss, set-piece, or bonus event within the first 3 minutes.
5. Enemies/hazards use ≥2 distinct behaviours (not just "drift toward player").
6. Every threat is telegraphed; no death ever feels random.
7. Death is followed by an immediate "one more go" impulse (restart is 1 press, next
   goal is visible).
8. There are ≥3 unlockables and the player can see the next one.
9. The JUICE-CHECKLIST passes (feedback on every event, audio present).
10. A first-time 8-year-old survives 30 seconds; a skilled player is sweating by minute 4.

If you cannot honestly award a point, fix the game — do not rationalise the point.

---

## Why this matters beyond games

This standard is also what we teach. Specifying depth requirements to an AI, testing the
result against reality (the fun test), and iterating until it passes is exactly the skill
Games Inc Jr exists to build: covering your ideas, checking them, persevering. The gate is
the lesson.
