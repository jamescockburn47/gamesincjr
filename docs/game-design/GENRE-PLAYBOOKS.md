# GENRE PLAYBOOKS — Games Inc Jr

**Purpose:** Twelve genre skeletons that stop games shipping as single-mechanic loops.
**When to load:** BEFORE building a new game, or when fixing a game the audit flagged as shallow.
**How to use:** Find your genre. Implement the core loop AND the canonical second mechanic — the second mechanic is not optional. Pick at least two escalation patterns and one set-piece. Parameters extend `GAMEPLAY_PRESETS` in `/public/game-framework/game-utils.js`; where a preset exists, these numbers match it.
**Companion files:** ENEMY-BEHAVIOUR-PATTERNS.md (enemy AI), META-PROGRESSION-PATTERNS.md (unlocks).

**The universal rule:** a game is shallow when the player makes no decisions. Every genre below adds a *decision* (risk it or bank it, lane or grapple, block or dodge), not just more stuff to dodge.

---

## 1. Runner

- **Core loop:** Auto-scroll forward; jump/duck obstacles; survive as distance-score climbs.
- **Second mechanic:** Lane-switching (3 lanes, up/down or left/right) OR a grapple/dash in addition to jump. One evasion verb = shallow; two verbs that solve *different* obstacle shapes = decisions.
- **Escalation beyond "faster":**
  1. Obstacle pairs that force a specific verb order (low bar then gap → duck-then-jump).
  2. Terrain change every 30 s: ground becomes ice (momentum), water (slower jump), crumbling tiles.
  3. A chasing threat that closes in when you slow down (collect pickups to push it back).
- **Set-pieces:** (a) Tunnel section — ceiling drops, duck-only for 5 s, telegraphed by darkening screen edge. (b) Bridge collapse — tiles fall 0.6 s after you touch them, forcing constant motion.
- **Failure modes:**
  - Unreactable spawns → guarantee ≥ 0.9 s between obstacle and player at current speed (`gap = speed * 0.9` px minimum).
  - Jump solves everything → at least 30% of obstacles must require the second verb.
- **Parameters** (matches `GAMEPLAY_PRESETS.runner`):

  | Param | Value |
  |---|---|
  | obstacleSpeedStart / Max | 240 / 440 px/s |
  | speedRamp | 15 px/s per second |
  | gravity / jumpVelocity | 900 px/s² / −520 px/s |
  | laneSwitchTime | 0.12 s (snappy) |
  | hitbox | AABB 0.75 |

## 2. Shmup / Shooter

- **Core loop:** Move and shoot; destroy waves; dodge enemy fire.
- **Second mechanic:** A charge shot or bomb with a cost (charge time / limited stock) — the decision is *when to spend it*. Alternatively: graze bonus (near-miss bullets = extra score) to reward brave positioning.
- **Escalation beyond "faster":**
  1. New enemy behaviour per minute — introduce from ENEMY-BEHAVIOUR-PATTERNS in order: Patroller → Swooper → Turret → Shielder.
  2. Bullet patterns change shape: single → aimed → 3-way fan → slow wall with a gap.
  3. Screen constraint: safe zone shrinks or asteroid field drifts through for 15 s.
- **Set-pieces:** (a) Miniboss every 60 s — big HP pool, two attack patterns, drops a power-up. (b) Wave siren — 5 s warning, then a dense scripted formation (V-shape, spiral) worth 3× points.
- **Failure modes:**
  - Enemies just drift down → every enemy needs a behaviour from the patterns file; "move toward player" alone is banned.
  - Player camps one spot → aimed shots and Swoopers force movement.
- **Parameters** (matches `GAMEPLAY_PRESETS.shmup`):

  | Param | Value |
  |---|---|
  | playerSpeed / Accel / Damp | 380 px/s / 820 px/s² / 0.90 |
  | hitbox | circle, r = 30% of sprite width |
  | enemySpeed | 130 → 280 px/s |
  | bulletSpeed | 380 px/s |
  | spawnInterval | 2.0 s → 0.55 s floor |
  | chargeShotTime / bombStock | 1.2 s / 3 per run |

