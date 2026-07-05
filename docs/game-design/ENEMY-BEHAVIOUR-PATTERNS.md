# ENEMY BEHAVIOUR PATTERNS — Games Inc Jr

**Purpose:** Twelve reusable enemy behaviours with framework-API pseudocode, so no game ever ships with enemies that only "move toward player".
**When to load:** Whenever writing or fixing enemy code in any game.
**How to use:** Store `behaviour` as a string on each enemy object and switch on it in `game.onUpdate(dt)`. All speeds px/s, all timers −= dt. Copy the pseudocode, keep the numbers as starting values.
**Hard rule:** every game needs ≥ 3 distinct behaviours from this file. "Drift downward" or "chase player" alone is banned.

Conventions used below: `e` = enemy object, `player` = player object, `dt` = fixed 1/60 s step. Angles via `GameUtils.angle`, distances via `GameUtils.distance`. Enemy speeds should sit in the 130–280 px/s band (`GAMEPLAY_PRESETS.shmup.enemySpeedMin/Max`) unless noted.

---

## TELEGRAPHING — read this first

At the 8–12 age band, **every attack needs a 0.4–0.8 s visible wind-up** before it can hurt the player. No exceptions. A hit the player could not see coming teaches them the game is unfair, and they stop playing.

Telegraph rules:

1. **Duration:** 0.4 s minimum (fast attacks), 0.8 s for lunges, big projectiles, and anything off-screen-edge.
2. **Visual channel:** change the enemy itself — flash, swell (scale ×1.15), colour shift to warm (red/orange), or draw an aim line / target ring where the attack will land. Particles alone are not enough.
3. **During the telegraph the enemy is committed:** it stops re-aiming at the player. This is what makes dodging *work* — the player moves, the attack lands where they were.
4. **After the attack: a recovery pause** (0.3–0.5 s) where the enemy is vulnerable. Telegraph → attack → recovery is the universal rhythm.

```javascript
// Universal telegraph state machine (embed in any attacking behaviour)
// e.phase: 'idle' | 'windup' | 'attack' | 'recover'
if (e.phase === 'windup') {
  e.timer -= dt;
  e.flash = Math.sin(e.timer * 30) > 0;        // draw brighter when true
  if (e.timer <= 0) { e.phase = 'attack'; doAttack(e); e.timer = 0.2; }
} else if (e.phase === 'attack') {
  e.timer -= dt;
  if (e.timer <= 0) { e.phase = 'recover'; e.timer = 0.4; }
} else if (e.phase === 'recover') {
  e.timer -= dt;                                // vulnerable, no re-aim
  if (e.timer <= 0) e.phase = 'idle';
}
```

---

## 1. Patroller

Walks a fixed route; ignores the player. The "safe to learn" enemy — introduce it first.

```javascript
// e = { x, y, w, h, vx: 130, minX, maxX, behaviour: 'patrol' }
e.x += e.vx * dt;
if (e.x <= e.minX || e.x + e.w >= e.maxX) e.vx = -e.vx;
// Variant: vertical patrol, or waypoint list with index cycling.
// Face the direction of travel so kids can predict the turn.
```

## 2. Chaser (with max turn rate — MUST be dodgeable)

Homes on the player, but can only turn so fast. A raw `angle-to-player` chaser is undodgeable and banned.

```javascript
// e = { x, y, heading, speed: 180, turnRate: 2.2 /* rad/s */ }
const want = GameUtils.angle(e.x, e.y, player.x, player.y);
let diff = want - e.heading;
while (diff >  Math.PI) diff -= Math.PI * 2;
while (diff < -Math.PI) diff += Math.PI * 2;
e.heading += GameUtils.clamp(diff, -e.turnRate * dt, e.turnRate * dt);
e.x += Math.cos(e.heading) * e.speed * dt;
e.y += Math.sin(e.heading) * e.speed * dt;
// Tuning: player outruns it in a straight line only briefly (playerSpeed 380
// vs 180) but can ALWAYS escape by turning sharply — that is the skill.
```

## 3. Ambusher (telegraph then lunge)

Lurks still or slow; when the player enters range, winds up visibly, then lunges at a FIXED point (where the player was).

