# META-PROGRESSION PATTERNS — Games Inc Jr

**Purpose:** Progression patterns that work in a static, single-file HTML game using only `localStorage` — no server, no accounts. Fixes the audit finding of "zero meta-progression".
**When to load:** When building any new game, or retrofitting progression into an existing one.
**Hard rule:** every game must ship with **at least 3 unlockables** and a **visible "next goal"** on the HUD or game-over screen. A game with nothing to come back for is not finished.
**Storage:** one namespaced key per game: `gij-meta:<slug>` (JSON blob). Never touch the engine's own `gij_hs_<slug>` high-score key — the framework owns that.

---

## Storage rules

1. **One key, one JSON object.** Read once at boot, write on change. Always wrap in try/catch — localStorage is unavailable in sandboxed iframes (the engine does the same, see `game-engine.js` setup()).
2. **Version the schema** (`v: 1`) so a later game update can migrate instead of wiping progress.
3. **Never store anything personal.** Scores, flags, dates, counts only.
4. **Fail soft.** If storage is unavailable, the game plays normally with progression silently disabled — never an error, never a broken overlay.

```javascript
const META_KEY = 'gij-meta:' + GAME.slug;
function loadMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || defaultMeta(); }
  catch (e) { return defaultMeta(); }
}
function saveMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
}
```

---

## Pattern 1: Milestone unlocks

Score / distance / kill-count thresholds unlock cosmetic or mode content. Cheap to build, works in every genre.

| Unlock type | Cost to build | Example |
|---|---|---|
| Colour palette / skin | Trivial — swap a colour table in onRender | "Sunset ship" at 500 pts |
| Character variant | Low — same hitbox, different sprite draw | "Ninja frog" at 1,000 pts |
| Starting perk | Low — one extra life / +10% speed | "Head start" after 10 runs |
| New mode | Medium — a rule flag in onUpdate | "Mirror mode" at 2,500 pts |
| Secret enemy/level | Medium | "Gold gauntlet" for gold badge |

Rules:
- **First unlock within the first 2–3 runs.** A new player must taste the system early — set threshold #1 around 60–70% of a typical first-session best.
- **Thresholds roughly ×2.5 apart** (e.g. 300 / 750 / 2,000): early ones fall fast, later ones are aspirations.
- **Cosmetics before power.** Palettes and skins can never break balance; perks must stay small (≤ 10% effect) so leaderboards stay honest.
- Unlocks are checked at `endGame()` time against the run's score AND lifetime stats (total runs, total kills) — some goals should reward persistence, not skill.

## Pattern 2: Mastery badges (3 per game)

Exactly three badges — bronze / silver / gold — per game, each with a **named, specific criterion** shown to the player from the start. Not "score more": badges test *skill dimensions*.

| Tier | Design intent | Example (catcher) | Example (shmup) |
|---|---|---|---|
| Bronze | Completion — almost everyone gets it | Catch 25 in one run | Survive 60 s |
| Silver | Competence — a session or two of practice | 10-catch streak, no misses | Kill a Shielder from behind 5× |
| Gold | Mastery — bragging rights | Bank a ×8 combo | Beat the 3-min boss without bombs |

Rules:
- Gold must be *hard but describable in one sentence*. If you can't state it plainly, a 10-year-old can't chase it.
- Badges display on the game-over overlay every run: earned = full colour, unearned = grey silhouette with its criterion text. The grey badge IS the advertising.
- Store as `badges: { bronze: true, silver: false, gold: false }` plus `badgeDates` if you want to show "earned 3 Jul".

## Pattern 3: Daily challenge seed

A date-seeded RNG variant: everyone playing today gets the same spawn pattern; the daily best is tracked separately.

```javascript
// Deterministic seeded RNG (mulberry32) — REPLACES Math.random for spawns
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const today  = new Date().toISOString().slice(0, 10);       // '2026-07-05'
const seed   = [...today].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) | 0;
const dailyRand = mulberry32(seed);
// In daily mode: use dailyRand() for ALL spawn decisions; never Math.random.
// Daily best under its own key so it resets naturally each day:
//   meta.daily = { date: today, best: 0 }
// On boot: if (meta.daily.date !== today) meta.daily = { date: today, best: 0 };
```

Rules:
- Daily mode is itself a good **unlockable** (e.g. unlocks after 3 runs).
- Add one date-derived rule twist for flavour: `seed % 3 === 0` → double spawn rate, `=== 1` → low gravity, `=== 2` → normal. Announce it: "Today's twist: MOON GRAVITY".
- The engine still submits the score via `game.endGame()`; keep the daily best in meta as the local comparison. If a separate leaderboard is wanted later, the API can key on `slug + ':daily:' + date` — do not build server code in the game file.

## Pattern 4: Streak / best-run tracking

Lifetime stats cost almost nothing and give the game-over screen something to say beyond "Score: 120".