## 3. Catcher

- **Core loop:** Move along the bottom; catch good falling objects; avoid bad ones.
- **Second mechanic:** Catch AND throw back / bank risk. Either thrown catches score double against airborne targets, or a combo meter builds while you hold a "carry" — bank it at a drop zone or lose it on a miss. The decision: hold for more, or cash out.
- **Escalation beyond "faster":**
  1. Telegraphed wave patterns replace random rain: zigzag columns, walls with one gap, alternating good/bad lanes.
  2. Wind — falling objects drift sideways, drift direction shown by background particles.
  3. Object types with rules: bombs (never catch), gold (falls 1.5× speed), balloons (float back up if missed).
- **Set-pieces:** (a) Frenzy — 8 s of 3× spawn rate, all good objects, announced with a flash. (b) Boss dropper — a character at the top who deliberately aims bad objects at your position (leads your movement).
- **Failure modes:**
  - Fully random spawns = no decisions → use telegraphed waves; show a spawn indicator (shadow / arrow) at the top 0.6 s before each drop.
  - Standing still wins → spawn positions must sometimes span > playerSpeed reach, forcing triage: you *cannot* catch everything, choose the valuable one.
- **Parameters** (matches `GAMEPLAY_PRESETS.catcher`):

  | Param | Value |
  |---|---|
  | playerSpeed | 380 px/s |
  | objectFall | 160 → 340 px/s |
  | spawnRate | 1.2/s → 4.0/s cap |
  | hitbox | AABB 0.80 |
  | comboBankWindow | 5 s hold before decay |

## 4. Lander / Physics

- **Core loop:** Thrust against gravity; land softly on a pad; manage fuel.
- **Second mechanic:** Fuel as a spendable resource with pickups placed in risky spots — the decision is detour-for-fuel vs straight-to-pad. Or cargo: heavier load = more score but worse handling.
- **Escalation beyond "faster":**
  1. Terrain: caves, narrow shafts, overhangs that block vertical descent.
  2. Moving pads / pads that only open on a timed cycle.
  3. Environmental force: wind gusts (telegraphed by particle streaks 1 s before), gravity wells.
- **Set-pieces:** (a) Rescue run — land, pick up a stranded character (+weight), fly out. (b) Blackout zone — lights dim, only your lamp radius visible for one descent.
- **Failure modes:**
  - Binary crash/perfect → grade landings: vy < 60 px/s = perfect (2×), < 120 = rough (1×), above = crash. Show the threshold on the HUD.
  - Boring flat maps → every level needs ≥ 1 overhang or shaft.
- **Parameters** (extension — no preset exists):

  | Param | Value |
  |---|---|
  | gravity | 120 px/s² (floaty, not platformer gravity) |
  | thrust | 260 px/s² |
  | rotateSpeed | 3.0 rad/s |
  | safeLandingVy / Vx | 60 / 40 px/s |
  | fuelBurn / tank | 12 units/s / 100 units |

## 5. Platformer / Brawler

- **Core loop:** Run, jump, hit enemies; clear the screen or reach the exit.
- **Second mechanic:** A block/parry or stomp-bounce. Parry (0.25 s window) reflects projectiles; stomp-bounce chains enemies for combo score. The decision: engage or evade, and in which order.
- **Escalation beyond "faster":**
  1. Enemy mix per ENEMY-BEHAVIOUR-PATTERNS: add Shielder (must hit from behind) and Ambusher.
  2. Arena hazards: spike floors on a cycle, moving platforms, one-way drops.
  3. Rule twist: lights-out round, low-gravity round, "lava rises" round.