```javascript
// e = { x, y, state: 'lurk', timer: 0, lungeVx: 0, lungeVy: 0 }
if (e.state === 'lurk' && GameUtils.distance(e.x, e.y, player.x, player.y) < 200) {
  e.state = 'windup'; e.timer = 0.6;             // 0.6 s telegraph: swell + shake
}
else if (e.state === 'windup') {
  e.timer -= dt;
  if (e.timer <= 0) {                            // aim ONCE, at wind-up end
    const a = GameUtils.angle(e.x, e.y, player.x, player.y);
    e.lungeVx = Math.cos(a) * 520; e.lungeVy = Math.sin(a) * 520;
    e.state = 'lunge'; e.timer = 0.4;
  }
}
else if (e.state === 'lunge') {
  e.x += e.lungeVx * dt; e.y += e.lungeVy * dt; e.timer -= dt;
  if (e.timer <= 0) { e.state = 'recover'; e.timer = 0.5; } // vulnerable
}
else if (e.state === 'recover') { e.timer -= dt; if (e.timer <= 0) e.state = 'lurk'; }
```

## 4. Coward (flees when player near — worth more points)

Runs away from the player; caps at arena edges. Worth 3–5× a normal kill. Creates a chase-or-ignore decision.

```javascript
// e = { x, y, speed: 300, points: 50 }  — slightly slower than the player
const d = GameUtils.distance(e.x, e.y, player.x, player.y);
if (d < 260) {
  const a = GameUtils.angle(player.x, player.y, e.x, e.y);  // away vector
  e.x += Math.cos(a) * e.speed * dt;
  e.y += Math.sin(a) * e.speed * dt;
  GameUtils.clampToCanvas(e, game.W, game.H);   // corner it to catch it
}
// Despawns after 8 s if not caught — urgency, not clutter.
```

## 5. Shielder (invulnerable from the front)

Only takes damage from behind/side. Teaches positioning.

```javascript
// e = { x, y, facing: 1 }  — facing: 1 = right, -1 = left (or a heading angle)
// In the damage check:
function damageShielder(e, hitFromX) {
  const hitBehind = (e.facing === 1) ? (hitFromX < e.x) : (hitFromX > e.x);
  if (!hitBehind) {
    particles.burst(e.x, e.y, 4, { colors: ['#88ccff'], maxSpeed: 120 }); // "clink"
    return false;                                 // shield sparks, no damage
  }
  return true;
}
// Draw the shield explicitly on the facing side. Shielder turns to face the
// player SLOWLY (turnRate ~1.5 rad/s) so flanking is achievable.
```

## 6. Splitter (splits on death)

Dies into 2 smaller, faster children. Depth = kill it in open space, not in a corridor.

```javascript
function killSplitter(e, enemies) {
  particles.burst(e.x, e.y, 12, { colors: ['#aaffaa'] });
  game.addScore(e.points);
  if (e.gen < 2) {                                // max 2 generations — no infinite soup
    for (const dir of [-1, 1]) {
      enemies.push({ ...baseEnemy(),
        x: e.x + dir * 10, y: e.y,
        w: e.w * 0.6, h: e.h * 0.6,
        speed: e.speed * 1.3, gen: e.gen + 1,
        points: Math.floor(e.points / 2),
      });
    }
  }
}
```

## 7. Swooper (sine / arc path)

Crosses the screen on a wave — forces the player to time, not just aim.

```javascript
// e = { x, baseY, t: 0, speed: 200, amp: 90, freq: 2.0 }
e.t += dt;
e.x += e.speed * dt;                              // or -speed, entering from right
e.y  = e.baseY + Math.sin(e.t * e.freq * Math.PI * 2) * e.amp;
// Arc variant (dive-bomb): lerp along a quadratic from entry, through a point
// near the player's position AT SPAWN TIME (not tracked), back up to exit.
```

## 8. Turret (telegraphed shots)

Stationary; aims, locks, shows the line, then fires. The classic teaching tool for "watch the wind-up".

```javascript
// e = { x, y, state: 'aim', timer: 1.2, aimAngle: 0 }
if (e.state === 'aim') {
  e.aimAngle = GameUtils.angle(e.x, e.y, player.x, player.y); // tracks player
  e.timer -= dt;
  if (e.timer <= 0) { e.state = 'lock'; e.timer = 0.5; }      // 0.5 s telegraph
}
else if (e.state === 'lock') {                    // aim frozen — draw the laser line
  e.timer -= dt;                                  // render: dashed line along aimAngle
  if (e.timer <= 0) {
    bullets.push({ x: e.x, y: e.y,
      vx: Math.cos(e.aimAngle) * 380, vy: Math.sin(e.aimAngle) * 380, r: 6 });
    e.state = 'aim'; e.timer = 1.6;               // cooldown before next aim
  }
}
```

## 9. Mimic (copies player movement, delayed)

