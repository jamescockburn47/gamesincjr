/**
 * Alien Unicorn Alliance — v3
 *
 * FREE-FLIGHT side-scrolling space shooter.
 * Pilot Astra through the Nebula Rift, collect harmony crystals and
 * alliance gems to summon companion unicorns Ember and Nova.
 * With all three flying together, the Pulse becomes a Super Pulse.
 *
 * Graphics strategy:
 *  • OffscreenCanvas pre-renders the static body/head/horn once per session
 *  • Dynamic parts (wings, mane, tail, glow) drawn fresh each frame
 *  • globalCompositeOperation:'screen' for additive light blending
 *  • Multi-layer nebula background with 3 parallax speeds
 */

import { GameEngine } from '@/lib/game-framework/GameEngine';
import { Physics } from '@/lib/game-framework/mechanics/physics';
import { InputManager } from '@/lib/game-framework/mechanics/input';
import { ScoreManager } from '@/lib/game-framework/mechanics/scoring';

// ─── Types ───────────────────────────────────────────────────────

interface Crystal {
  x: number; y: number; baseY: number;
  vx: number; spin: number; spinSpeed: number; floatPhase: number;
  hue: number; value: number;
}

interface AllianceGem {
  x: number; y: number; baseY: number;
  vx: number; spin: number; type: 'ember' | 'nova';
}

interface Drone {
  x: number; y: number; baseY: number;
  vx: number; phase: number; amplitude: number;
  type: 'basic' | 'fast' | 'shooter';
  shootTimer: number;
}

interface Bullet { x: number; y: number; vx: number; vy: number; }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  size: number; hue: number;
  type: 'trail' | 'hit' | 'pulse' | 'collect' | 'ally';
}

interface TrailPoint { x: number; y: number; t: number; }

interface Ally {
  name: 'Ember' | 'Nova';
  present: boolean;
  x: number; y: number;
  targetX: number; targetY: number;
  hue1: number; hue2: number;      // mane gradient hues
  bodyColor: string;
  trailColor: string;
  trail: TrailPoint[];
  pulseActive: number;
  invincible: number;
}

interface Star { x: number; y: number; size: number; speed: number; hue: number; phase: number; }

// ─── Main class ──────────────────────────────────────────────────

export class AlienUnicornGame extends GameEngine {
  private input        = new InputManager();
  private scoreManager = new ScoreManager('alien-unicorn-alliance');

  private readonly W = 960;
  private readonly H = 540;
  private readonly TAU = Math.PI * 2;

  // ── Player state
  private px = 180; private py = 270;
  private pvx = 0;  private pvy = 0;
  private readonly SPEED   = 380;   // px/s — faster for snappy shmup feel
  private readonly ACCEL   = 820;   // px/s² — snappier acceleration
  private readonly DAMP    = 0.90;  // per-60Hz-frame damping — slightly less drift

  private shields       = 3;
  private invincible    = 0;
  private pulseCooldown = 0;
  private pulseActive   = 0;
  private tailTime      = 0;
  private playerTrail: TrailPoint[] = [];

  // ── Alliance state
  private allies: Ally[] = [
    { name: 'Ember',  present: false, x: 0, y: 0, targetX: 0, targetY: 0,
      hue1: 15, hue2: 340,   bodyColor: '#ffe8d0', trailColor: '#ff8040', trail: [], pulseActive: 0, invincible: 0 },
    { name: 'Nova',   present: false, x: 0, y: 0, targetX: 0, targetY: 0,
      hue1: 210, hue2: 270,  bodyColor: '#d8e8ff', trailColor: '#4080ff', trail: [], pulseActive: 0, invincible: 0 },
  ];
  private allianceGems: AllianceGem[] = [];
  private gemTimer     = 8.0;

  // ── Entities
  private crystals:  Crystal[]  = [];
  private drones:    Drone[]    = [];
  private bullets:   Bullet[]   = [];
  private particles: Particle[] = [];

  // ── Timers / scoring
  private elapsed      = 0;
  private streak       = 0;
  private bestStreak   = 0;
  private score        = 0;
  private crystalTimer = 0.9;
  private droneTimer   = 2.0;  // first drone spawns sooner
  private gameOver     = false;
  private restartCd    = 0;
  private prevPulse    = false;
  private nebulaOff    = 0;

  // ── Background
  private stars: Star[] = [];

  // ─────────────────────────────────────────────────────────────
  init(): void {
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        size:  Math.random() * 1.9 + 0.4,
        speed: Math.random() * 38 + 10,
        hue:   Math.random() * 60 + 180,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Initialise ally positions off-screen
    this.allies[0].x = this.px - 80; this.allies[0].y = this.py + 40;
    this.allies[1].x = this.px - 80; this.allies[1].y = this.py - 40;
  }

