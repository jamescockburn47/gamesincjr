# DIFFICULTY AND ONBOARDING — The Ramp Standard

Audience: players aged 8–12. Current library failure mode: tutorial-easy opening,
then a numeric-only speed ramp that becomes a cliff. This document replaces that
with a session arc, cliff rules, rubber-banding, and fairness minimums. All
numbers are starting values — tune ±20%, never ignore.

---

## 1. The First-30-Seconds Contract

A brand-new player must survive the first 30 seconds 90% of the time. This is a
contract, not an aspiration. For `elapsed < 30`:

- **Spawn interval × 1.8** (e.g. shmup preset 2.0s → 3.6s between spawns)
- **Enemy/obstacle speed × 0.75** (e.g. runner 240 px/s → 180 px/s)
- **No new behaviours** — only the single core threat type; no zigzag enemies,
  no shooters, no splitters
- **Generous pickups** — first 30s pickup rate × 1.5; first pickup within 5s so
  the player learns the reward loop immediately
- **No simultaneous threats** — at most 2 live threats on screen before t=30

```javascript
const tutorial = elapsed < 30;
const spawnInterval = baseInterval * (tutorial ? 1.8 : 1) / difficulty;
const enemySpeed    = baseSpeed    * (tutorial ? 0.75 : 1) * difficulty;
```

Blend out over 30→40s with `GameUtils.lerp`, do not snap at t=30 — a snap IS a
cliff (§4).

---

## 2. Session Arc

Target: a first-week player reaches a "good death" — dies knowing why, wanting
to retry — at 4–8 minutes. Structure every game as:

| Phase | Time | Content |
|---|---|---|
| **Tutorial** | 0–30s | Contract above. One threat, one reward. 90% survival. |
| **Build** | 30s–2min | Full base speeds. Density rises. Player finds rhythm. |
| **Escalation** | 2min+ | A QUALITATIVE change every 45–60s (see below). |
| **Climax** | 4–8min | Multiple systems active; skilled play required; good death. |

**Qualitative change means a new thing, not a bigger number.** Every 45–60s of
escalation, introduce exactly ONE of:

- A new enemy/obstacle behaviour (zigzag, homing, shooting, splitting)
- A rule twist (moving safe zones, reversed conveyor, shrinking platform)
- A phase shift (boss wave, bonus round, night mode with reduced visibility)
- A new pickup or hazard type

Announce each with the JUICE-CHECKLIST level-up stack (`'levelup'` sound,
floating `LEVEL n`, burst). Never introduce two new things in the same beat.

```javascript
const phase = Math.floor(Math.max(0, elapsed - 60) / 50);  // new phase ~every 50s after 1min
if (phase > lastPhase) { lastPhase = phase; enableBehaviour(phase); announceLevelUp(); }
```

---

## 3. The Difficulty Formula

From CLAUDE.md — mandatory in all games:

```javascript
const difficulty = Math.min(2.5, 1.0 + (elapsed / 60) * 0.3);  // +30%/min, cap 2.5
enemySpeed = baseSpeed * difficulty;
```

Apply `difficulty` to AT MOST two of {speed, spawn density, projectile rate} —
and never increase two of them in the same 15s window (§4).

### Per-genre pacing (base values from GAMEPLAY_PRESETS in game-utils.js)

| Genre | Ramp target | What difficulty scales | What it must NOT scale |
|---|---|---|---|
| Shmup | 2.0s → 0.55s spawn floor over ~4min | spawn interval, enemy speed 130→280 | bullet speed past 380 px/s |
| Platformer | Level layouts, not physics | enemy count, gap width | gravity, jump velocity — EVER |
| Runner | 240 → 440 px/s at 15 px/s/s | scroll speed | obstacle density AND speed together |
| Breakout | Ball 340 → 600 px/s over many hits | ball speed per paddle hit (+8 px/s) | paddle size below 60% of start |
| Catcher | 1.2 → 4.0 spawns/s | fall speed 160→340, spawn rate (staggered) | both in the same beat |

---

## 4. Cliff Detection and Smoothing

**Definition:** a cliff exists if a player's survival probability halves within
any 15-second window. Practical test: if playtesters (or you, playing
deliberately averagely) die at the same timestamp ±10s across runs, that
timestamp is a cliff.

Rules to prevent cliffs:

1. **Stagger axes.** Never raise speed AND density in the same beat. Alternate:
   speed bump at t=60, density bump at t=90, speed at t=120.
2. **Ramp continuously, step rarely.** The formula in §3 is continuous — good.
   Phase changes (§2) are steps — so a phase that adds a behaviour must NOT
   coincide with a formula-driven milestone; offset phases from round minutes.
3. **New behaviour arrives weak.** First homing enemy homes at 60% turn rate;
   full strength one phase later.