- **Set-pieces:** (a) Gauntlet door — survive 3 waves in a locked arena, door opens with fanfare. (b) Duel boss — single enemy with 3 telegraphed attacks and a punish window after each.
- **Failure modes:**
  - Enemies walk into your attack → give them the 0.4–0.8 s telegraph and a retreat step after being hit.
  - Jump-spam wins → some enemies hit upward (anti-air telegraph), forcing ground play.
- **Parameters** (matches `GAMEPLAY_PRESETS.platformer`):

  | Param | Value |
  |---|---|
  | runSpeed / jumpVelocity / gravity | 260 px/s / −520 px/s / 780 px/s² |
  | coyoteTime / jumpBuffer | 0.08 s / 0.10 s |
  | hitbox | AABB 0.70 |
  | attackActive / recovery | 0.15 s / 0.25 s |
  | parryWindow | 0.25 s |

## 6. Tower Defence

- **Core loop:** Place towers along a path; towers auto-fire; stop creeps reaching the exit; earn gold per kill.
- **Second mechanic:** An active player verb between placements — a tap-to-cast slow field or a hero unit you steer. Pure place-and-watch is shallow; the player must *do* something during waves.
- **Escalation beyond "faster":**
  1. Creep types that counter tower types: armoured (resists rapid-fire), fast (dodges slow projectiles), flying (needs anti-air), healer (support — kill first).
  2. Path change: a second entrance opens at wave 8.
  3. Economy twist: bounty decay — kill creeps early on the path for full gold, late for half.
- **Set-pieces:** (a) Boss creep with a shield that only the player's active ability breaks. (b) Night wave — tower range halved, sell/reposition decisions.
- **Failure modes:**
  - One tower type dominates → enforce rock-paper-scissors: each creep type takes ≤ 50% damage from its "wrong" tower.
  - No wave preview = no planning → always show next-wave composition icons before it starts.
- **Parameters** (extension):

  | Param | Value |
  |---|---|
  | creepSpeed | 60–140 px/s by type |
  | waveInterval / prepTime | 20 s / 8 s preview |
  | towerRange | 120–200 px |
  | startGold / kill bounty | 100 / 5–20 |
  | wavesToWin | 15 (endless mode after) |

## 7. Puzzle-Grid

- **Core loop:** Manipulate tiles on a grid (match, slide, rotate) to hit a target before moves/time run out.
- **Second mechanic:** Chain/cascade planning — matches drop new tiles that can auto-match; show a subtle highlight of what a move *would* clear so kids learn to plan two steps. The decision: quick match vs setting up a cascade.
- **Escalation beyond "faster":**
  1. Blocker tiles: stone (cleared by adjacent matches), ice (two hits), spreading goo (grows 1 tile per 3 moves if not cleared).
  2. Objective change per level: score target → clear all blockers → bring an item to the bottom.
  3. Grid shape changes: holes, L-shapes, moving conveyor rows.
- **Set-pieces:** (a) Puzzle boss — a creature occupying 2×2 cells that heals unless you match its colour each turn. (b) Rush round — 30 s, no move limit, cascades score triple.
- **Failure modes:**
  - No valid move detection → always check; auto-shuffle with a "No moves — shuffling!" toast, never a silent freeze.
  - Random board = random outcome → seed the first 10 boards per level so difficulty is designed, not lucky.
- **Parameters** (extension):

  | Param | Value |
  |---|---|
  | grid | 7×8 at 800×600 (tiles ~64 px) |
  | swapAnim / fallSpeed | 0.15 s / 900 px/s |
  | movesPerLevel | 20–30 |
  | cascadeBonus | ×1.5 per chain step, cap ×4 |

## 8. Racing

