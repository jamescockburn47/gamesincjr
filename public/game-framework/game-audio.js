/*
 * Games Inc Jr — GameAudio
 * Procedural WebAudio sound effects. No asset files, no dependencies.
 *
 * Usage:
 *   <script src="/game-framework/game-audio.js"></script>
 *   GameAudio.init();              // call on first user gesture (auto-wired below)
 *   GameAudio.play('collect');     // in game code, on the event
 *   GameAudio.setMuted(true);      // persisted per-site in localStorage
 *
 * Sound names: jump, hit, collect, powerup, explosion, levelup, gameover, click, combo
 */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var muted = false;
  var lastPlayed = {}; // name -> timestamp, to throttle spam

  try {
    muted = localStorage.getItem('gij-audio-muted') === '1';
  } catch (e) { /* private mode */ }

  function ensureContext() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35; // library-wide volume ceiling
    master.connect(ctx.destination);
    return true;
  }

  // One oscillator voice with a pitch ramp and gain envelope.
  function tone(opts) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var t = ctx.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.15;
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(opts.from, t);
    if (opts.to && opts.to !== opts.from) {
      o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t + dur);
    }
    var vol = opts.vol || 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // White-noise burst through a filter — impacts and explosions.
  function noise(opts) {
    var t = ctx.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.2;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = opts.filter || 'lowpass';
    f.frequency.setValueAtTime(opts.freq || 800, t);
    if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqTo), t + dur);
    var g = ctx.createGain();
    var vol = opts.vol || 0.5;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  var SOUNDS = {
    jump:      function () { tone({ type: 'square',   from: 220,  to: 520,  dur: 0.12, vol: 0.35 }); },
    collect:   function () { tone({ type: 'sine',     from: 660,  to: 990,  dur: 0.09, vol: 0.4 });
                             tone({ type: 'sine',     from: 990,  to: 1320, dur: 0.09, vol: 0.3, delay: 0.07 }); },
    hit:       function () { noise({ filter: 'lowpass', freq: 900, freqTo: 200, dur: 0.18, vol: 0.5 });
                             tone({ type: 'sawtooth', from: 180,  to: 70,   dur: 0.18, vol: 0.3 }); },
    explosion: function () { noise({ filter: 'lowpass', freq: 1400, freqTo: 90, dur: 0.5, vol: 0.7 });
                             tone({ type: 'triangle', from: 110,  to: 40,   dur: 0.5,  vol: 0.4 }); },
    powerup:   function () { [440, 554, 659, 880].forEach(function (f, i) {
                               tone({ type: 'square', from: f, to: f, dur: 0.09, vol: 0.3, delay: i * 0.07 });
                             }); },
    levelup:   function () { [523, 659, 784, 1046].forEach(function (f, i) {
                               tone({ type: 'triangle', from: f, to: f, dur: 0.14, vol: 0.35, delay: i * 0.1 });
                             }); },
    combo:     function () { tone({ type: 'square', from: 880, to: 1174, dur: 0.08, vol: 0.3 });
                             tone({ type: 'square', from: 1174, to: 1568, dur: 0.1, vol: 0.25, delay: 0.06 }); },
    click:     function () { tone({ type: 'sine',   from: 600, to: 500, dur: 0.05, vol: 0.2 }); },
    gameover:  function () { [392, 330, 262, 196].forEach(function (f, i) {
                               tone({ type: 'triangle', from: f, to: f * 0.97, dur: 0.28, vol: 0.35, delay: i * 0.22 });
                             });
                             noise({ filter: 'lowpass', freq: 500, freqTo: 60, dur: 1.0, vol: 0.2, delay: 0.6 }); },
  };

  var GameAudio = {
    /* Create/resume the AudioContext. Safe to call repeatedly; must run inside
       (or after) a user gesture to satisfy browser autoplay policy. */
    init: function () {
      if (!ensureContext()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    },

    /* Play a named effect. Unknown names and un-initialised context are no-ops,
       so games never crash from audio. Per-name throttle: 30ms. */
    play: function (name) {
      if (muted || !ctx || ctx.state !== 'running') return;
      var fn = SOUNDS[name];
      if (!fn) return;
      var now = performance.now();
      if (lastPlayed[name] && now - lastPlayed[name] < 30) return;
      lastPlayed[name] = now;
      try { fn(); } catch (e) { /* never break the game for a bleep */ }
    },

    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem('gij-audio-muted', muted ? '1' : '0'); } catch (e) {}
    },

    isMuted: function () { return muted; },

    setVolume: function (v) {
      if (master) master.gain.value = Math.max(0, Math.min(1, v));
    },
  };

  // Auto-init on the first user gesture anywhere in the page.
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
    window.addEventListener(evt, function onFirst() {
      GameAudio.init();
      window.removeEventListener(evt, onFirst);
    }, { once: true, passive: true });
  });

  window.GameAudio = GameAudio;
})();