Track in meta: `totalRuns`, `totalScore`, `bestScore` (mirror of engine's), `bestTime`, `currentImproveStreak` (consecutive runs beating the previous run), `playDates` (last 7 ISO dates for a played-days streak).

- Show ONE stat per game-over, rotating: "Run #14", "That's your 3rd best!", "2 runs in a row improving!". One line, not a spreadsheet.
- Improvement streaks matter more than calendar streaks at this age — never guilt a child for missing a day. Calendar streaks display as a friendly count, never as a loss ("Played 3 days this week!"), and never gate content.

## Pattern 5: Unlock celebration moment

An unlock the player doesn't *feel* may as well not exist. When a threshold is crossed:

1. **In-run (non-blocking):** small banner slides in at the top for 2.5 s — "NEW: Sunset palette!" — with `particles.burst(game.W/2, 80, 30, { colors: ['#ffd700','#ffffff'] })` and `game.shake(3, 0.15)`. Do NOT pause gameplay.
2. **At game-over (the ceremony):** on the `gij-gameover-overlay`, show the unlock card — icon, name, "TAP TO EQUIP". Fire a second, bigger burst when the overlay appears.
3. **Persist immediately** (`saveMeta`) at the moment of unlock, not at game over — a closed tab must not eat an unlock.
4. One celebration per unlock, ever: `celebrated: true` flag per unlock id.

## Pattern 6: "Next goal" HUD element

The player must ALWAYS see their next target. Add one line to `#gij-hud` (a `<span id="meta-goal">`) or draw it in onRender:

- Format: `★ Next: <thing> — <number to go>` e.g. `★ Next: Ninja Frog — 240 pts to go`.
- Choose the NEAREST unmet goal across all systems (next milestone, next badge, daily best). Recompute when score changes; update the countdown live — watching "60 to go" tick down is the hook.
- When the last unlock is earned, switch to "Beat your best: 2,410" — the goal line never goes blank.
- Also show it on the game-over overlay: "So close! Ninja Frog needs 90 more."

---

## Worked example — complete schema + unlock system

### localStorage schema (`gij-meta:<slug>`, v1)

```json
{
  "v": 1,
  "totalRuns": 14,
  "totalScore": 8420,
  "bestScore": 1180,
  "improveStreak": 2,
  "playDates": ["2026-07-03", "2026-07-04", "2026-07-05"],
  "unlocks": {
    "palette-sunset": { "earned": true,  "celebrated": true  },
    "char-ninja":     { "earned": false, "celebrated": false },
    "mode-mirror":    { "earned": false, "celebrated": false },
    "mode-daily":     { "earned": true,  "celebrated": true  }
  },
  "equipped": { "palette": "palette-sunset", "char": "default" },
  "badges": { "bronze": true, "silver": false, "gold": false },
  "daily": { "date": "2026-07-05", "best": 640 }
}
```

### Unlock system pseudocode (~30 lines — copy into any game)

```javascript
const UNLOCKS = [   // define per game — MINIMUM THREE
  { id: 'palette-sunset', name: 'Sunset Palette', type: 'score',   need: 300  },
  { id: 'char-ninja',     name: 'Ninja Frog',     type: 'score',   need: 750  },
  { id: 'mode-daily',     name: 'Daily Challenge',type: 'runs',    need: 3    },
  { id: 'mode-mirror',    name: 'Mirror Mode',    type: 'score',   need: 2000 },
];
let meta = loadMeta();

function progressOf(u) {                     // current value for a goal type
  if (u.type === 'score') return Math.max(game.getScore(), meta.bestScore);
  if (u.type === 'runs')  return meta.totalRuns;
  return 0;
}
function checkUnlocks() {                    // call on addScore events + endGame
  for (const u of UNLOCKS) {
    const slot = meta.unlocks[u.id] || (meta.unlocks[u.id] = { earned: false, celebrated: false });
    if (!slot.earned && progressOf(u) >= u.need) {
      slot.earned = true;
      saveMeta(meta);                        // persist IMMEDIATELY
      showUnlockBanner(u.name);              // 2.5 s banner, non-blocking
      particles.burst(game.W / 2, 80, 30, { colors: ['#ffd700', '#ffffff'] });
      game.shake(3, 0.15);
    }
  }
}
function nextGoal() {                        // feeds the HUD line every frame
  const locked = UNLOCKS.filter(u => !meta.unlocks[u.id]?.earned)
                        .sort((a, b) => (a.need - progressOf(a)) - (b.need - progressOf(b)));
  if (!locked.length) return 'Beat your best: ' + meta.bestScore;
  const u = locked[0];
  return '★ Next: ' + u.name + ' — ' + Math.max(0, u.need - progressOf(u)) + ' to go';
}
// Wiring: game.onRestart(() => { meta.totalRuns++; saveMeta(meta); });
//   inside onUpdate: goalEl.textContent = nextGoal();  checkUnlocks();
//   at endGame: update bestScore/improveStreak/daily.best in meta, saveMeta(meta).
```

---

## Ship checklist (progression)

- [ ] `gij-meta:<slug>` key, versioned, try/catch on every read/write
- [ ] ≥ 3 unlockables defined; first one reachable within ~2–3 runs
- [ ] 3 badges (bronze/silver/gold) with one-sentence criteria, greyed until earned
- [ ] "Next goal" line visible in HUD and on game-over — never blank
- [ ] Unlock celebration: banner + particles in-run, card at game-over, saved instantly
- [ ] Game-over shows one rotating lifetime stat
- [ ] Engine's `gij_hs_<slug>` key untouched; scores still flow through `game.addScore()` / `game.endGame()`
- [ ] Game still works perfectly if localStorage throws (sandboxed iframe)