- **Core loop:** Steer along a scrolling track; avoid traffic/walls; finish laps or survive the timer.
- **Second mechanic:** Boost with a cost — a meter filled by near-misses or drift, spent for a burst. The decision: drive dangerously to earn boost, spend it now or save for the straight.
- **Escalation beyond "faster":**
  1. Track surface: oil slicks (steering ×0.3 for 1 s), dirt sections (top speed −30%), narrowing lanes.
  2. Rival AI that rubber-bands — always beatable but never absent (speed = player speed ± 12%).
  3. Weather round: rain reduces grip, shown by visual + wider drift.
- **Set-pieces:** (a) Overtake challenge — pass 5 cars in 20 s for a medal. (b) Tunnel — narrow, dark, oncoming traffic with headlight telegraphs.
- **Failure modes:**
  - Crash = full stop = rage → crashes cost speed (drop to 40%) and 0.5 s control loss, not a restart.
  - No opponent = no race → even endless mode needs a ghost (best-run replay from localStorage) or rival car.
- **Parameters** (extension):

  | Param | Value |
  |---|---|
  | topSpeed / accel | 520 px/s / 300 px/s² |
  | steer | 380 px/s lateral |
  | boost | +60% for 1.5 s, meter fills in ~3 near-misses |
  | nearMissWindow | pass within 24 px |
  | trafficSpeed | 200–320 px/s |

## 9. Stealth

- **Core loop:** Move through a level; stay out of guard vision cones; reach the goal.
- **Second mechanic:** A distraction verb — throw a pebble (click/tap target) that pulls guards to the noise point for 3 s. The decision: sneak past, or manipulate the route.
- **Escalation beyond "faster":**
  1. Guard types: static Turret-watcher, Patroller with route, Chaser that investigates last-seen position.
  2. Environment: light/shadow zones (detection radius halves in shadow), noisy floors (gravel telegraphed visually — walking on it pings guards).
  3. Objective twist: steal 3 items, each theft raises alert level (guards +20% vision).
- **Set-pieces:** (a) Camera corridor — rotating vision cones on fixed timers, pure rhythm puzzle. (b) Escape sequence — after final theft, alarms on, exit route now guarded, distraction stock refilled.
- **Failure modes:**
  - Instant detection = instant fail = frustration → use a 0.8 s "?" suspicion fill before "!" detection; player can duck out mid-fill.
  - Invisible rules → ALWAYS draw vision cones (semi-transparent), always show noise radius rings when a sound is made.
- **Parameters** (extension):

  | Param | Value |
  |---|---|
  | playerWalk / sneak | 220 / 120 px/s |
  | guardPatrol / chase | 100 / 260 px/s |
  | visionCone | 70°, 180 px range (90 px in shadow) |
  | suspicionTime | 0.8 s to detect |
  | distractionStock | 3, +1 per checkpoint |

## 10. Snake-like

- **Core loop:** Steer an ever-growing snake to food; do not hit walls or your own tail.
- **Second mechanic:** A risk-shed verb — dash (brief speed burst, phases through your own tail once) OR shed (deliberately drop 3 segments as a wall behind you, losing banked points). Length becomes a currency, not just a doom clock.
- **Escalation beyond "faster":**
  1. Food types: gold apple (3 segments + big score, spawns in corners), shrink berry (−2 segments, decide if you need it).
  2. Arena change every 10 food: walls appear, wrap-around edges toggle, a moving hazard block.
  3. A rival snake (AI using Chaser pattern with turn-rate cap) competing for the same food.
- **Set-pieces:** (a) Feeding frenzy — 10 food items at once for 8 s. (b) Maze round — arena fills with walls, food placed at dead ends.
- **Failure modes:**
  - Grid-instant turns feel unfair at speed → queue exactly one input per grid cell; never drop inputs.
  - Late game = pure length management, no fun → that's what shed/dash exists for; do not ship without it.
- **Parameters** (extension):

  | Param | Value |
  |---|---|
  | cell / grid | 32 px, 25×18 |
  | moveInterval | 0.16 s → 0.09 s floor (this is the ONE genre where interval ramp = speed ramp) |
  | segmentsPerFood | 1 (gold: 3) |
  | dashCooldown | 6 s |

