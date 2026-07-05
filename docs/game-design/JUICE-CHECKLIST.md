# JUICE CHECKLIST — Mandatory Feedback Standard

Every player action must produce visible, audible, physical feedback. A silent game
with generic particle bursts is a FAILED game. This document defines the minimum
feedback stack for every canonical event. It uses the real framework API only:
`particles.burst()`, `game.shake()`, `GameUtils.*`, and the new `GameAudio` module.

**Audio setup (required in every game):**

```html
<script src="/game-framework/game-audio.js"></script>
```

```javascript
// GameAudio.init() must run on the first user gesture — the framework start
// button is a gesture, so hook it once:
document.getElementById('gij-start-btn')?.addEventListener('click', () => GameAudio.init(), { once: true });
document.getElementById('gij-restart-btn')?.addEventListener('click', () => GameAudio.init(), { once: true });
// Then anywhere in game logic:
GameAudio.play('collect');   // names: jump, hit, collect, powerup, explosion,
                             //        levelup, gameover, click, combo
```

`GameAudio` is procedural WebAudio — no asset files, no loading, safe to call
every frame-event. If `typeof GameAudio === 'undefined'`, skip calls; never crash.

---

## 1. Event → Feedback Table

Every game MUST implement the full stack for each event it contains. "—" means
not required. Shake budget is a hard cap — see §restraint.

| Event | Particles (`particles.burst`) | Shake (`game.shake`) | Floating text | Sprite reaction | Hit-stop | `GameAudio.play` |
|---|---|---|---|---|---|---|
| **Collect** (coin, fruit, gem) | 8–12, item colours, `minSpeed:80, maxSpeed:200, lifetime:0.5, gravity:100` | — | `+10` rises 40px, 0.6s | Item pop: scale 1.3→1 over 0.15s | — | `'collect'` |
| **Hit taken** (player damaged) | 15–20, red/orange, `maxSpeed:300, lifetime:0.6` | 5, 0.2 | — | Damage flash (§3) + knockback | 40ms | `'hit'` |
| **Enemy killed** | 20–25, enemy colours + white, `maxSpeed:350, lifetime:0.7` | 3, 0.15 | `+50` at enemy position | Enemy squashes to 1.4w × 0.5h for 2 frames before removal | 30ms | `'explosion'` |
| **Combo milestone** (×5, ×10…) | 12, gold `['#ffd700','#ffee88','#fff']`, `gravity:-50` (float up) | — | `COMBO x5!` centre-top, 1.0s, larger font | Player brief glow (shadowBlur 20, 0.3s) | — | `'combo'` |
| **Near-miss** (threat passes within ~12px, no hit) | 4–6, white streaks, `lifetime:0.3` | 2, 0.1 | `Close!` small, 0.5s | — | — | `'click'` |
| **Level / phase up** | 30, theme colours, from centre, `spread: Math.PI*2, maxSpeed:400` | 4, 0.2 | `LEVEL 2` centre, 1.2s | Background palette shift or flash 0.2s | — | `'levelup'` |
| **Unlock / new ability** | 25, gold + white, `gravity:-80` | — | Name of unlock, 1.5s | Player pulse scale 1→1.2→1 | — | `'powerup'` |
| **Death** (see §4 — the spectacle rule) | 40–60, player colours + white + red, `maxSpeed:450, lifetime:1.2` | 8, 0.3 (the maximum) | — | Player fragments / spins / fades over 0.6s | 80ms | `'explosion'` then `'gameover'` |
| **Perfect action** (frame-perfect dodge, full clear, no-damage wave) | 15, white/gold ring: `minSpeed:180, maxSpeed:220` (uniform speed = ring) | — | `PERFECT!` gold, 0.8s | Brief white outline flash | 50ms | `'powerup'` |
| **Game over confirmed** (overlay about to show) | — | — | — | — | — | `'gameover'` (if not already played at death) |

Jump/flap/dash actions additionally play `'jump'` and spawn 3–5 dust particles
at the feet (`spread: Math.PI/3, angle: Math.PI/2, lifetime:0.3`).

### Hit-stop (freeze frame) — pseudocode

The engine has no built-in hit-stop. Implement a freeze timer at the top of
`onUpdate`:

```javascript
let hitStop = 0;                       // seconds remaining

function triggerHitStop(sec) { hitStop = Math.max(hitStop, sec); }

game.onUpdate((dt) => {
  if (game.state !== 'playing') return;
  if (hitStop > 0) { hitStop -= dt; return; }   // freeze world, keep rendering
  // ... normal update ...
});
```

Budget: 30ms (0.03) minor kill, 40–50ms solid hit, 80ms (0.08) death. Never
exceed 100ms; never chain hit-stops into a slideshow — `Math.max` above handles
overlap correctly.

---

## 2. Floating Score Text — required pool

```javascript
const floaters = [];
function floatText(x, y, text, color = '#fff', size = 18) {
  floaters.push({ x, y, text, color, size, life: 0.7, maxLife: 0.7 });
}
// in onUpdate (after hitStop check):
for (let i = floaters.length - 1; i >= 0; i--) {
  const f = floaters[i];
  f.y -= 60 * dt;                       // rise 60 px/s
  f.life -= dt;
  if (f.life <= 0) floaters.splice(i, 1);
}
// in onRender (draw last, above everything):
floaters.forEach(f => {
  ctx.globalAlpha = f.life / f.maxLife;
  ctx.fillStyle = f.color;
  ctx.font = 'bold ' + f.size + 'px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(f.text, f.x, f.y);
});
ctx.globalAlpha = 1;
```

