/**
 * Alien Unicorn Alliance — complete rebuild
 *
 * You pilot Astra, an aurora unicorn, through an alien rift.
 * FREE FLIGHT (no gravity / floor). Collect harmony crystals,
 * dodge and pulse-convert alien drones, survive as long as possible.
 */
import { GameEngine } from '@/lib/game-framework/GameEngine';
import { Physics } from '@/lib/game-framework/mechanics/physics';
import { InputManager } from '@/lib/game-framework/mechanics/input';
import { ScoreManager } from '@/lib/game-framework/mechanics/scoring';

// ── Types ────────────────────────────────────────────────────────

interface Crystal {
  x: number; y: number; baseY: number;
  vx: number;
  spin: number; spinSpeed: number; floatPhase: number;
  hue: number; value: number;
}

interface Drone {
  x: number; y: number; baseY: number;
  vx: number;
  phase: number; amplitude: number;
  type: 'basic' | 'fast' | 'shooter';
  shootTimer: number;
}

interface Bullet {
  x: number; y: number;
  vx: number; vy: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; hue: number;
  type: 'trail' | 'hit' | 'pulse' | 'collect';
}

interface Star {
  x: number; y: number;
  size: number; speed: number; hue: number; phase: number;
}

// ── Game class ───────────────────────────────────────────────────

export class AlienUnicornGame extends GameEngine {
  private input = new InputManager();
  private scoreManager = new ScoreManager('alien-unicorn-alliance');

  private readonly W = 960;
  private readonly H = 540;

  // Player
  private px = 180;
  private py = 270;
  private pvx = 0;
  private pvy = 0;
  private readonly SPEED    = 320;   // px/s max
  private readonly ACCEL    = 1100;  // px/s²
  private readonly DAMPING  = 0.88;  // per-60Hz-frame factor

  private shields      = 3;
  private invincible   = 0;          // seconds remaining
  private pulseCooldown = 0;
  private pulseActive   = 0;
  private tailTime      = 0;

  // Game state
  private elapsed    = 0;
  private streak     = 0;
  private bestStreak = 0;
  private score      = 0;
  private gameOver   = false;
  private restartCooldown = 0;       // prevent instant restart on held key

  // Spawn timers
  private crystalTimer = 0.8;
  private droneTimer   = 3.0;

  // Entities
  private crystals:  Crystal[]  = [];
  private drones:    Drone[]    = [];
  private bullets:   Bullet[]   = [];
  private particles: Particle[] = [];
  private stars:     Star[]     = [];

  private nebulaOffset = 0;
  private prevPulse = false;  // edge-detect for pulse key

  // ── Init ──────────────────────────────────────────────────────