4. **Grace period after phase change:** 3s of reduced spawn (×1.5 interval)
   immediately after each new behaviour appears, so the player meets it in
   isolation.

---

## 5. Rubber-Banding for Kids

Losing twice in the first minute means the game is too hard for THIS player
right now. Quietly help; never label the player.

```javascript
// onRestart / endGame bookkeeping — per game, via localStorage
const KEY = 'gij_deaths_' + GAME.slug;
function recordDeath(elapsed) {
  try {
    const fast = elapsed < 60;
    const n = fast ? (parseInt(localStorage.getItem(KEY) || '0', 10) + 1) : 0;
    localStorage.setItem(KEY, String(n));          // resets on any 60s+ run
  } catch (e) {}
}
function assistFactor() {
  try {
    return parseInt(localStorage.getItem(KEY) || '0', 10) >= 2 ? 0.85 : 1.0;
  } catch (e) { return 1.0; }
}
// Apply silently in onUpdate:
enemySpeed = baseSpeed * difficulty * assistFactor();  // ×0.85 after 2 fast deaths
```

**Explicit easy mode:** after 2 CONSECUTIVE deaths before 60s, add a
"Try Easy?" button to the game-over overlay. Easy mode = assist factor 0.75 +
tutorial multipliers extended to 60s. Persist the choice; offer "Back to
Normal" on the overlay while active. Inject the button next to
`gij-restart-btn` inside `gij-gameover-overlay`; do not rebuild the overlay.

Assist NEVER reduces score earned — kids notice punishment, not help.

---

## 6. Fairness Rules — non-negotiable

Ages 8–12 have slower reaction and visual-scanning speed than adults. Minimums:

1. **Every threat telegraphed 0.4–0.8s** before it can hurt: flash the spawn
   point, show a warning `!`, or animate a wind-up. Instant hazards are bugs.
2. **No off-screen spawn may hit within 0.5s of appearing.** Check:
   `distanceToPlayer / threatSpeed >= 0.5` at spawn, else respawn elsewhere.
3. **Minimum time-to-impact 0.7s at ANY difficulty.** A threat aimed at the
   player's current position must take ≥0.7s to arrive. This caps effective
   speed: e.g. threats crossing a full 800px canvas may not exceed ~1140 px/s;
   threats spawning 300px away may not exceed ~430 px/s. The 2.5 difficulty
   cap plus preset maxima keep you inside this — do not override them.
4. **Reaction-time reference (ages 8–12):** simple reaction ~0.35–0.45s;
   choice reaction (decide left/right) ~0.6–0.8s. Hence 0.4s telegraph minimum
   and 0.7s time-to-impact minimum. Do not design around adult reflexes.
5. **Death must be legible.** The killing object must be on screen and visible
   ≥0.5s before impact. If a playtester asks "what killed me?", that is a
   fairness bug.
6. **Hitboxes stay forgiving at all difficulties** — the ratios in
   GAMEPLAY_PRESETS (shmup 30% circle, runner 0.75, platformer 0.70) never
   shrink as difficulty rises.

---

## 7. Pre-Ship Self-Test — 10 points

Run these before every ship. Play honestly; where stated, play badly on purpose.
**"Play" means actually run the game and observe it — screenshots, pixel reads, or
driving `game._onUpdate`/`_onRender` directly for precise timing — not reading the code
and reasoning about what the numbers should produce.** A shipped game once passed every
line of this list on paper (spawn interval was correctly under 5s) while still showing an
empty screen for several seconds in practice, because the check was never actually run.
See DEPTH-STANDARD.md's "Verification is empirical" section.

1. [ ] **30s test:** play 5 fresh runs making only lazy inputs — survive 30s in
   at least 4 of 5?
2. [ ] **First reward:** does something rewarding (pickup/score/sound) happen
   within the first 5 seconds?
3. [ ] **New-thing cadence:** list the timestamps of qualitative changes — is
   there one every 45–60s from 1min onwards, and never two at once?
4. [ ] **Cliff scan:** play 5 average runs — do deaths cluster at one timestamp
   ±10s? If yes, smooth per §4.
5. [ ] **Formula check:** difficulty uses `1.0 + elapsed/60*0.3`, capped 2.5,
   applied to ≤2 axes, staggered?
6. [ ] **Telegraph audit:** every threat type has a visible 0.4–0.8s warning?
7. [ ] **Spawn fairness:** no spawn can hit within 0.5s; time-to-impact ≥0.7s
   everywhere (test at max difficulty)?
8. [ ] **Rubber-band:** die twice fast on purpose — does the next run feel
   easier (×0.85), and does "Try Easy?" appear on the overlay?
9. [ ] **Good death:** play to death at full skill — did it take 4–8 minutes,
   and did you know exactly what killed you?
10. [ ] **Retry pull:** after dying, did you press restart without thinking?
    If you hesitated, the arc is wrong — fix before shipping.

A game failing any line does not ship.
