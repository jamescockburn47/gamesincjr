/**
 * GamesIncJr Unified Game Framework v2.0
 * game-utils.js — Physics, Math helpers, ParticleSystem
 */

const GameUtils = {

  // ─── Physics ──────────────────────────────────────────────────────────────

  applyGravity(obj, gravity, dt) {
    obj.vy = (obj.vy || 0) + gravity * dt;
  },

  applyVelocity(obj, dt) {
    if (obj.vx !== undefined) obj.x += obj.vx * dt;
    if (obj.vy !== undefined) obj.y += obj.vy * dt;
  },

  /** Exponential friction — feels natural. friction=0.9 = slight drag, 0.1 = heavy drag */
  applyFriction(obj, friction, dt) {
    const f = Math.pow(friction, dt * 60); // normalise to 60 Hz feel
    if (obj.vx !== undefined) obj.vx *= f;
    if (obj.vy !== undefined) obj.vy *= f;
  },

  // ─── Clamping / boundaries ────────────────────────────────────────────────

  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

  /** Keep object inside W×H logical canvas space */
  clampToCanvas(obj, W, H) {
    const w = obj.w || obj.width  || 0;
    const h = obj.h || obj.height || 0;
    obj.x = this.clamp(obj.x, 0, W - w);
    obj.y = this.clamp(obj.y, 0, H - h);
  },

  clampRect(obj, x1, y1, x2, y2) {
    const w = obj.w || obj.width  || 0;
    const h = obj.h || obj.height || 0;
    obj.x = this.clamp(obj.x, x1, x2 - w);
    obj.y = this.clamp(obj.y, y1, y2 - h);
  },

  /** Bounce off all four walls, reversing velocity */
  bounceOffWalls(obj, W, H, restitution = 0.9) {
    const w = obj.w || obj.width  || 0;
    const h = obj.h || obj.height || 0;
    if (obj.x <= 0)     { obj.x = 0;     obj.vx =  Math.abs(obj.vx) * restitution; }
    if (obj.x + w >= W) { obj.x = W - w; obj.vx = -Math.abs(obj.vx) * restitution; }
    if (obj.y <= 0)     { obj.y = 0;     obj.vy =  Math.abs(obj.vy) * restitution; }
    if (obj.y + h >= H) { obj.y = H - h; obj.vy = -Math.abs(obj.vy) * restitution; }
  },

  /** Wrap object around canvas edges */
  wrapX(obj, W) {
    const w = obj.w || obj.width || 0;
    if (obj.x + w < 0) obj.x = W;
    if (obj.x > W)     obj.x = -(w);
  },
  wrapY(obj, H) {
    const h = obj.h || obj.height || 0;
    if (obj.y + h < 0) obj.y = H;
    if (obj.y > H)     obj.y = -(h);
  },
  wrap(obj, W, H) { this.wrapX(obj, W); this.wrapY(obj, H); },

  // ─── Collision detection ──────────────────────────────────────────────────

  /** AABB collision with optional forgiveness (0.7 = 70% hitbox) */
  hitTest(a, b, forgiveness = 0.7) {
    const aw = a.w || a.width  || 0, ah = a.h || a.height || 0;
    const bw = b.w || b.width  || 0, bh = b.h || b.height || 0;
    const mx1 = aw * (1 - forgiveness) / 2, my1 = ah * (1 - forgiveness) / 2;
    const mx2 = bw * (1 - forgiveness) / 2, my2 = bh * (1 - forgiveness) / 2;
    return (a.x + mx1        < b.x + bw - mx2) &&
           (a.x + aw - mx1   > b.x + mx2)       &&
           (a.y + my1        < b.y + bh - my2)   &&
           (a.y + ah - my1   > b.y + my2);
  },

  /** Backward-compat alias */
  checkCollision(a, b, forgiveness = 0.7) { return this.hitTest(a, b, forgiveness); },

  /** Circle–circle collision using .r radius property */
  circleHit(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const r  = (a.r || 0) + (b.r || 0);
    return dx * dx + dy * dy < r * r;
  },

  // ─── Math helpers ─────────────────────────────────────────────────────────

  lerp(a, b, t)        { return a + (b - a) * t; },
  smoothStep(t)        { return t * t * (3 - 2 * t); },
  distance(x1,y1,x2,y2){ const dx=x2-x1,dy=y2-y1; return Math.sqrt(dx*dx+dy*dy); },
  angle(x1,y1,x2,y2)   { return Math.atan2(y2-y1, x2-x1); },
  randomRange(a, b)    { return Math.random() * (b - a) + a; },
  randomInt(a, b)      { return Math.floor(Math.random() * (b - a + 1)) + a; },
  choice(arr)          { return arr[Math.floor(Math.random() * arr.length)]; },
  easeOut(t)           { return 1 - (1 - t) * (1 - t); },
  easeIn(t)            { return t * t; },
  easeInOut(t)         { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; },
};

// ─── ParticleSystem ───────────────────────────────────────────────────────────

class ParticleSystem {
  constructor() { this.particles = []; }

  /**
   * Burst particles from (x, y).
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {object} opts
   * @param {string[]} [opts.colors]
   * @param {number}   [opts.minSpeed=60]   px/s
   * @param {number}   [opts.maxSpeed=220]  px/s
   * @param {number}   [opts.minSize=2]
   * @param {number}   [opts.maxSize=6]
   * @param {number}   [opts.lifetime=0.8]  seconds
   * @param {number}   [opts.gravity=200]   px/s²
   * @param {number}   [opts.spread]        radians (default full circle)
   * @param {number}   [opts.angle=0]       base angle
   */
  burst(x, y, count, opts = {}) {
    const colors   = opts.colors   || ['#ff4400','#ff8800','#ffff00'];
    const minSpeed = opts.minSpeed ?? 60;
    const maxSpeed = opts.maxSpeed ?? 220;
    const minSize  = opts.minSize  ?? 2;
    const maxSize  = opts.maxSize  ?? 6;
    const lifetime = opts.lifetime ?? 0.8;
    const gravity  = opts.gravity  ?? 200;
    const spread   = opts.spread   ?? (Math.PI * 2);
    const angle    = opts.angle    ?? 0;

    for (let i = 0; i < count; i++) {
      const a     = angle + (Math.random() - 0.5) * spread;
      const speed = GameUtils.randomRange(minSpeed, maxSpeed);
      this.particles.push({
        x, y,
        vx:      Math.cos(a) * speed,
        vy:      Math.sin(a) * speed,
        size:    GameUtils.randomRange(minSize, maxSize),
        color:   GameUtils.choice(colors),
        life:    lifetime,
        maxLife: lifetime,
        gravity,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.98;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha  = alpha;
      ctx.shadowBlur   = 8;
      ctx.shadowColor  = p.color;
      ctx.fillStyle    = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();
  }

  get count() { return this.particles.length; }
  clear()     { this.particles.length = 0; }
}
