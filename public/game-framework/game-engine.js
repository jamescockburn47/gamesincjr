/**
 * GamesIncJr Unified Game Framework v2.0
 * game-engine.js — GameEngine + InputManager
 *
 * Usage:
 *   const game = new GameEngine(canvas).setup(GAME_CONFIG);
 *   const input = new InputManager();
 *   game.onUpdate(dt => { ... });
 *   game.onRender(ctx => { ... });
 */

class GameEngine {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');

    // State machine
    this.state   = 'waiting'; // waiting | playing | paused | gameover

    // Loop internals
    this.isRunning        = false;
    this.isPaused         = false;
    this.lastTime         = 0;
    this.accumulator      = 0;
    this.fixedTimeStep    = 1 / 60;   // 60 Hz fixed step
    this.animationFrameId = null;

    // Callbacks
    this._onUpdate  = null;
    this._onRender  = null;
    this._onRestart = null;

    // Scoring
    this._score     = 0;
    this._highScore = 0;
    this._slug      = '';

    // Screen shake
    this._shakeTimer     = 0;
    this._shakeIntensity = 0;

    // Logical game dimensions (before DPR)
    this._logicalW = 800;
    this._logicalH = 600;
    this._dpr      = 1;
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  /**
   * Call once after constructing. Wires up overlays, HUD, mobile controls,
   * loads high score, and starts the DPR-aware canvas resize.
   */
  setup(config = {}) {
    this._slug     = config.slug  || '';
    this._logicalW = config.width  || 800;
    this._logicalH = config.height || 600;

    // Load saved high score
    if (this._slug) {
      const saved = localStorage.getItem('gij_hs_' + this._slug);
      if (saved) this._highScore = parseInt(saved, 10) || 0;
    }

    // Fill overlay copy from config
    document.querySelectorAll('[data-game-title]')
      .forEach(el => el.textContent = config.title || '');

    const descEl = document.getElementById('gij-description');
    if (descEl && config.description) descEl.textContent = config.description;

    const listEl = document.getElementById('gij-instructions');
    if (listEl && config.instructions) {
      listEl.innerHTML = config.instructions
        .map(i => '<li>' + i + '</li>').join('');
    }

    if (config.title) document.title = config.title + ' · Games Inc Jr';

    // Wire overlay buttons
    this._bindBtn('gij-try-btn',     () => this._showInstructions());
    this._bindBtn('gij-start-btn',   () => this._startGame());
    this._bindBtn('gij-restart-btn', () => this._restartGame());

    // Build mobile controls
    if (config.controls) this._buildMobileControls(config.controls);

    // DPR-aware canvas sizing + resize listener
    this._setupResize();

    return this; // allow chaining
  }

  // ─── Overlay management ───────────────────────────────────────────────────

  _showInstructions() {
    this._hide('gij-try-overlay');
    this._show('gij-instructions-overlay');
    try { document.documentElement.requestFullscreen?.(); } catch(e) {}
  }

  _startGame() {
    this._hide('gij-instructions-overlay');
    this._hide('gij-try-overlay');
    this._show('gij-hud');
    this._updateHUD();
    this.state = 'playing';
    const mc = document.getElementById('gij-controls');
    if (mc) mc.classList.add('visible');
    this.start();
  }

  _restartGame() {
    this._score = 0;
    this._hide('gij-gameover-overlay');
    this._show('gij-hud');
    this._updateHUD();
    this.state = 'playing';
    if (this._onRestart) this._onRestart();
    if (!this.isRunning) this.start();
    else                 this.resume();
  }