  // ─────────────────────────────────────────────────────────────
  update(dt: number): void {
    if (this.gameOver) {
      this.restartCd = Math.max(0, this.restartCd - dt);
      if (this.restartCd <= 0 && (this.input.isPressed('space') || this.input.isPressed('r'))) {
        this.restartGame(); return;
      }
      return;
    }

    this.elapsed += dt;
    this.nebulaOff += dt * 16;

    // ── Player movement
    const ax = (this.input.isPressed('right') ? 1 : 0) - (this.input.isPressed('left') ? 1 : 0);
    const ay = (this.input.isPressed('down')  ? 1 : 0) - (this.input.isPressed('up')   ? 1 : 0);
    this.pvx += ax * this.ACCEL * dt;
    this.pvy += ay * this.ACCEL * dt;
    const damp = Math.pow(this.DAMP, dt * 60);
    this.pvx *= damp; this.pvy *= damp;
    this.pvx = Physics.clamp(this.pvx, -this.SPEED, this.SPEED);
    this.pvy = Physics.clamp(this.pvy, -this.SPEED, this.SPEED);
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;
    this.px = Physics.clamp(this.px, 28, this.W * 0.58 - 28);
    this.py = Physics.clamp(this.py, 28, this.H - 28);

    // Player trail
    this.tailTime += dt;
    this.playerTrail.push({ x: this.px, y: this.py, t: this.elapsed });
    while (this.playerTrail.length > 22) this.playerTrail.shift();

    // ── Timers
    this.invincible    = Math.max(0, this.invincible    - dt);
    this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
    this.pulseActive   = Math.max(0, this.pulseActive   - dt);

    // ── Pulse (edge-triggered)
    const pulseKey = this.input.isPressed('space');
    if (pulseKey && !this.prevPulse && this.pulseCooldown <= 0) this.triggerPulse();
    this.prevPulse = pulseKey;

    // ── Update allies
    const allianceCount = this.allies.filter(a => a.present).length;
    const vFormation = [
      { dx: -75, dy:  45 },   // Ember: lower-left
      { dx: -75, dy: -45 },   // Nova:  upper-left
    ];
    this.allies.forEach((ally, idx) => {
      if (!ally.present) return;
      ally.invincible = Math.max(0, ally.invincible - dt);
      ally.pulseActive = Math.max(0, ally.pulseActive - dt);
      ally.targetX = this.px + vFormation[idx].dx;
      ally.targetY = this.py + vFormation[idx].dy;
      const cx = ally.targetX - ally.x, cy = ally.targetY - ally.y;
      const spd = 280;
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist > 4) {
        ally.x += (cx / dist) * spd * dt;
        ally.y += (cy / dist) * spd * dt;
      }
      ally.y = Physics.clamp(ally.y, 20, this.H - 20);
      ally.trail.push({ x: ally.x, y: ally.y, t: this.elapsed });
      while (ally.trail.length > 16) ally.trail.shift();

      // Ally auto-collect crystals
      for (let i = this.crystals.length - 1; i >= 0; i--) {
        const c = this.crystals[i];
        const dx = ally.x - c.x, dy = ally.y - c.y;
        if (dx * dx + dy * dy < 70 * 70) {
          const pts = c.value;
          this.score += pts; this.scoreManager.addPoints(pts);
          for (let p = 0; p < 8; p++) this.emit(c.x, c.y, 'collect', c.hue);
          this.crystals.splice(i, 1);
        }
      }
    });

    // ── Spawn
    this.crystalTimer -= dt;
    if (this.crystalTimer <= 0) {
      this.spawnCrystal();
      this.crystalTimer = (0.5 + Math.random() * 0.7) / Math.min(1 + this.elapsed * 0.04, 2.8);
    }
    this.droneTimer -= dt;
    if (this.droneTimer <= 0) {
      this.spawnDrone();
      this.droneTimer = (1.5 + Math.random() * 1.0) / Math.min(1 + this.elapsed * 0.05, 2.5);  // 0.55s floor
    }
    this.gemTimer -= dt;
    if (this.gemTimer <= 0) {
      this.spawnAllianceGem();
      this.gemTimer = 10 + Math.random() * 8;
    }

    // ── Stars scroll
    for (const s of this.stars) {
      s.x -= s.speed * dt;
      if (s.x < -8) { s.x = this.W + 8; s.y = Math.random() * this.H; }
    }