Call `floatText(x, y, '+' + pts)` alongside every `game.addScore(pts)` for
positional scoring events. Clear `floaters.length = 0` in `onRestart`.

---

## 3. Sprite Animation Minimums

No main actor may be a static rectangle. Each of the following, minimum:

- **3+ drawn frames** OR procedural motion (below). Kenney sprites still need
  procedural motion layered on top.
- **Idle bob:** `drawY = y + Math.sin(elapsed * 4) * 3;` (±3px at ~0.64Hz ×2π).
- **Movement lean:** `ctx.rotate(GameUtils.clamp(vx / maxSpeed, -1, 1) * 0.15);`
  (max ~8.6°) around the sprite centre.
- **Squash & stretch:** on landing draw at `1.25w × 0.75h` for 0.1s; on jump
  launch `0.8w × 1.2h` for 0.1s. Track with a timer, lerp back with
  `GameUtils.lerp`.
- **Damage flash recipe:**

```javascript
let flashTimer = 0;                    // set to 0.4 when hit
// onUpdate: flashTimer = Math.max(0, flashTimer - dt);
// onRender:
if (flashTimer > 0 && Math.floor(flashTimer * 15) % 2 === 0) {
  ctx.globalAlpha = 0.4;               // blink at ~7.5Hz for 0.4s
}
drawPlayer(ctx);
ctx.globalAlpha = 1;
```

During `flashTimer > 0` the player should also be invulnerable — one system,
two jobs.

---

## 4. The Death Spectacle Rule

Death MUST be the most spectacular moment in the game. The player must SEE and
HEAR the death before the overlay appears. Never call `game.endGame()` on the
same frame as the fatal collision. Required sequence:

```javascript
function killPlayer() {
  if (dying) return;
  dying = true;
  triggerHitStop(0.08);                                   // 80ms freeze
  GameAudio.play('explosion');
  particles.burst(player.x + player.w/2, player.y + player.h/2, 50, {
    colors: ['#fff', '#ff4444', '#ffaa00'],
    minSpeed: 120, maxSpeed: 450, lifetime: 1.2,
  });
  game.shake(8, 0.3);                                     // the ONLY 8px shake
  deathTimer = 0.8;                                       // let it play out
}
// onUpdate:
if (dying) {
  deathTimer -= dt;
  particles.update(dt);                                   // particles still live
  if (deathTimer <= 0) { GameAudio.play('gameover'); game.endGame(); }
  return;
}
```

Optional upgrade: slow-mo instead of full stop — scale dt by 0.3 for the first
0.4s of `deathTimer`. Either is acceptable; nothing is not.

---

## 5. Background Depth

Flat single-colour fills are banned. Minimum: EITHER two parallax layers
(e.g. far stars at 20 px/s, near stars at 60 px/s — pre-generate positions in
`onRestart`, scroll with `* dt`, wrap with modulo) OR an animated gradient
(shift a `createLinearGradient` stop colour with `Math.sin(elapsed * 0.3)`)
PLUS ambient particles (5–10 slow drifting motes, dust, or bubbles at 15–30 px/s,
respawned when off-screen). Parallax + ambient particles is the preferred stack.

---

## 6. Restraint

Juice amplifies events; it must never obscure play.

- **Particle cap:** if `particles.count > 200`, skip or halve new bursts.
  `if (particles.count < 200) particles.burst(...)`.
- **Shake caps:** max intensity 8, max duration 0.3s — reserved for death.
  Routine events stay ≤5 / ≤0.2s. NEVER shake while the player is aiming,
  lining up a precise jump, or steering through a narrow gap — shake punishes
  precision input.
- **Hit-stop cap:** 80ms, death only.
- **One floating text per event.** Do not stack `+10 +10 +10` on the same pixel;
  offset x by ±15px random.
- **Sound spam:** at most one `GameAudio.play` per event type per frame (e.g. a
  bomb killing 8 enemies plays `'explosion'` once, not eight times).

---

## 7. Final 12-Point Checklist — tick ALL before shipping

1. [ ] `game-audio.js` linked; `GameAudio.init()` wired to start AND restart buttons
2. [ ] Every event in the §1 table that exists in this game has its FULL stack
3. [ ] Hit-stop timer implemented; used on hits, kills, and death
4. [ ] Floating text pool implemented; `+pts` appears at every positional score
5. [ ] Damage flash + invulnerability window on player hit
6. [ ] Player has idle bob AND movement lean (or 3+ real frames doing the same job)
7. [ ] Death sequence: freeze → explosion sound → 50-particle burst → 8/0.3 shake → 0.8s delay → `'gameover'` → `endGame()`
8. [ ] Background: parallax or animated gradient, plus ambient particles
9. [ ] Particle cap guard at 200; shake never exceeds 8 / 0.3s
10. [ ] No shake during aiming or precision-input moments
11. [ ] All juice timers use `-= dt` (no frame counters)
12. [ ] Played 5 minutes with sound on: every action audible, nothing grating

A game failing any line does not ship.
