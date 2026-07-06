# VARIETY-MATRIX — The Anti-Clone Device

**Purpose:** Stop the library filling with reskinned dodge-games. Every new game is built
by picking coordinates on three orthogonal axes. The combinatorial space is 12 × 20 × 15 =
3,600 distinct games — none of which needs 3D.

**When to load:** whenever creating a NEW game, or when an existing game needs a variant
mode. Use with GENRE-PLAYBOOKS.md (the skeleton's parameters) and DEPTH-STANDARD.md (the gate).

---

## The rule

> A new game must differ from EVERY existing library game on **at least 2 of the 3 axes**.

Check `src/data/games.json` and this file's ledger (below) before choosing. Same skeleton +
same theme with only a twist changed = rejected.

---

## Axis 1 — Genre skeleton (pick 1 of 12)

Full parameters for each are in GENRE-PLAYBOOKS.md.

1. **Runner** — auto-scroll, dodge/jump, distance score
2. **Shmup** — move + shoot incoming waves
3. **Catcher** — intercept falling/moving objects
4. **Lander** — thrust + gravity, precision landing
5. **Platformer/Brawler** — run, jump, melee
6. **Tower-defence** — place static defenders against paths of enemies
7. **Puzzle-grid** — tile/grid logic under gentle time pressure
8. **Racing** — laps, rivals, racing line
9. **Stealth** — avoid vision cones, reach goal
10. **Snake-like** — growing body/trail is both asset and hazard
11. **Breakout** — ball, paddle, destructible field
12. **Arena-survivor** — open arena, escalating swarms, auto or manual attacks

## Axis 2 — Rule twist (pick 1–2 of 20)

The twist mutates the skeleton's rules. One twist is mandatory for every new game; two for
a skeleton that already appears twice in the library.

1. **Gravity flips** on a timer or by player action
2. **You are the boss** — control the big slow powerful one against many small heroes
3. **Inverted controls zone** — areas/pickups that mirror input (telegraphed!)
4. **Two characters, one input** — both move together; keep both alive
5. **Darkness + light radius** — you only see near yourself; light is a resource
6. **Time rewind** — one 3-second undo on a long cooldown
7. **Size matters** — eating/growing changes speed, hitbox, and what you can break
8. **Paint the terrain** — your trail changes the ground (speeds you, blocks enemies)
9. **One bullet** — a single projectile you must recover to fire again
10. **Body count** — every defeated enemy leaves a corpse/block that alters the arena
11. **Day/night cycle** — two rule-sets alternate every ~40s (enemies sleep/wake)
12. **Magnet polarity** — attract/repel toggle instead of direct movement
13. **Fragile scoring** — points carried as cargo; you must bank them at a zone
14. **Shared health** — you and your objective/pet share one health pool
15. **Momentum only** — no direct braking; steer by bouncing/swinging
16. **Clone delay** — a copy of you replays your moves 5s later (dodge yourself)
17. **Build-then-run** — 20s placing helpers/traps, then 40s of live action, repeat
18. **Sticky walls** — climb any surface, but enemies can too
19. **Swap on hit** — taking damage swaps you with the nearest enemy's position
20. **Crowd control** — you herd/escort many small units rather than one avatar

## Axis 3 — Theme & tone (pick 1 of 15)

Theme drives palette, sprite language, particle flavour and audio character — see
JUICE-CHECKLIST.md. Never default to space twice in a row.

1. Deep sea / bioluminescence
2. Haunted library (silly-spooky, not scary)
3. Kitchen chaos (food, sauce, toast)
4. Ancient ruins & vines
5. Arctic / aurora
6. Neon city rooftops
7. Insect world (blades of grass are trees)
8. Cloud kingdom
9. Volcano forge
10. Toy box / miniatures
11. Wild west robots
12. Enchanted forest (fits Magic Friends characters: Luna, Shadow, Oak, Spark, Coral, Ember)
13. Space (rationed — the library is saturated with it)
14. Candy planet
15. Yorkshire moors (cross-promo with Moorstead: drystone walls, sheep, weather)

---

## Worked examples

- **Catcher × Fragile scoring × Kitchen chaos** → "Order Up!": catch falling ingredients,
  carry them (slower with full hands) to the serving hatch to bank points; dropped sauce
  makes floor slippery. Two verbs (catch, bank), decisions every trip.
- **Snake-like × Paint the terrain × Arctic** → your ice-trail freezes water so friends
  can cross, but enemies skate faster on it. The trail is the strategy.
- **Stealth × Darkness + light radius × Haunted library** → your candle reveals ghosts but
  attracts them; blow it out to hide, relight to move.
- **Arena-survivor × You are the boss × Toy box** → you're the wind-up dinosaur; waves of
  toy soldiers march in; your stomps are slow and telegraphed — power vs agility.

## Ledger — current library coordinates (update when adding games)

| Game | Skeleton | Twist | Theme | Depth pass |
|---|---|---|---|---|
| Frog Cross Dash | Runner (lane-hop) | Day/night cycle | River/road | ✅ Jul-26 (night phase, current, heron set-piece, unlocks) |
| Alien Unicorn Alliance | Shmup | Cooldown economy | Space | ✅ Jul-26 (crystal-fed pulse, 3 drone behaviours, carrier boss) |
| Neon Invaders | Shmup | Shield-as-2nd-verb | Space/neon | ✅ Jul-26 (energy shield + overdrive beam, divers, mothership) |
| Vector Asteroids | Shmup (inertia) | Momentum only | Space | ✅ Jul-26 (UFO turret, power-ups, boss rock, comet risk/reward) |
| Turbo Outracer | Racing | Boost-meter timing | Circuit/rain | ✅ Jul-26 (spend-boost, rival racecraft, 3 tracks) |
| Banana Bonanza | Catcher | none | Jungle | — |
| Tower Frenzy '90 | Puzzle-grid (stack) | none | Retro | — |
| Rogue Dungeon Mini | Arena-survivor | none | Dungeon | — |
| Gravity/Cargo Lander | Lander | none | Space | — |
| Pixel Pac Run / Space Runner | Runner | none | Maze/space | — |
| Robots vs Unicorns | Platformer | none | Fantasy | — |
| Brick Blitz '84 | Breakout | none | Retro | — |

The 5 flagship games got the July 2026 depth pass (DEPTH-STANDARD + JUICE + audio +
meta-progression). The remaining games are the next remediation batch. Note the pattern:
space still over-represented — new games must diversify theme, and every new game must fill
all three axis columns before coding starts.