## 11. Breakout

- **Core loop:** Bounce a ball off a paddle to break bricks; don't drop the ball.
- **Second mechanic:** Aim control + catch — ball direction depends on paddle contact point (edge hits = sharper angle), plus a "sticky catch" (hold to catch, release to aim-launch, 3 uses per life). Turns rally-watching into shot-making.
- **Escalation beyond "faster":**
  1. Brick types: steel (2 hits), explosive (clears 3×3), moving brick rows, regenerating bricks (10 s).
  2. Power-ups falling from bricks: multi-ball, wide paddle, laser (choice: risky move to collect vs keeping position).
  3. Level geometry: bricks in shapes with protected pockets requiring angled shots.
- **Set-pieces:** (a) Brick boss — a large multi-brick creature whose weak point is exposed for 3 s after you break its armour row. (b) Invader level — brick formation slowly descends; clear it before it reaches paddle height.
- **Failure modes:**
  - Endless shallow-angle rally → if |vy| < 90 px/s after a bounce, nudge vy toward 90 (keep speed constant).
  - Last-brick hunting is boring → after 20 s with ≤ 3 bricks left, spawn a magnet power-up or make remaining bricks flash and grow 20%.
- **Parameters** (matches `GAMEPLAY_PRESETS.breakout`):

  | Param | Value |
  |---|---|
  | paddleSpeed | 420 px/s |
  | ballSpeed | 340 → 600 px/s |
  | hitbox | exact (1.0) — the physics is the challenge |
  | speedGainPerPaddleHit | +6 px/s |
  | stickyUses | 3 per life |

## 12. Arena-Survivor (autobattler-lite)

- **Core loop:** Move in an open arena; weapons fire automatically; survive escalating swarms; collect XP gems from kills.
- **Second mechanic:** Level-up choice — every XP threshold, pause and offer 3 upgrade cards (new weapon / upgrade existing / passive). Movement is the skill; builds are the decisions.
- **Escalation beyond "faster":**
  1. Timed enemy phases (every 60 s): swarm of weak Chasers → ring of Zoners closing in → Elite pack with a Leader.
  2. Arena events: a chest guarded by an Ambusher pack; a shrinking safe circle for 20 s.
  3. Enemy density waves — quiet 10 s (collect gems) then surge, so pacing breathes.
- **Set-pieces:** (a) Minute-boss — every 3 minutes an Elite with a name banner, drops a chest with a guaranteed new weapon. (b) Final stand — at 10:00, all enemy types at once for 30 s, survive to "win" the run.
- **Failure modes:**
  - Upgrades that are just "+5% damage" feel like nothing → every card must be visible on screen (new projectile, bigger area, extra orbit) within 2 s of picking it.
  - Kiting in a circle solves everything → Zoners and Swoopers cut the orbit; spawn some enemies AHEAD of the player's movement direction.
- **Parameters** (extension; player movement per shmup preset):

  | Param | Value |
  |---|---|
  | playerSpeed | 300 px/s (slower than shmup — positioning game) |
  | enemyCount cap | 60 on screen (pool objects, no O(n²) — use a spatial grid for collisions) |
  | xpToLevel | 10, ×1.4 per level |
  | levelUpChoices | 3 cards, max 4 weapons + 4 passives |
  | runLength | 10 minutes |

---

## Cross-genre checklist (apply to every game)

- [ ] Second mechanic implemented — not just planned
- [ ] At least 2 escalation patterns that are NOT "numbers go up"
- [ ] One set-piece reachable within the first 90 s of play
- [ ] Every threat telegraphed (see ENEMY-BEHAVIOUR-PATTERNS §Telegraphing)
- [ ] At least 3 unlockables + visible next goal (see META-PROGRESSION-PATTERNS)
- [ ] All movement × dt, speeds in px/s, presets used as starting values