  /**
   * Call when the player dies / level ends.
   * Shows the game-over overlay, saves high score, submits to API.
   */
  endGame() {
    this.state = 'gameover';
    this.pause();

    if (this._score > this._highScore) {
      this._highScore = this._score;
      if (this._slug)
        localStorage.setItem('gij_hs_' + this._slug, String(this._highScore));
    }

    const fsEl  = document.getElementById('gij-final-score');
    if (fsEl)  fsEl.textContent  = 'Score: ' + this._score;
    const hsEl  = document.getElementById('gij-final-hs');
    if (hsEl)  hsEl.textContent  = 'Best: '  + this._highScore;

    this._show('gij-gameover-overlay');

    if (this._slug && this._score > 0) {
      fetch('/api/scores/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slug: this._slug, score: this._score }),
      }).catch(() => {});
    }
  }

  // ─── Scoring helpers ──────────────────────────────────────────────────────

  addScore(pts) {
    this._score += pts;
    if (this._score > this._highScore) this._highScore = this._score;
    this._updateHUD();
    return this._score;
  }

  setScore(s) { this._score = s; this._updateHUD(); }
  getScore()  { return this._score;     }
  getHigh()   { return this._highScore; }

  // ─── Screen shake ─────────────────────────────────────────────────────────

  shake(intensity = 8, duration = 0.25) {
    this._shakeTimer     = duration;
    this._shakeIntensity = intensity;
  }

  // ─── Logical canvas dimensions ────────────────────────────────────────────

  get W() { return this._logicalW; }
  get H() { return this._logicalH; }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  _updateHUD() {
    const s  = document.getElementById('gij-score');
    if (s)  s.textContent  = this._score;
    const hs = document.getElementById('gij-highscore');
    if (hs) hs.textContent = this._highScore;
  }

  _show(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  _hide(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  _bindBtn(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', fn);
    el.addEventListener('touchend', e => { e.preventDefault(); fn(); }, { passive: false });
  }

  _setupResize() {
    const resize = () => {
      this._dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width  = Math.round(this._logicalW * this._dpr);
      this.canvas.height = Math.round(this._logicalH * this._dpr);
      this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  _buildMobileControls(controls) {
    const container = document.getElementById('gij-controls');
    if (!container) return;
    const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
    if (!isTouch) return;

    container.innerHTML = '';
    controls.forEach(ctrl => {
      const btn = document.createElement('button');
      btn.className = 'gij-ctrl-btn' + (ctrl.cls ? ' ' + ctrl.cls : '');
      btn.innerHTML  = ctrl.label;
      btn.setAttribute('aria-label', ctrl.action);

      const press   = e => { e.preventDefault(); window._gijInput?.addTouch(ctrl.action); };
      const release = e => { e.preventDefault(); window._gijInput?.removeTouch(ctrl.action); };

      btn.addEventListener('touchstart',  press,   { passive: false });
      btn.addEventListener('touchend',    release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown',   press);
      btn.addEventListener('mouseup',     release);
      btn.addEventListener('mouseleave',  release);
      container.appendChild(btn);
    });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onUpdate(cb)  { this._onUpdate  = cb; return this; }
  onRender(cb)  { this._onRender  = cb; return this; }
  onRestart(cb) { this._onRestart = cb; return this; }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused  = false;
    this.lastTime  = performance.now() / 1000;
    this.accumulator = 0;
    this._loop();
  }

  pause()  { this.isPaused = true; }

  resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ─── Game loop ────────────────────────────────────────────────────────────

  _loop() {
    if (!this.isRunning) return;

    const now = performance.now() / 1000;
    let ft    = now - this.lastTime;
    this.lastTime = now;
    if (ft > 0.25) ft = 0.25; // clamp to prevent spiral of death

    // Screen shake offset
    let sx = 0, sy = 0;
    if (this._shakeTimer > 0) {
      this._shakeTimer -= ft;
      const i = this._shakeIntensity * Math.min(this._shakeTimer * 4, 1);
      sx = (Math.random() - 0.5) * i;
      sy = (Math.random() - 0.5) * i;
    }

    // Fixed-step updates
    this.accumulator += ft;
    if (!this.isPaused) {
      while (this.accumulator >= this.fixedTimeStep) {
        if (this._onUpdate) this._onUpdate(this.fixedTimeStep);
        this.accumulator -= this.fixedTimeStep;
      }
    }

    // Render with shake
    this.ctx.setTransform(
      this._dpr, 0, 0, this._dpr,
      sx * this._dpr, sy * this._dpr
    );
    if (this._onRender) this._onRender(this.ctx);

    this.animationFrameId = requestAnimationFrame(() => this._loop());
  }
}

// ─── InputManager ─────────────────────────────────────────────────────────────

class InputManager {
  constructor() {
    this.keys = {};
    this.touchActions = new Set();

    // Named action → key code mappings
    this.actions = {
      up:      ['ArrowUp',    'KeyW'],
      down:    ['ArrowDown',  'KeyS'],
      left:    ['ArrowLeft',  'KeyA'],
      right:   ['ArrowRight', 'KeyD'],
      space:   ['Space'],
      fire:    ['Space', 'KeyZ'],
      action1: ['KeyZ'],
      action2: ['KeyX'],
      pause:   ['KeyP', 'Escape'],
      restart: ['KeyR'],
    };

    window._gijInput = this; // Let GameEngine._buildMobileControls find us

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
        e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }

  isPressed(action) {
    if (this.touchActions.has(action)) return true;
    const codes = this.actions[action];
    if (!codes) return !!this.keys[action];
    return codes.some(c => this.keys[c]);
  }

  addTouch(action)    { this.touchActions.add(action);    }
  removeTouch(action) { this.touchActions.delete(action); }
  clearTouch()        { this.touchActions.clear();        }
}