Replays the player's own path from N seconds ago. Spooky, fair, and forces the player to stop retracing their steps.

```javascript
// Global: trail = [];  every update: trail.push({ x: player.x, y: player.y });
// 2 s delay at 60 Hz fixed step = 120 entries. Cap the array.
trail.push({ x: player.x, y: player.y });
if (trail.length > 120) trail.shift();
// Mimic update:
const past = trail[0];                            // the position 2 s ago
e.x = GameUtils.lerp(e.x, past.x, 0.15);          // slight smoothing
e.y = GameUtils.lerp(e.y, past.y, 0.15);
// Draw it as a translucent copy of the player sprite. It hurts on contact.
```

## 10. Leader + Swarm (kill the leader to scatter)

A swarm follows a leader; the leader is the tactical target.

```javascript
// leader: any behaviour (Patroller works). swarm members hold formation offsets:
for (const m of e.swarm) {                        // m = { offX, offY, ... }
  if (leader.alive) {
    m.x = GameUtils.lerp(m.x, leader.x + m.offX, 3.0 * dt);
    m.y = GameUtils.lerp(m.y, leader.y + m.offY, 3.0 * dt);
  } else if (!m.scattered) {                      // leader dead → panic scatter
    const a = GameUtils.randomRange(0, Math.PI * 2);
    m.vx = Math.cos(a) * 240; m.vy = Math.sin(a) * 240;
    m.scattered = true; m.points *= 2;            // scattered = worth double
  } else {
    GameUtils.applyVelocity(m, dt);               // drift off / easy pickings
  }
}
// Leader is visually distinct: 1.4× size, crown/antenna, different colour.
```

## 11. Freezer / Zoner (creates avoid-zones)

Doesn't chase — it denies space. Drops a growing danger circle the player must route around.

```javascript
// On a 3 s cycle the Zoner plants a zone at its position:
// zone = { x, y, r: 0, maxR: 90, life: 4, warm: 0.6 }
zone.warm -= dt;                                  // 0.6 s telegraph: dashed outline only
if (zone.warm <= 0) {
  zone.r = Math.min(zone.maxR, zone.r + 220 * dt);  // grow to full
  zone.life -= dt;
  if (GameUtils.distance(player.x, player.y, zone.x, zone.y) < zone.r) {
    slowPlayer(0.5);                              // freeze variant: slow, don't damage
  }
}
if (zone.life <= 0) removeZone(zone);
// Never let zones cover > 40% of the arena at once — count and cap them.
```

## 12. Elite modifier (any behaviour + stats + visual tell)

Not a behaviour — a wrapper. Apply to any enemy above to create a mid-run spike.

```javascript
function makeElite(e) {
  e.elite  = true;
  e.hp    *= 3;
  e.speed *= 1.25;                                // NOT 2× — elites must stay dodgeable
  e.points *= 4;
  e.w *= 1.3; e.h *= 1.3;                         // bigger — the primary tell
  e.aura = true;                                  // render: pulsing outline, own colour
  return e;
}
// Elites ALWAYS drop something (power-up, big gem, heart). An elite with no
// reward is just a damage sponge. Announce with particles.burst + game.shake(4, 0.2).
```

---

## MIXING RULE — how to compose waves

1. **At most 2 NEW behaviours per wave.** A wave may contain many enemy *types*, but no more than two the player hasn't met in this run.
2. **Familiar : new ≈ 3 : 1.** If a wave has 8 enemies and introduces the Shielder, ship 6 familiar enemies and 2 Shielders. The familiar ones are the reading material; the new one is the lesson.
3. **Introduce solo first.** The very first instance of any behaviour appears alone or with only Patrollers, in open space, so its pattern can be watched safely.
4. **Teaching order** (roughly by cognitive load): Patroller → Swooper → Chaser → Turret → Coward → Splitter → Ambusher → Shielder → Zoner → Leader+Swarm → Mimic → Elites of any of the above.
5. **Pairings that create depth** (use after both are familiar): Turret + Chaser (dodge fire while kiting), Shielder + Swooper (flank under time pressure), Zoner + Chaser (denied space while pursued), Leader+Swarm + Coward (target priority).
6. **Pairings to avoid:** Ambusher + Mimic (two "your position is a trap" enemies reads as chaos), more than one Zoner type at once, Elite + first-ever-appearance of that behaviour.
7. **Performance:** with > 30 enemies, skip per-pair collision (O(n²)) — enemies only collide with the player and bullets, or use a spatial grid.