  init(): void {
    for (let i = 0; i < 160; i++) {
      this.stars.push({
        x:     Math.random() * this.W,
        y:     Math.random() * this.H,
        size:  Math.random() * 1.8 + 0.4,
        speed: Math.random() * 35 + 12,
        hue:   Math.random() * 60 + 180,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── Update ─────────────────────────────────────────────────────

  update(dt: number): void {
    if (this.gameOver) {
      this.restartCooldown -= dt;
      const wantsRestart =
        (this.input.isPressed('space') || this.input.isPressed('r')) &&
        this.restartCooldown <= 0;
      if (wantsRestart) this.restartGame();
      return;
    }

    this.elapsed += dt;

    // ── Player movement (free flight, no gravity)
    const ax = (this.input.isPressed('right') ? 1 : 0) - (this.input.isPressed('left')  ? 1 : 0);
    const ay = (this.input.isPressed('down')  ? 1 : 0) - (this.input.isPressed('up')    ? 1 : 0);

    this.pvx += ax * this.ACCEL * dt;
    this.pvy += ay * this.ACCEL * dt;

    // Exponential damping normalised to 60 Hz feel
    const damp = Math.pow(this.DAMPING, dt * 60);
    this.pvx *= damp;
    this.pvy *= damp;

    const maxSpd = this.SPEED;
    this.pvx = Physics.clamp(this.pvx, -maxSpd, maxSpd);
    this.pvy = Physics.clamp(this.pvy, -maxSpd, maxSpd);

    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    // Stay in left 60% of screen (right side is enemy territory)
    const m = 26;
    this.px = Physics.clamp(this.px, m, this.W * 0.62 - m);
    this.py = Physics.clamp(this.py, m, this.H - m);

    // ── Timers
    this.tailTime     += dt;
    this.invincible    = Math.max(0, this.invincible    - dt);
    this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
    this.pulseActive   = Math.max(0, this.pulseActive   - dt);

    // ── Pulse (edge-triggered so holding space doesn't spam)
    const pulseNow = this.input.isPressed('space');
    if (pulseNow && !this.prevPulse && this.pulseCooldown <= 0) {
      this.triggerPulse();
    }
    this.prevPulse = pulseNow;

    // ── Spawn entities
    this.crystalTimer -= dt;
    if (this.crystalTimer <= 0) {
      this.spawnCrystal();
      this.crystalTimer = (0.55 + Math.random() * 0.7) / Math.min(1 + this.elapsed * 0.04, 2.8);
    }
    this.droneTimer -= dt;
    if (this.droneTimer <= 0) {
      this.spawnDrone();
      this.droneTimer = (1.8 + Math.random() * 1.4) / Math.min(1 + this.elapsed * 0.05, 2.4);
    }

    // ── Background scroll
    this.nebulaOffset += dt * 18;
    for (const s of this.stars) {
      s.x -= s.speed * dt;
      if (s.x < -8) { s.x = this.W + 8; s.y = Math.random() * this.H; }
    }

    // ── Update crystals
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      c.x   += c.vx * dt;
      c.spin += c.spinSpeed * dt;
      c.y    = c.baseY + Math.sin(this.elapsed * 1.4 + c.floatPhase) * 16;
      if (c.x < -60) { this.crystals.splice(i, 1); continue; }

      const dx = this.px - c.x, dy = this.py - c.y;
      if (dx * dx + dy * dy < (32 + 18) * (32 + 18)) {
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        const pts = c.value * (1 + Math.floor(this.streak / 5));
        this.score += pts;
        this.scoreManager.addPoints(pts);
        for (let p = 0; p < 12; p++) this.emit(c.x, c.y, 'collect', c.hue);
        this.crystals.splice(i, 1);
      }
    }

    // ── Update drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.x += d.vx * dt;
      d.y  = d.baseY + Math.sin(this.elapsed * 2.1 + d.phase) * d.amplitude;
      if (d.x < -120) { this.drones.splice(i, 1); continue; }

      // Pulse converts nearby drones
      if (this.pulseActive > 0) {
        const dx = this.px - d.x, dy = this.py - d.y;
        if (dx * dx + dy * dy < 160 * 160) {
          for (let p = 0; p < 16; p++) this.emit(d.x, d.y, 'pulse', 200 + Math.random() * 60);
          this.score += 80;
          this.scoreManager.addPoints(80);
          // Drop bonus crystals
          for (let k = 0; k < 3; k++) {
            const bx = d.x + (Math.random() - 0.5) * 36;
            const by = d.y + (Math.random() - 0.5) * 28;
            this.crystals.push({ x: bx, y: by, baseY: by, vx: -(100 + Math.random() * 50), spin: 0, spinSpeed: 1.5, floatPhase: Math.random() * 6, hue: 60, value: 60 });
          }
          this.drones.splice(i, 1);
          continue;
        }
      }

      // Shooter drones fire at player
      if (d.type === 'shooter') {
        d.shootTimer -= dt;
        if (d.shootTimer <= 0) {
          d.shootTimer = 2.0 + Math.random() * 1.5;
          const ang = Math.atan2(this.py - d.y, this.px - d.x);
          this.bullets.push({ x: d.x, y: d.y, vx: Math.cos(ang) * 230, vy: Math.sin(ang) * 230 });
        }
      }

      // Collide with player
      if (this.invincible <= 0) {
        const dx = this.px - d.x, dy = this.py - d.y;
        if (dx * dx + dy * dy < (32 + 28) * (32 + 28)) {
          this.takeHit();
          this.drones.splice(i, 1);
        }
      }
    }

    // ── Update enemy bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -20 || b.x > this.W + 20 || b.y < -20 || b.y > this.H + 20) {
        this.bullets.splice(i, 1); continue;
      }
      if (this.invincible <= 0) {
        const dx = this.px - b.x, dy = this.py - b.y;
        if (dx * dx + dy * dy < (32 + 8) * (32 + 8)) {
          this.takeHit();
          this.bullets.splice(i, 1);
        }
      }
    }

    // ── Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
    }