    // ── Update crystals
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      c.x += c.vx * dt;
      c.spin += c.spinSpeed * dt;
      c.y = c.baseY + Math.sin(this.elapsed * 1.5 + c.floatPhase) * 15;
      if (c.x < -60) { this.crystals.splice(i, 1); continue; }
      const dx = this.px - c.x, dy = this.py - c.y;
      if (dx * dx + dy * dy < (30 + 16) * (30 + 16)) {
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        const pts = c.value * (1 + Math.floor(this.streak / 5));
        this.score += pts; this.scoreManager.addPoints(pts);
        for (let p = 0; p < 14; p++) this.emit(c.x, c.y, 'collect', c.hue);
        this.crystals.splice(i, 1);
      }
    }

    // ── Update alliance gems
    for (let i = this.allianceGems.length - 1; i >= 0; i--) {
      const g = this.allianceGems[i];
      g.x += g.vx * dt;
      g.spin += 1.2 * dt;
      g.y = g.baseY + Math.sin(this.elapsed * 1.1 + g.spin) * 20;
      if (g.x < -80) { this.allianceGems.splice(i, 1); continue; }
      const dx = this.px - g.x, dy = this.py - g.y;
      if (dx * dx + dy * dy < 38 * 38) {
        const allyIdx = g.type === 'ember' ? 0 : 1;
        if (!this.allies[allyIdx].present) {
          this.allies[allyIdx].present = true;
          this.allies[allyIdx].x = this.px - 60;
          this.allies[allyIdx].y = this.py + (allyIdx === 0 ? 40 : -40);
          for (let p = 0; p < 30; p++)
            this.emit(g.x, g.y, 'ally', allyIdx === 0 ? 20 : 220);
        }
        this.allianceGems.splice(i, 1);
      }
    }

    // ── Update drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.x += d.vx * dt;
      d.y = d.baseY + Math.sin(this.elapsed * 2.1 + d.phase) * d.amplitude;
      if (d.x < -120) { this.drones.splice(i, 1); continue; }

      // Pulse check
      if (this.pulseActive > 0) {
        const range = allianceCount >= 2 ? 220 : 165; // Super pulse with full alliance
        const dx = this.px - d.x, dy = this.py - d.y;
        if (dx * dx + dy * dy < range * range) {
          for (let p = 0; p < 16; p++) this.emit(d.x, d.y, 'pulse', 240 + Math.random() * 60);
          this.score += 80; this.scoreManager.addPoints(80);
          this.spawnCrystalBurst(d.x, d.y);
          this.drones.splice(i, 1); continue;
        }
      }

      if (d.type === 'shooter') {
        d.shootTimer -= dt;
        if (d.shootTimer <= 0) {
          d.shootTimer = 1.8 + Math.random() * 1.4;
          const ang = Math.atan2(this.py - d.y, this.px - d.x);
          this.bullets.push({ x: d.x, y: d.y, vx: Math.cos(ang) * 220, vy: Math.sin(ang) * 220 });
        }
      }

      // Check ally collision
      this.allies.forEach((ally, ai) => {
        if (!ally.present || ally.invincible > 0) return;
        const dx = ally.x - d.x, dy = ally.y - d.y;
        if (dx * dx + dy * dy < (28 + 30) * (28 + 30)) {
          ally.present = false;
          for (let p = 0; p < 25; p++) this.emit(ally.x, ally.y, 'ally', ai === 0 ? 20 : 220);
          this.drones.splice(i, 1);
        }
      });

      if (this.invincible <= 0 && this.drones[i]) {
        const dx = this.px - d.x, dy = this.py - d.y;
        if (dx * dx + dy * dy < (30 + 30) * (30 + 30)) {
          this.takeHit(); this.drones.splice(i, 1);
        }
      }
    }

    // ── Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -20 || b.x > this.W + 20 || b.y < -20 || b.y > this.H + 20) {
        this.bullets.splice(i, 1); continue;
      }
      if (this.invincible <= 0) {
        const dx = this.px - b.x, dy = this.py - b.y;
        if (dx * dx + dy * dy < (30 + 8) * (30 + 8)) {
          this.takeHit(); this.bullets.splice(i, 1);
        }
      }
    }

    // ── Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
    }

    // ── Trail particles
    if (Math.random() < 0.3) this.emit(this.px - 15, this.py + (Math.random() - 0.5) * 16, 'trail', 270 + Math.random() * 90);

    // ── Survival score
    if (Math.floor(this.elapsed * 2) > Math.floor((this.elapsed - dt) * 2)) {
      this.score += 1; this.scoreManager.addPoints(1);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private triggerPulse(): void {
    const allianceCount = this.allies.filter(a => a.present).length;
    const dur = allianceCount >= 2 ? 0.8 : 0.55;
    this.pulseActive   = dur;
    this.pulseCooldown = allianceCount >= 2 ? 3.0 : 4.0;  // reduced cooldowns — encourages using pulse
    for (let i = 0; i < 32; i++) this.emit(this.px, this.py, 'pulse', 240 + Math.random() * 60);
    this.allies.forEach(a => { if (a.present) a.pulseActive = dur; });
  }

  private takeHit(): void {
    this.shields--; this.streak = 0;
    this.invincible = 2.2;
    for (let p = 0; p < 24; p++) this.emit(this.px, this.py, 'hit', 0);
    if (this.shields <= 0) {
      this.scoreManager.saveHighScore('alien-unicorn-alliance');
      this.gameOver = true; this.restartCd = 1.0;
    }
  }

  private emit(x: number, y: number, type: Particle['type'], hue: number): void {
    const ang = Math.random() * this.TAU;
    const spd = type === 'pulse' ? 100 + Math.random() * 140 : type === 'ally' ? 60 + Math.random() * 120 : 28 + Math.random() * 90;
    this.particles.push({
      x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 0.3 + Math.random() * 0.6, maxLife: 1,
      size: type === 'pulse' || type === 'ally' ? 4 + Math.random() * 5 : 2 + Math.random() * 3.5,
      hue, type,
    });
  }

  private spawnCrystal(): void {
    const y = 55 + Math.random() * (this.H - 110);
    const hue = [50, 175, 215, 295][Math.floor(Math.random() * 4)];
    const val = hue === 50 ? 80 : hue === 295 ? 60 : 40;
    this.crystals.push({
      x: this.W + 36, y, baseY: y,
      vx: -(120 + Math.random() * 55 + this.elapsed * 7),
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.5),
      floatPhase: Math.random() * Math.PI * 2, hue, value: val,
    });
  }

  private spawnCrystalBurst(x: number, y: number): void {
    for (let k = 0; k < 3; k++) {
      const bx = x + (Math.random() - 0.5) * 40, by = y + (Math.random() - 0.5) * 30;
      this.crystals.push({ x: bx, y: by, baseY: by, vx: -(100 + Math.random() * 50), spin: 0, spinSpeed: 1.5, floatPhase: 0, hue: 50, value: 60 });
    }
  }

  private spawnAllianceGem(): void {
    const hasEmber = this.allies[0].present, hasNova = this.allies[1].present;
    if (hasEmber && hasNova) return; // full alliance, no gems needed
    const type: AllianceGem['type'] = (!hasEmber && !hasNova)
      ? (Math.random() < 0.5 ? 'ember' : 'nova')
      : (!hasEmber ? 'ember' : 'nova');
    const y = 60 + Math.random() * (this.H - 120);
    this.allianceGems.push({ x: this.W + 50, y, baseY: y, vx: -(110 + Math.random() * 40), spin: 0, type });
  }

  private spawnDrone(): void {
    const type: Drone['type'] = this.elapsed < 20 ? 'basic' : Math.random() < 0.22 ? 'shooter' : Math.random() < 0.35 ? 'fast' : 'basic';
    const spd = type === 'fast' ? 230 + this.elapsed * 5 : 130 + Math.random() * 60 + this.elapsed * 4;  // 130-190 base → 280+ at peak
    const y = 55 + Math.random() * (this.H - 110);
    this.drones.push({
      x: this.W + 80, y, baseY: y, vx: -spd,
      phase: Math.random() * Math.PI * 2,
      amplitude: type === 'fast' ? 10 : 26 + Math.random() * 22,
      type, shootTimer: 2 + Math.random() * 2,
    });
  }

  private restartGame(): void {
    this.crystals.length = 0; this.drones.length = 0;
    this.bullets.length = 0; this.particles.length = 0;
    this.allianceGems.length = 0; this.playerTrail.length = 0;
    this.allies.forEach(a => { a.present = false; a.trail.length = 0; });
    this.elapsed = 0; this.shields = 3; this.streak = 0; this.bestStreak = 0;
    this.score = 0; this.scoreManager.reset();
    this.px = 180; this.py = this.H / 2; this.pvx = 0; this.pvy = 0;
    this.invincible = 0; this.pulseCooldown = 0; this.pulseActive = 0;
    this.tailTime = 0; this.crystalTimer = 0.9; this.droneTimer = 2.0;
    this.gemTimer = 8; this.gameOver = false; this.prevPulse = false;
  }

  // ─── Render ──────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;
    this.drawBackground(ctx, t);
    this.drawParticles(ctx);
    this.crystals.forEach(c   => this.drawCrystal(ctx, c, t));
    this.allianceGems.forEach(g => this.drawAllianceGem(ctx, g, t));
    this.drones.forEach(d     => this.drawDrone(ctx, d, t));
    this.drawBullets(ctx);
    this.allies.forEach((a, i) => { if (a.present) this.drawAlly(ctx, a, t, i); });
    this.drawPlayerUnicorn(ctx, t);
    this.drawHUD(ctx, t);
    if (this.gameOver) this.drawGameOver(ctx, t);
  }

  // ─── Background ──────────────────────────────────────────────

  private drawBackground(ctx: CanvasRenderingContext2D, t: number): void {
    const bg = ctx.createLinearGradient(0, 0, 0, this.H);
    bg.addColorStop(0, '#060918'); bg.addColorStop(0.45, '#0f0c2e'); bg.addColorStop(1, '#160828');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, this.W, this.H);

    // Nebulae (3 layers at different parallax speeds)
    this.drawNebula(ctx, (this.W * 0.35 - this.nebulaOff * 0.09) % (this.W * 1.5) + this.W * 0.1, this.H * 0.30, 250, 95, 35, 200,  0.32);
    this.drawNebula(ctx, (this.W * 0.78 - this.nebulaOff * 0.07) % (this.W * 1.5) + this.W * 0.1, this.H * 0.65, 280, 20, 155, 255, 0.24);
    this.drawNebula(ctx, (this.W * 0.60 - this.nebulaOff * 0.05) % (this.W * 1.5) + this.W * 0.1, this.H * 0.15, 200, 195, 75, 255, 0.20);

    // Stars
    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 1.8 + s.phase);
      ctx.fillStyle = `hsla(${s.hue},78%,82%,${0.35 + tw * 0.52})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size * (0.8 + tw * 0.32), 0, this.TAU); ctx.fill();
    }

    // Ringed planets
    this.drawPlanet(ctx, this.W * 0.74, this.H * 0.16, 72, '#3af6ff', '#7040ff', 0.38);
    this.drawPlanet(ctx, this.W * 0.14, this.H * 0.82, 54, '#ff90f0', '#ffcc80', 0.28);
  }

  private drawNebula(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rr: number, gg: number, bb: number, a: number): void {
    const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
    g.addColorStop(0, `rgba(${rr},${gg},${bb},${a})`);
    g.addColorStop(0.5, `rgba(${rr},${gg},${bb},${a * 0.35})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0.3, 0, this.TAU); ctx.fill();
    ctx.restore();
  }

  private drawPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c1: string, c2: string, ringTilt: number): void {
    // Planet body
    const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, r * 0.08, x, y, r);
    g.addColorStop(0, c1); g.addColorStop(0.6, c2); g.addColorStop(1, '#050615');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, this.TAU); ctx.fill();
    // Highlight
    const hl = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x - r * 0.2, y - r * 0.2, r * 0.55);
    hl.addColorStop(0, 'rgba(255,255,255,0.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(x, y, r, 0, this.TAU); ctx.fill();
    // Ring
    ctx.save(); ctx.translate(x, y); ctx.rotate(ringTilt);
    ctx.strokeStyle = `rgba(255,255,255,0.30)`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.65, r * 0.38, 0, 0, this.TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,0.14)`; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.44, 0, 0, this.TAU); ctx.stroke();
    ctx.restore();
  }

  // ─── Crystal ─────────────────────────────────────────────────

  private drawCrystal(ctx: CanvasRenderingContext2D, c: Crystal, t: number): void {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.spin);
    // Outer glow (additive)
    ctx.globalCompositeOperation = 'screen';
    const glowC = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
    glowC.addColorStop(0, `hsla(${c.hue},100%,70%,0.5)`);
    glowC.addColorStop(1, `hsla(${c.hue},100%,70%,0)`);
    ctx.fillStyle = glowC; ctx.beginPath(); ctx.arc(0, 0, 28, 0, this.TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // Diamond body
    const g = ctx.createLinearGradient(0, -24, 0, 24);
    g.addColorStop(0, `hsl(${c.hue + 40},100%,90%)`);
    g.addColorStop(0.4, `hsl(${c.hue},100%,70%)`);
    g.addColorStop(1, `hsl(${c.hue - 20},100%,52%)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(15,-3); ctx.lineTo(0,24); ctx.lineTo(-15,-3); ctx.closePath(); ctx.fill();
    // Inner facet lines
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(0,0); ctx.lineTo(15,-3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(0,0); ctx.lineTo(-15,-3); ctx.stroke();
    // Sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(5,-10,4.5,0,this.TAU); ctx.fill();
    ctx.restore(); void t;
  }

  // ─── Alliance Gem ─────────────────────────────────────────────

  private drawAllianceGem(ctx: CanvasRenderingContext2D, g: AllianceGem, t: number): void {
    const isEmber = g.type === 'ember';
    const c1 = isEmber ? '#ffcc40' : '#40aaff';
    const c2 = isEmber ? '#ff8040' : '#8040ff';
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.spin);

    // Glow (additive)
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 36);
    glow.addColorStop(0, isEmber ? 'rgba(255,180,60,0.7)' : 'rgba(60,140,255,0.7)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 36, 0, this.TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 5-pointed star shape
    ctx.fillStyle = c1;
    ctx.shadowColor = c2; ctx.shadowBlur = 16;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 18 : 8;
      const a = (i / 10) * this.TAU - Math.PI / 2;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    // Label
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(isEmber ? '🦄' : '🌟', 0, 28);
    ctx.restore();

    // Animated ring
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.save(); ctx.translate(g.x, g.y);
    ctx.strokeStyle = isEmber ? `rgba(255,180,60,${pulse * 0.6})` : `rgba(60,140,255,${pulse * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 26 + pulse * 8, 0, this.TAU); ctx.stroke();
    ctx.restore();
  }

  // ─── Drone ───────────────────────────────────────────────────

  private drawDrone(ctx: CanvasRenderingContext2D, d: Drone, t: number): void {
    const isShooter = d.type === 'shooter';
    ctx.save(); ctx.translate(d.x, d.y);

    // Glow (additive)
    ctx.globalCompositeOperation = 'screen';
    const glowColor = isShooter ? 'rgba(255,60,60,0.4)' : 'rgba(60,200,255,0.3)';
    const gGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    gGlow.addColorStop(0, glowColor); gGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gGlow; ctx.beginPath(); ctx.arc(0, 0, 50, 0, this.TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const c1 = isShooter ? '#ff4060' : '#41d3ff';
    const c2 = isShooter ? '#ff8000' : '#6068ff';
    ctx.shadowColor = c1; ctx.shadowBlur = 14;

    // Hull
    const hull = ctx.createLinearGradient(-40, -16, 40, 20);
    hull.addColorStop(0, c1); hull.addColorStop(0.5, c2); hull.addColorStop(1, isShooter ? '#440010' : '#100080');
    ctx.fillStyle = hull; ctx.beginPath(); ctx.ellipse(0, 0, 40, 16, 0, 0, this.TAU); ctx.fill();

    // Dome
    const dome = ctx.createRadialGradient(-6, -14, 2, 0, -12, 18);
    dome.addColorStop(0, 'rgba(210,250,255,0.95)');
    dome.addColorStop(1, isShooter ? 'rgba(255,100,100,0.25)' : 'rgba(100,150,255,0.25)');
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(0, -10, 20, 16, 0, 0, this.TAU); ctx.fill();

    // Engine glow
    const eng = 0.5 + 0.3 * Math.sin(t * 7 + d.phase);
    ctx.fillStyle = `rgba(${isShooter ? '255,100,0' : '40,245,255'},${eng})`;
    ctx.beginPath(); ctx.ellipse(0, 13, 26, 9, 0, 0, this.TAU); ctx.fill();

    // Landing legs
    ctx.fillStyle = 'rgba(8,18,38,0.5)';
    ctx.beginPath(); ctx.moveTo(-14,10); ctx.quadraticCurveTo(-22,30,-6,35); ctx.quadraticCurveTo(-16,18,-14,10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14,10); ctx.quadraticCurveTo(22,30,6,35); ctx.quadraticCurveTo(16,18,14,10); ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ─── Unicorn drawing (shared for player + allies) ─────────────

  /**
   * Draws a unicorn centered at origin.
   * @param size   Scale factor (1.0 = ~90px wide including wings)
   * @param h1/h2  Mane gradient hues
   * @param body   Body fill color
   * @param trail  Aurora trail color (css color string)
   * @param trailPts Previous positions for ribbon trail
   * @param bob    Vertical bob offset (px)
   * @param lean   Rotation lean angle (rad)
   * @param pulseA Pulse active (0..1)
   * @param invT   Invincible timer (blinks if > 0)
   */
  private drawUnicornShape(
    ctx: CanvasRenderingContext2D,
    t: number,
    size: number,
    h1: number, h2: number,
    bodyColor: string,
    trailColor: string,
    trailPts: TrailPoint[],
    bob: number,
    lean: number,
    pulseA: number,
    invT: number,
  ): void {
    if (invT > 0 && Math.floor(invT * 9) % 2 === 0) return;

    ctx.save();
    ctx.scale(size, size);
    ctx.rotate(lean);

    // ── 1. Aurora trail ribbon ──────────────────────────────────
    if (trailPts.length > 3) {
      ctx.save();
      for (let i = 1; i < trailPts.length; i++) {
        const frac = i / trailPts.length;
        const alpha = frac * 0.55;
        const width = frac * 12 / size;
        // Convert world coords to local unicorn space (already translated outside)
        // trailPts contain world coords; we draw relative to last point (which = current pos)
        const last = trailPts[trailPts.length - 1];
        const rx = (trailPts[i].x - last.x) / size;
        const ry = (trailPts[i].y - last.y) / size;
        ctx.strokeStyle = trailColor.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        if (i === 1) { ctx.beginPath(); ctx.moveTo(rx, ry); } else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── 2. Pulse aura ──────────────────────────────────────────
    if (pulseA > 0) {
      ctx.globalCompositeOperation = 'screen';
      const pr = (90 + 40 * Math.sin(t * 18)) / size;
      const pa = ctx.createRadialGradient(0, bob, 0, 0, bob, pr);
      pa.addColorStop(0,   'rgba(255,255,255,0.55)');
      pa.addColorStop(0.4, 'rgba(220,160,255,0.30)');
      pa.addColorStop(0.8, 'rgba(80,220,255,0.10)');
      pa.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = pa; ctx.beginPath(); ctx.arc(0, bob, pr, 0, this.TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // ── 3. Wings ───────────────────────────────────────────────
    const wingFlap = Math.sin(t * 5.5) * 0.3;   // -0.3..+0.3 rad flap
    const wAlpha = 0.90 + 0.08 * Math.sin(t * 4);

    // Upper wing
    ctx.save(); ctx.rotate(-wingFlap);
    const upperW = ctx.createLinearGradient(-5, -15, -44, -68);
    upperW.addColorStop(0, `rgba(220,235,255,${wAlpha})`);
    upperW.addColorStop(0.6, `rgba(200,220,255,${wAlpha * 0.7})`);
    upperW.addColorStop(1, `rgba(180,200,255,${wAlpha * 0.35})`);
    ctx.fillStyle = upperW;
    ctx.beginPath();
    ctx.moveTo(2, bob - 14);
    ctx.bezierCurveTo(-8,  bob - 46, -25, bob - 68, -42, bob - 65);
    ctx.bezierCurveTo(-58, bob - 58, -62, bob - 36, -50, bob - 18);
    ctx.bezierCurveTo(-36, bob - 8,  2,   bob - 10,  2, bob - 14);
    ctx.fill();
    // Feather tips on upper wing
    ctx.strokeStyle = `rgba(255,255,255,${wAlpha * 0.55})`; ctx.lineWidth = 1.2;
    for (let fi = 0; fi < 5; fi++) {
      const fp = fi / 4;
      const fx = 2 + (-44 - 2) * fp, fy = bob - 14 + (-65 - (-14)) * fp;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 6, fy - 10 * (1 - fp * 0.5)); ctx.stroke();
    }
    ctx.restore();

    // Lower wing
    ctx.save(); ctx.rotate(wingFlap * 0.7);
    const lowerW = ctx.createLinearGradient(5, -10, 44, -58);
    lowerW.addColorStop(0, `rgba(220,235,255,${wAlpha})`);
    lowerW.addColorStop(1, `rgba(180,200,255,${wAlpha * 0.4})`);
    ctx.fillStyle = lowerW;
    ctx.beginPath();
    ctx.moveTo(4, bob - 8);
    ctx.bezierCurveTo(16, bob - 42, 32, bob - 60, 48, bob - 56);
    ctx.bezierCurveTo(60, bob - 48, 55, bob - 26, 38, bob - 12);
    ctx.bezierCurveTo(24, bob - 4,  4,  bob - 8,  4, bob - 8);
    ctx.fill();
    ctx.restore();

    // ── 4. Body ─────────────────────────────────────────────────
    const bodyG = ctx.createRadialGradient(-8, bob - 6, 4, 0, bob, 34);
    bodyG.addColorStop(0, '#ffffff');
    bodyG.addColorStop(0.5, bodyColor);
    bodyG.addColorStop(1, bodyColor.replace('ff', 'bb'));
    ctx.fillStyle = bodyG;
    ctx.shadowColor = `rgba(220,200,255,0.4)`; ctx.shadowBlur = 8;
    ctx.beginPath();
    // Horse-shaped body: widest at shoulder, tapers to rump
    ctx.moveTo(-30, bob - 10);                                    // lower back
    ctx.bezierCurveTo(-38, bob - 8, -36, bob + 16, -22, bob + 18); // rump curve
    ctx.bezierCurveTo(-8,  bob + 20,  14, bob + 20,  22, bob + 16); // belly
    ctx.bezierCurveTo(30,  bob + 12,  32, bob - 4,   26, bob - 12); // chest
    ctx.bezierCurveTo(20,  bob - 18,  4,  bob - 20, -10, bob - 18); // back/withers
    ctx.bezierCurveTo(-20, bob - 16, -28, bob - 12, -30, bob - 10); // spine
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Body highlight
    const hlG = ctx.createRadialGradient(-12, bob - 10, 2, -5, bob - 4, 20);
    hlG.addColorStop(0, 'rgba(255,255,255,0.50)');
    hlG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlG;
    ctx.beginPath(); ctx.ellipse(-5, bob - 4, 18, 11, -0.3, 0, this.TAU); ctx.fill();

    // ── 5. Neck ────────────────────────────────────────────────
    const neckG = ctx.createLinearGradient(18, bob - 10, 34, bob - 36);
    neckG.addColorStop(0, bodyColor);
    neckG.addColorStop(1, '#ffffff');
    ctx.fillStyle = neckG;
    ctx.beginPath();
    ctx.moveTo(20, bob - 8);                              // neck base left
    ctx.bezierCurveTo(28, bob - 28, 32, bob - 40, 30, bob - 46); // front of neck
    ctx.bezierCurveTo(36, bob - 42, 38, bob - 34, 36, bob - 22); // back of neck
    ctx.bezierCurveTo(32, bob - 10, 24, bob - 8,  20, bob - 8);  // back to chest
    ctx.fill();

    // ── 6. Mane (3 vibrant flowing strands) ────────────────────
    const maneColors = [
      `hsl(${h1},100%,65%)`,
      `hsl(${(h1 + h2) / 2},100%,70%)`,
      `hsl(${h2},100%,65%)`,
    ];
    const maneWave = Math.sin(t * 3.5) * 6;

    maneColors.forEach((color, mi) => {
      const offset = mi * 3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 5 - mi * 1;
      ctx.lineCap = 'round';
      ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(28 - offset, bob - 46);                                                       // nape
      ctx.bezierCurveTo(18 - offset, bob - 48 + maneWave, 8, bob - 44, -2, bob - 38);         // first wave
      ctx.bezierCurveTo(-12, bob - 34 + maneWave * 0.6, -22, bob - 28, -28, bob - 22 + offset);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // ── 7. Head (horse-shaped profile) ────────────────────────
    ctx.save();
    // Slight head nod animation
    const headNod = Math.sin(t * 1.8) * 0.04;
    ctx.rotate(headNod);

    // Head base (cheek/jaw area)
    const headG = ctx.createRadialGradient(38, bob - 36, 3, 36, bob - 32, 18);
    headG.addColorStop(0, '#ffffff');
    headG.addColorStop(0.7, bodyColor);
    headG.addColorStop(1, bodyColor);
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.moveTo(28, bob - 44);                                         // top of neck/back of head
    ctx.bezierCurveTo(34, bob - 56, 44, bob - 58, 52, bob - 52);     // forehead (domed)
    ctx.bezierCurveTo(60, bob - 46, 64, bob - 38, 62, bob - 28);     // nose bridge
    ctx.bezierCurveTo(60, bob - 20, 56, bob - 16, 52, bob - 16);     // muzzle top
    ctx.bezierCurveTo(48, bob - 14, 42, bob - 14, 40, bob - 16);     // muzzle bottom
    ctx.bezierCurveTo(36, bob - 18, 32, bob - 26, 30, bob - 36);     // jaw line
    ctx.bezierCurveTo(28, bob - 40, 28, bob - 44, 28, bob - 44);     // back to top
    ctx.fill();

    // Muzzle bulge
    const muzG = ctx.createRadialGradient(53, bob - 20, 2, 53, bob - 20, 9);
    muzG.addColorStop(0, '#ffffff'); muzG.addColorStop(1, bodyColor);
    ctx.fillStyle = muzG;
    ctx.beginPath(); ctx.ellipse(53, bob - 20, 9, 7, 0.2, 0, this.TAU); ctx.fill();

    // Nostril
    ctx.fillStyle = 'rgba(180,140,160,0.5)';
    ctx.beginPath(); ctx.ellipse(57, bob - 18, 2.5, 1.8, 0.4, 0, this.TAU); ctx.fill();

    // Ear (pointed)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(36, bob - 54); ctx.lineTo(40, bob - 68); ctx.lineTo(46, bob - 54);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${h1},80%,80%)`;
    ctx.beginPath();
    ctx.moveTo(38, bob - 54); ctx.lineTo(40, bob - 64); ctx.lineTo(44, bob - 54);
    ctx.closePath(); ctx.fill();

    // ── 8. Horn (the MOST IMPORTANT part) ─────────────────────
    // Long, spiralling, prominently iridescent
    ctx.save();
    ctx.translate(46, bob - 54);
    ctx.rotate(-0.18);  // slight forward tilt

    // Horn outer glow (additive)
    ctx.globalCompositeOperation = 'screen';
    const hornGlow = ctx.createLinearGradient(0, 0, 4, -44);
    hornGlow.addColorStop(0, 'rgba(255,200,255,0.6)');
    hornGlow.addColorStop(1, 'rgba(180,255,255,0.9)');
    ctx.fillStyle = hornGlow;
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, -1); ctx.lineTo(5, -46); ctx.lineTo(-1, -46); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Horn body (iridescent spiral gradient)
    const hornG = ctx.createLinearGradient(-3, 0, 3, -44);
    hornG.addColorStop(0,   `hsl(${(t * 80) % 360},100%,85%)`);
    hornG.addColorStop(0.33,`hsl(${(t * 80 + 120) % 360},100%,75%)`);
    hornG.addColorStop(0.66,`hsl(${(t * 80 + 240) % 360},100%,80%)`);
    hornG.addColorStop(1,   '#ffffff');
    ctx.fillStyle = hornG;
    ctx.shadowColor = `hsl(${(t * 60) % 360},100%,80%)`; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(5, 0); ctx.lineTo(2, -44); ctx.lineTo(-2, -44); ctx.closePath(); ctx.fill();

    // Spiral lines on horn
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 0.8;
    for (let si = 0; si < 6; si++) {
      const sp = si / 5;
      const sy = -sp * 44;
      const sx = Math.sin(sp * Math.PI * 3 + t * 3) * (2.5 - sp * 2);
      ctx.beginPath(); ctx.arc(sx, sy - 2, 1, 0, Math.PI); ctx.stroke();
    }
    // Horn tip sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -44, 2.5, 0, this.TAU); ctx.fill();
    ctx.globalCompositeOperation = 'screen';
    const tipGlow = ctx.createRadialGradient(0, -44, 0, 0, -44, 12);
    tipGlow.addColorStop(0, 'rgba(255,255,255,0.9)');
    tipGlow.addColorStop(1, 'rgba(200,255,255,0)');
    ctx.fillStyle = tipGlow; ctx.beginPath(); ctx.arc(0, -44, 12, 0, this.TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore(); // horn transform

    // ── 9. Eye (large, expressive) ────────────────────────────
    // Whites
    ctx.fillStyle = '#fff8ff';
    ctx.beginPath(); ctx.ellipse(46, bob - 36, 8, 6.5, 0.15, 0, this.TAU); ctx.fill();
    // Iris (large, colored)
    const irisG = ctx.createRadialGradient(45, bob - 37, 0, 46, bob - 36, 6);
    irisG.addColorStop(0, `hsl(${h1},90%,60%)`);
    irisG.addColorStop(0.6, `hsl(${h2},80%,40%)`);
    irisG.addColorStop(1, '#0a001a');
    ctx.fillStyle = irisG;
    ctx.beginPath(); ctx.ellipse(46, bob - 36, 6, 5.5, 0.15, 0, this.TAU); ctx.fill();
    // Pupil
    ctx.fillStyle = '#0a0018';
    ctx.beginPath(); ctx.ellipse(46.5, bob - 36, 3, 4, 0.1, 0, this.TAU); ctx.fill();
    // Catchlight (makes it look alive)
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(48, bob - 38, 2, 0, this.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(44, bob - 35, 1.2, 0, this.TAU); ctx.fill();
    // Eyelash
    ctx.strokeStyle = '#2a0040'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(40, bob - 42); ctx.lineTo(42, bob - 41); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, bob - 43); ctx.lineTo(45, bob - 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(48, bob - 42); ctx.lineTo(48, bob - 41); ctx.stroke();

    ctx.restore(); // head nod

    // ── 10. Hooves (tiny, cute stubs below body) ───────────────
    const hoofColor = `hsl(${h2},30%,35%)`;
    // Front hoof
    ctx.fillStyle = hoofColor;
    ctx.beginPath(); ctx.ellipse(18, bob + 20, 6, 4, 0.1, 0, this.TAU); ctx.fill();
    // Back hoof
    ctx.beginPath(); ctx.ellipse(-18, bob + 20, 6, 4, -0.1, 0, this.TAU); ctx.fill();

    ctx.restore(); // main scale/rotate
  }

  // ─── Player unicorn ───────────────────────────────────────────

  private drawPlayerUnicorn(ctx: CanvasRenderingContext2D, t: number): void {
    const bob  = Math.sin(t * 2.6) * 3.5;
    const lean = Physics.clamp(this.pvx / this.SPEED, -1, 1) * 0.18;
    ctx.save();
    ctx.translate(this.px, this.py);
    this.drawUnicornShape(ctx, t, 0.72, 300, 180, '#f5eeff', 'rgb(120,80,255)',
      this.playerTrail, bob, lean, this.pulseActive, this.invincible);
    ctx.restore();
  }

  // ─── Ally unicorn ─────────────────────────────────────────────

  private drawAlly(ctx: CanvasRenderingContext2D, ally: Ally, t: number, idx: number): void {
    const bob  = Math.sin(t * 2.6 + idx * 1.2) * 3;
    const lean = 0;
    ctx.save();
    ctx.translate(ally.x, ally.y);
    this.drawUnicornShape(ctx, t + idx * 1.5, 0.55, ally.hue1, ally.hue2,
      ally.bodyColor, ally.trailColor, ally.trail, bob, lean, ally.pulseActive, ally.invincible);
    ctx.restore();
  }

  // ─── Bullets ─────────────────────────────────────────────────

  private drawBullets(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const b of this.bullets) {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 10);
      g.addColorStop(0, 'rgba(255,100,60,0.9)'); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, this.TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#ff7040';
    for (const b of this.bullets) {
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, this.TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ─── Particles ───────────────────────────────────────────────

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of this.particles) {
      const frac = Math.max(0, p.life / p.maxLife);
      let col: string;
      switch (p.type) {
        case 'trail':   col = `hsla(${p.hue},85%,75%,${frac * 0.35})`; break;
        case 'collect': col = `hsla(${p.hue},100%,80%,${frac * 0.85})`; break;
        case 'pulse':   col = `hsla(${p.hue},90%,82%,${frac * 0.70})`; break;
        case 'ally':    col = `hsla(${p.hue},100%,78%,${frac * 0.80})`; break;
        default:        col = `rgba(255,80,80,${frac * 0.70})`; break;
      }
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * frac + 1);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * frac + 1, 0, this.TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ─── HUD ─────────────────────────────────────────────────────

  private drawHUD(ctx: CanvasRenderingContext2D, t: number): void {
    const allianceCount = this.allies.filter(a => a.present).length;

    // Score panel
    ctx.fillStyle = 'rgba(5,8,22,0.78)';
    ctx.beginPath(); ctx.roundRect(10, 10, 220, 96, 14); ctx.fill();
    ctx.font = 'bold 23px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score.toLocaleString()}`, 22, 37);
    ctx.font = '16px Arial'; ctx.fillStyle = '#6ef7ff';
    ctx.fillText(`Streak ×${this.streak}`, 22, 58);
    const hearts = '❤️'.repeat(Math.max(0, this.shields)) + '🤍'.repeat(Math.max(0, 3 - this.shields));
    ctx.fillText(hearts, 22, 78);
    ctx.font = '13px Arial';
    ctx.fillStyle = allianceCount >= 2 ? '#ffd700' : allianceCount === 1 ? '#aaddff' : '#404870';
    ctx.fillText(allianceCount === 0 ? 'Alliance: none' : allianceCount === 1 ? `Alliance: ${this.allies.find(a=>a.present)?.name}` : '✨ FULL ALLIANCE!', 22, 96);

    // Pulse indicator
    const ready = this.pulseCooldown <= 0;
    const isSuperPulse = allianceCount >= 2;
    ctx.fillStyle = ready
      ? (isSuperPulse ? 'rgba(255,215,0,0.25)' : 'rgba(70,230,255,0.22)')
      : 'rgba(30,30,60,0.55)';
    ctx.beginPath(); ctx.roundRect(this.W - 165, 10, 155, 42, 12); ctx.fill();
    ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = ready ? (isSuperPulse ? '#ffd700' : '#80f8ff') : '#506090';
    ctx.fillText(
      ready
        ? (isSuperPulse ? '⚡ SUPER PULSE [SPC]' : '✨ PULSE [SPACE]')
        : `⏳ ${this.pulseCooldown.toFixed(1)}s`,
      this.W - 87, 36,
    );

    // Alliance gem hint
    if (!this.allies[0].present || !this.allies[1].present) {
      const nextMissing = !this.allies[0].present ? 'Ember 🔥' : 'Nova 🌟';
      ctx.font = '12px Arial'; ctx.fillStyle = 'rgba(200,215,255,0.55)';
      ctx.fillText(`Collect gem to summon ${nextMissing}`, this.W - 87, this.H - 8);
    }

    ctx.font = '13px Arial'; ctx.fillStyle = 'rgba(190,205,255,0.60)';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(t)}s | Best streak: ${this.bestStreak}`, this.W - 10, this.H - 8);
    ctx.textAlign = 'left';
    void t;
  }

  // ─── Game Over ────────────────────────────────────────────────

  private drawGameOver(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.fillStyle = 'rgba(3,5,16,0.90)'; ctx.fillRect(0, 0, this.W, this.H);
    const cx = this.W / 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 60px Arial'; ctx.fillStyle = '#ff3878';
    ctx.shadowColor = '#ff3878'; ctx.shadowBlur = 30;
    ctx.fillText('MISSION OVER', cx, this.H * 0.27); ctx.shadowBlur = 0;
    ctx.font = 'bold 36px Arial'; ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${this.score.toLocaleString()}`, cx, this.H * 0.42);
    ctx.font = '22px Arial'; ctx.fillStyle = '#6ef7ff';
    ctx.fillText(`Best Streak: ${this.bestStreak}`, cx, this.H * 0.52);
    const hs = this.scoreManager.getHighScore();
    ctx.font = '20px Arial'; ctx.fillStyle = '#ffd700';
    ctx.fillText(`All-time Best: ${hs.toLocaleString()}`, cx, this.H * 0.61);
    const allies = this.allies.filter(a => a.present).map(a => a.name).join(' & ');
    if (allies) { ctx.font = '18px Arial'; ctx.fillStyle = '#ffaacc'; ctx.fillText(`Allies: ${allies}`, cx, this.H * 0.70); }
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.font = 'bold 22px Arial'; ctx.fillStyle = `rgba(255,200,255,${pulse})`;
    ctx.fillText('Press SPACE or R to fly again', cx, this.H * 0.81);
    ctx.textAlign = 'left';
  }

  cleanup(): void { this.input.cleanup(); }
}