    // Unicorn trail
    if (Math.random() < 0.35) {
      this.emit(this.px - 18, this.py + (Math.random() - 0.5) * 18, 'trail', 280 + Math.random() * 80);
    }

    // Trickle score for survival
    if (Math.floor(this.elapsed * 2) > Math.floor((this.elapsed - dt) * 2)) {
      this.score += 1;
      this.scoreManager.addPoints(1);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  private triggerPulse(): void {
    this.pulseActive   = 0.55;
    this.pulseCooldown = 5.5;
    for (let i = 0; i < 28; i++) this.emit(this.px, this.py, 'pulse', 240 + Math.random() * 60);
  }

  private takeHit(): void {
    this.shields--;
    this.streak       = 0;
    this.invincible   = 2.0;
    for (let p = 0; p < 22; p++) this.emit(this.px, this.py, 'hit', 0);
    if (this.shields <= 0) {
      this.scoreManager.saveHighScore('alien-unicorn-alliance');
      this.gameOver         = true;
      this.restartCooldown  = 1.0;
    }
  }

  private emit(x: number, y: number, type: Particle['type'], hue: number): void {
    const ang   = Math.random() * Math.PI * 2;
    const spd   = type === 'pulse' ? 90 + Math.random() * 130 : 25 + Math.random() * 85;
    this.particles.push({
      x, y,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 0.35 + Math.random() * 0.55, maxLife: 1,
      size: type === 'pulse' ? 4 + Math.random() * 5 : 2 + Math.random() * 3.5,
      hue, type,
    });
  }

  private spawnCrystal(): void {
    const y   = 55 + Math.random() * (this.H - 110);
    const hue = [60, 180, 220, 300][Math.floor(Math.random() * 4)];
    const val = hue === 60 ? 80 : hue === 300 ? 60 : 40;
    this.crystals.push({
      x: this.W + 36, y, baseY: y,
      vx: -(125 + Math.random() * 55 + this.elapsed * 7),
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.4),
      floatPhase: Math.random() * Math.PI * 2,
      hue, value: val,
    });
  }

  private spawnDrone(): void {
    const type: Drone['type'] =
      this.elapsed < 18 ? 'basic' :
      Math.random() < 0.22 ? 'shooter' :
      Math.random() < 0.35 ? 'fast' : 'basic';
    const spd = type === 'fast'
      ? 200 + this.elapsed * 5
      : 110 + Math.random() * 45 + this.elapsed * 4;
    const y = 55 + Math.random() * (this.H - 110);
    this.drones.push({
      x: this.W + 80, y, baseY: y,
      vx: -spd,
      phase: Math.random() * Math.PI * 2,
      amplitude: type === 'fast' ? 12 : 28 + Math.random() * 24,
      type, shootTimer: 2 + Math.random() * 2,
    });
  }

  private restartGame(): void {
    this.crystals.length  = 0;
    this.drones.length    = 0;
    this.bullets.length   = 0;
    this.particles.length = 0;
    this.elapsed   = 0;
    this.shields   = 3;
    this.streak    = 0;
    this.bestStreak = 0;
    this.score     = 0;
    this.scoreManager.reset();
    this.px  = 180; this.py  = this.H / 2;
    this.pvx = 0;   this.pvy = 0;
    this.invincible    = 0;
    this.pulseCooldown = 0;
    this.pulseActive   = 0;
    this.tailTime      = 0;
    this.crystalTimer  = 0.8;
    this.droneTimer    = 3.0;
    this.gameOver      = false;
    this.prevPulse     = false;
  }

  // ── Render ─────────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    this.drawBackground(ctx, t);
    this.drawParticles(ctx, t);
    this.crystals.forEach(c  => this.drawCrystal(ctx, c, t));
    this.drones.forEach(d    => this.drawDrone(ctx, d, t));
    this.drawBullets(ctx);
    this.drawUnicorn(ctx, t);
    this.drawHUD(ctx, t);

    if (this.gameOver) this.drawGameOver(ctx, t);
  }

  // ── Drawing helpers ────────────────────────────────────────────

  private drawBackground(ctx: CanvasRenderingContext2D, t: number): void {
    const bg = ctx.createLinearGradient(0, 0, 0, this.H);
    bg.addColorStop(0, '#070a18');
    bg.addColorStop(0.5, '#110e38');
    bg.addColorStop(1, '#190930');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.W, this.H);

    this.drawNebula(ctx, this.W * 0.35 - (this.nebulaOffset * 0.09) % (this.W * 1.4), this.H * 0.3, 230, '90,40,200',   0.34);
    this.drawNebula(ctx, this.W * 0.72 - (this.nebulaOffset * 0.07) % (this.W * 1.4), this.H * 0.62, 265, '20,160,255', 0.26);
    this.drawNebula(ctx, this.W * 0.58 - (this.nebulaOffset * 0.05) % (this.W * 1.4), this.H * 0.18, 185, '200,80,255', 0.20);

    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 1.8 + s.phase);
      ctx.fillStyle = `hsla(${s.hue},80%,80%,${0.35 + tw * 0.55})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.8 + tw * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawPlanet(ctx, this.W * 0.72, this.H * 0.17, 68, '#2ef6ff', '#784fff');
    this.drawPlanet(ctx, this.W * 0.14, this.H * 0.82, 50, '#ff8cf9', '#ffcf87');
  }

  private drawNebula(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, alpha: number): void {
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.55, `rgba(${rgb},${alpha * 0.35})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c1: string, c2: string): void {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(0.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.save();
    for (const p of this.particles) {
      const frac = Math.max(0, p.life / p.maxLife);
      let col: string;
      switch (p.type) {
        case 'trail':   col = `hsla(${p.hue},90%,75%,${frac * 0.38})`; break;
        case 'collect': col = `hsla(${p.hue},100%,78%,${frac * 0.9})`; break;
        case 'pulse':   col = `hsla(${p.hue},90%,82%,${frac * 0.72})`; break;
        default:        col = `rgba(255,80,80,${frac * 0.78})`; break;
      }
      ctx.shadowColor = col; ctx.shadowBlur = 7;
      ctx.fillStyle   = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * frac + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    void t;
  }

  private drawCrystal(ctx: CanvasRenderingContext2D, c: Crystal, t: number): void {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin);
    const glow = `hsl(${c.hue},100%,68%)`;
    ctx.shadowColor = glow; ctx.shadowBlur = 16;
    const g = ctx.createLinearGradient(0, -22, 0, 22);
    g.addColorStop(0, `hsl(${c.hue + 40},100%,88%)`);
    g.addColorStop(0.5, `hsl(${c.hue},100%,68%)`);
    g.addColorStop(1, `hsl(${c.hue - 20},100%,50%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(14, -2); ctx.lineTo(0, 22); ctx.lineTo(-14, -2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(4, -8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    void t;
  }

  private drawDrone(ctx: CanvasRenderingContext2D, d: Drone, t: number): void {
    const isShooter = d.type === 'shooter';
    const c1 = isShooter ? '#ff4060' : '#41d3ff';
    const c2 = isShooter ? '#ff8000' : '#6f68ff';
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.shadowColor = c1; ctx.shadowBlur = 18;
    const hull = ctx.createLinearGradient(-38, -16, 38, 22);
    hull.addColorStop(0, c1); hull.addColorStop(0.5, c2);
    hull.addColorStop(1, isShooter ? '#440010' : '#200090');
    ctx.fillStyle = hull;
    ctx.beginPath(); ctx.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2); ctx.fill();
    const dome = ctx.createLinearGradient(0, -26, 0, 10);
    dome.addColorStop(0, 'rgba(200,240,255,0.95)');
    dome.addColorStop(1, isShooter ? 'rgba(255,120,120,0.3)' : 'rgba(120,160,255,0.3)');
    ctx.fillStyle = dome;
    ctx.beginPath(); ctx.ellipse(0, -10, 20, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${isShooter ? '255,100,0' : '41,244,255'},${0.5 + 0.3 * Math.sin(t * 6 + d.phase)})`;
    ctx.beginPath(); ctx.ellipse(0, 14, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(3,16,35,0.5)';
    ctx.beginPath(); ctx.moveTo(-14,10); ctx.quadraticCurveTo(-22,30,-6,34); ctx.quadraticCurveTo(-16,18,-14,10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14,10); ctx.quadraticCurveTo(22,30,6,34); ctx.quadraticCurveTo(16,18,14,10); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawBullets(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle   = '#ff6030';
    ctx.shadowColor = '#ff6030';
    ctx.shadowBlur  = 10;
    for (const b of this.bullets) {
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawUnicorn(ctx: CanvasRenderingContext2D, t: number): void {
    // Blink while invincible
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.px, this.py);

    // Lean in direction of horizontal movement
    const lean = Physics.clamp(this.pvx / this.SPEED, -1, 1) * 0.2;
    ctx.rotate(lean);

    const bob = Math.sin(t * 2.6) * 4;

    // Pulse aura
    if (this.pulseActive > 0) {
      const r  = 128 * (1 + 0.28 * Math.sin(t * 18));
      const aura = ctx.createRadialGradient(0, bob, 0, 0, bob, r);
      aura.addColorStop(0,   'rgba(255,255,255,0.48)');
      aura.addColorStop(0.4, 'rgba(255,160,255,0.28)');
      aura.addColorStop(0.8, 'rgba(80,240,255,0.12)');
      aura.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(0, bob, r, 0, Math.PI * 2); ctx.fill();
    }

    // Aurora tail
    const tw = Math.sin(this.tailTime * 4) * 14;
    const tailG = ctx.createLinearGradient(-80, 0, -10, 0);
    tailG.addColorStop(0, 'rgba(77,226,255,0)');
    tailG.addColorStop(0.4, 'rgba(77,226,255,0.5)');
    tailG.addColorStop(1,  'rgba(255,140,249,0.9)');
    ctx.fillStyle = tailG;
    ctx.beginPath();
    ctx.moveTo(-60, bob - 5);
    ctx.quadraticCurveTo(-98, bob + tw - 22, -16, bob - 7);
    ctx.quadraticCurveTo(-92, bob + tw + 18, -14, bob + 10);
    ctx.closePath(); ctx.fill();

    // Wings
    ctx.fillStyle   = 'rgba(240,248,255,0.92)';
    ctx.strokeStyle = 'rgba(200,200,255,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, bob-8); ctx.quadraticCurveTo(-26, bob-52, 26, bob-40); ctx.quadraticCurveTo(-10, bob-30, -10, bob-8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, bob+2); ctx.quadraticCurveTo(-20, bob-20, 28, bob-6); ctx.quadraticCurveTo(-6, bob+10, -4, bob+2); ctx.fill(); ctx.stroke();

    // Body
    const bodyG = ctx.createLinearGradient(-22, bob-10, 38, bob+22);
    bodyG.addColorStop(0, '#fff8ff'); bodyG.addColorStop(1, '#c8baff');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(6, bob, 42, 25, 0.08 * Math.sin(t * 3), 0, Math.PI * 2); ctx.fill();

    // Mane
    const maneG = ctx.createLinearGradient(18, bob-36, 44, bob+10);
    maneG.addColorStop(0, '#ff8cf9'); maneG.addColorStop(1, '#6ef7ff');
    ctx.fillStyle = maneG;
    ctx.beginPath(); ctx.moveTo(20, bob-16); ctx.quadraticCurveTo(38, bob-38, 48, bob-4); ctx.quadraticCurveTo(26, bob+14, 10, bob+10); ctx.fill();

    // Head
    ctx.fillStyle   = '#fffaff';
    ctx.shadowColor = 'rgba(255,200,255,0.4)'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(32, bob-8, 13, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Horn
    const hornG = ctx.createLinearGradient(36, bob-12, 44, bob-58);
    hornG.addColorStop(0, '#ffe4ff'); hornG.addColorStop(1, '#fdb7ff');
    ctx.fillStyle = hornG;
    ctx.beginPath(); ctx.moveTo(36, bob-12); ctx.lineTo(44, bob-60); ctx.lineTo(30, bob-16); ctx.closePath(); ctx.fill();

    // Eye
    ctx.fillStyle = '#1d0b3c';
    ctx.beginPath(); ctx.arc(36, bob-7, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(37.2, bob-8.2, 1.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D, t: number): void {
    // Info panel
    ctx.fillStyle = 'rgba(6,10,26,0.72)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 210, 88, 12);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${this.score.toLocaleString()}`, 22, 36);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6ef7ff';
    ctx.fillText(`Streak × ${this.streak}`, 22, 58);
    // Shields as hearts
    const hearts = '❤️'.repeat(Math.max(0, this.shields)) + '🤍'.repeat(Math.max(0, 3 - this.shields));
    ctx.font = '16px Arial';
    ctx.fillText(hearts, 22, 82);

    // Pulse indicator
    const ready = this.pulseCooldown <= 0;
    ctx.fillStyle = ready ? 'rgba(70,230,255,0.22)' : 'rgba(30,30,60,0.55)';
    ctx.beginPath(); ctx.roundRect(this.W - 148, 10, 138, 38, 10); ctx.fill();
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#80f8ff' : '#506090';
    ctx.fillText(ready ? '✨ PULSE [SPACE]' : `⏳ ${this.pulseCooldown.toFixed(1)}s`, this.W - 79, 34);

    // Elapsed time
    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(190,205,255,0.65)';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(t)}s  |  Best streak: ${this.bestStreak}`, this.W - 10, this.H - 8);
    ctx.textAlign = 'left';
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.fillStyle = 'rgba(4,6,18,0.88)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;

    ctx.textAlign  = 'center';
    ctx.font       = 'bold 58px Arial';
    ctx.fillStyle  = '#ff4080';
    ctx.shadowColor = '#ff4080'; ctx.shadowBlur = 28;
    ctx.fillText('MISSION OVER', cx, this.H * 0.28);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 34px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${this.score.toLocaleString()}`, cx, this.H * 0.43);

    ctx.font = '22px Arial';
    ctx.fillStyle = '#6ef7ff';
    ctx.fillText(`Best Streak: ${this.bestStreak}`, cx, this.H * 0.53);

    const hs = this.scoreManager.getHighScore();
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`All-time Best: ${hs.toLocaleString()}`, cx, this.H * 0.62);

    const pulse = 0.55 + 0.45 * Math.sin(t * 3);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = `rgba(255,200,255,${pulse})`;
    ctx.fillText('Press SPACE or R to fly again', cx, this.H * 0.76);
    ctx.textAlign = 'left';
  }

  cleanup(): void {
    this.input.cleanup();
  }
}
