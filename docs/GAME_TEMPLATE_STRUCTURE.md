# Game Template Structure
## Standard HTML5 Game Scaffold for Games Inc Jr

**Version:** 1.0  
**Last Updated:** October 22, 2025

---

## I. File Structure

Every game should follow this exact structure:

```
public/demos/[game-slug]/
├── index.html          # Main game file (self-contained)
├── README.md           # Development notes (optional)
└── assets/             # External assets if needed (optional)
    ├── sounds/
    └── sprites/
```

**Rule:** Prefer single-file `index.html` with embedded CSS/JS. Only split out assets if file size >500KB.

---

## II. HTML Template (Canonical)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>[Game Name] - Games Inc Jr</title>
    <style>
        /* ========== RESET & BASE ========== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
            color: #ffffff;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            touch-action: none; /* Prevent scroll on mobile */
        }
        
        /* ========== CANVAS ========== */
        #gameCanvas {
            border: 2px solid #00ffff;
            background: #1a1a2e;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            display: block;
            max-width: 100%;
            max-height: 100%;
        }
        
        /* ========== UI OVERLAY ========== */
        .ui-overlay {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 255, 0.3);
            font-size: 14px;
            z-index: 100;
        }
        
        .stat {
            margin: 6px 0;
        }
        
        /* ========== MOBILE CONTROLS ========== */
        .mobile-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            gap: 12px;
            z-index: 100;
        }
        
        .mobile-controls button {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            border: 2px solid #00ffff;
            background: rgba(0, 100, 150, 0.8);
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            touch-action: manipulation;
        }
        
        .mobile-controls button:active {
            transform: scale(0.9);
            background: rgba(0, 150, 200, 0.8);
        }
        
        @media (hover: none) and (pointer: coarse) {
            .mobile-controls {
                display: flex;
            }
        }
        
        /* ========== MODAL OVERLAYS ========== */
        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .overlay.hidden {
            display: none;
        }
        
        .modal {
            background: linear-gradient(135deg, #1a2a4e, #0f1a3a);
            padding: 40px;
            border-radius: 15px;
            border: 3px solid #00ffff;
            text-align: center;
            max-width: 600px;
        }
        
        .modal h2 {
            color: #00ffff;
            margin: 0 0 20px;
            font-size: 32px;
        }
        
        .modal p {
            margin: 0 0 20px;
            line-height: 1.6;
        }
        
        .modal button {
            padding: 14px 28px;
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            background: linear-gradient(135deg, #00ffff, #0088aa);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .modal button:hover {
            transform: scale(1.05);
        }
        
        /* ========== MESSAGE TOASTS ========== */
        .message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            border: 2px solid #00ffff;
            z-index: 2000;
            pointer-events: none;
            animation: fadeOut 3s forwards;
        }
        
        @keyframes fadeOut {
            0%, 70% { opacity: 1; }
            100% { opacity: 0; }
        }
    </style>
</head>
<body>
    <!-- Try/Start Overlays -->
    <div id="tryOverlay" class="overlay">
        <div class="modal">
            <h2>[Game Name]</h2>
            <p>[Brief description of game mechanics]</p>
            <button id="tryBtn">Try Now</button>
        </div>
    </div>
    
    <div id="startOverlay" class="overlay hidden">
        <div class="modal">
            <h2>How to Play</h2>
            <p><strong>Goal:</strong> [Win condition]</p>
            <p><strong>Controls:</strong> [List controls]</p>
            <p><strong>Tip:</strong> [Strategic hint]</p>
            <button id="startBtn">Start Game</button>
        </div>
    </div>
    
    <!-- Game Canvas -->
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    
    <!-- UI Overlay -->
    <div class="ui-overlay">
        <div class="stat">Score: <span id="score">0</span></div>
        <div class="stat">Lives: <span id="lives">3</span></div>
        <div class="stat">Level: <span id="level">1</span></div>
    </div>
    
    <!-- Mobile Controls -->
    <div class="mobile-controls">
        <button id="btnLeft">◀</button>
        <button id="btnAction">⚡</button>
        <button id="btnRight">▶</button>
    </div>
    
    <!-- Message Container -->
    <div id="messageContainer"></div>
    
    <script>
        // ========== GAME STATE ==========
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        const game = {
            running: false,
            score: 0,
            lives: 3,
            level: 1,
            player: {
                x: 400,
                y: 300,
                vx: 0,
                vy: 0,
                width: 32,
                height: 32
            },
            enemies: [],
            collectibles: [],
            particles: []
        };
        
        const input = {
            left: false,
            right: false,
            up: false,
            down: false,
            action: false
        };
        
        // ========== INPUT HANDLING ==========
        document.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft' || key === 'a') input.left = true;
            if (key === 'arrowright' || key === 'd') input.right = true;
            if (key === 'arrowup' || key === 'w') input.up = true;
            if (key === 'arrowdown' || key === 's') input.down = true;
            if (key === ' ') {
                input.action = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft' || key === 'a') input.left = false;
            if (key === 'arrowright' || key === 'd') input.right = false;
            if (key === 'arrowup' || key === 'w') input.up = false;
            if (key === 'arrowdown' || key === 's') input.down = false;
            if (key === ' ') input.action = false;
        });
        
        // Touch controls
        function bindButton(id, key) {
            const btn = document.getElementById(id);
            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                input[key] = true;
            });
            btn.addEventListener('touchend', e => {
                e.preventDefault();
                input[key] = false;
            });
        }
        
        bindButton('btnLeft', 'left');
        bindButton('btnRight', 'right');
        bindButton('btnAction', 'action');
        
        // ========== UTILITY FUNCTIONS ==========
        function showMessage(text) {
            const div = document.createElement('div');
            div.className = 'message';
            div.textContent = text;
            document.getElementById('messageContainer').appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }
        
        function createParticles(x, y, color, count = 8) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const speed = 2 + Math.random() * 3;
                game.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.5 + Math.random() * 0.5,
                    size: 3 + Math.random() * 3,
                    color
                });
            }
        }
        
        function checkCollision(a, b) {
            return a.x < b.x + b.width &&
                   a.x + a.width > b.x &&
                   a.y < b.y + b.height &&
                   a.y + a.height > b.y;
        }
        
        // ========== GAME INITIALIZATION ==========
        function init() {
            // Initialize game objects here
            game.enemies = [];
            game.collectibles = [];
            game.particles = [];
        }
        
        // ========== GAME UPDATE ==========
        function update(dt) {
            if (!game.running) return;
            
            // Update player
            const speed = 5;
            game.player.vx = 0;
            game.player.vy = 0;
            
            if (input.left) game.player.vx = -speed;
            if (input.right) game.player.vx = speed;
            if (input.up) game.player.vy = -speed;
            if (input.down) game.player.vy = speed;
            
            // Normalize diagonal movement
            if (game.player.vx !== 0 && game.player.vy !== 0) {
                game.player.vx *= 0.707;
                game.player.vy *= 0.707;
            }
            
            game.player.x += game.player.vx * dt;
            game.player.y += game.player.vy * dt;
            
            // Boundary check
            game.player.x = Math.max(0, Math.min(canvas.width - game.player.width, game.player.x));
            game.player.y = Math.max(0, Math.min(canvas.height - game.player.height, game.player.y));
            
            // Update enemies
            game.enemies.forEach(enemy => {
                // Enemy AI here
            });
            
            // Check collisions
            game.collectibles.forEach((item, i) => {
                if (checkCollision(game.player, item)) {
                    game.score += 10;
                    createParticles(item.x, item.y, '#FFD700', 10);
                    game.collectibles.splice(i, 1);
                    showMessage('+10');
                }
            });
            
            // Update particles
            for (let i = game.particles.length - 1; i >= 0; i--) {
                const p = game.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 0.2; // gravity
                p.life -= dt;
                if (p.life <= 0) game.particles.splice(i, 1);
            }
            
            // Update UI
            document.getElementById('score').textContent = game.score;
            document.getElementById('lives').textContent = game.lives;
            document.getElementById('level').textContent = game.level;
        }
        
        // ========== GAME RENDER ==========
        function render() {
            // Clear canvas
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw player
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
            
            // Draw enemies
            game.enemies.forEach(enemy => {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            });
            
            // Draw collectibles
            game.collectibles.forEach(item => {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw particles
            game.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
        
        // ========== GAME LOOP ==========
        let lastTime = 0;
        function gameLoop(time) {
            const dt = Math.min((time - lastTime) / 1000, 0.1) * 60; // Lock to 60 FPS equivalent
            lastTime = time;
            
            update(dt);
            render();
            
            requestAnimationFrame(gameLoop);
        }
        
        // ========== OVERLAY HANDLERS ==========
        document.getElementById('tryBtn').addEventListener('click', () => {
            // Request fullscreen (optional)
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
            }
            
            document.getElementById('tryOverlay').classList.add('hidden');
            document.getElementById('startOverlay').classList.remove('hidden');
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            document.getElementById('startOverlay').classList.add('hidden');
            game.running = true;
            showMessage('Good luck!');
        });
        
        // ========== START GAME ==========
        init();
        requestAnimationFrame(gameLoop);
    </script>
</body>
</html>
```

---

## III. Required Modifications Per Game

When adapting this template, you **MUST** customize:

### 1. Game State Object
```javascript
const game = {
    running: false,
    // Core stats
    score: 0,
    lives: 3,
    level: 1,
    
    // Player (adjust properties per game type)
    player: {
        x: 400, y: 300,
        vx: 0, vy: 0,
        width: 32, height: 32,
        // Add game-specific properties:
        // fuel: 100,  // for lander games
        // ammo: 10,   // for shooters
        // health: 100 // for survival games
    },
    
    // Game objects
    enemies: [],
    collectibles: [],
    obstacles: [],
    projectiles: [],
    
    // Visual effects
    particles: [],
    
    // Add game-specific arrays as needed
};
```

### 2. Update Function Logic
Replace the basic movement with your game's core mechanic:

**Platformer:**
```javascript
// Gravity + Jump
const GRAVITY = 0.5;
game.player.vy += GRAVITY * dt;
game.player.y += game.player.vy * dt;

if (input.action && game.player.isGrounded) {
    game.player.vy = -12; // jump
}
```

**Shooter:**
```javascript
// Shooting mechanic
if (input.action && game.shootCooldown <= 0) {
    game.projectiles.push({
        x: game.player.x,
        y: game.player.y,
        vx: 0,
        vy: -10
    });
    game.shootCooldown = 0.3; // 300ms between shots
}
game.shootCooldown -= dt;
```

**Lander:**
```javascript
// Thrust + Rotation
if (input.left) game.player.angle -= 0.04 * dt;
if (input.right) game.player.angle += 0.04 * dt;
if (input.action && game.player.fuel > 0) {
    game.player.vx += Math.sin(game.player.angle) * 0.1;
    game.player.vy -= Math.cos(game.player.angle) * 0.1;
    game.player.fuel -= 0.2 * dt;
}
```

### 3. Render Function
Add game-specific visual elements:

```javascript
// Background (parallax example)
ctx.fillStyle = '#0a0a1a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Stars (for space games)
ctx.fillStyle = '#ffffff';
stars.forEach(star => {
    ctx.fillRect(star.x, star.y, 2, 2);
});

// Animated player sprite (instead of rectangle)
ctx.save();
ctx.translate(game.player.x, game.player.y);
ctx.rotate(game.player.angle || 0);

// Draw sprite with animation frame
const frame = Math.floor(Date.now() / 100) % 4; // 4-frame animation
drawSprite(ctx, playerSprite, frame);

ctx.restore();
```

---

## IV. Performance Optimization

### A. Canvas Scaling (Responsive)
```javascript
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    
    ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
```

### B. Object Pooling (Prevent GC Stutter)
```javascript
// Instead of creating/destroying particles constantly:
const particlePool = [];

function getParticle() {
    return particlePool.pop() || { x: 0, y: 0, vx: 0, vy: 0, life: 0 };
}

function releaseParticle(p) {
    particlePool.push(p);
}

// Usage:
function createParticle(x, y) {
    const p = getParticle();
    p.x = x;
    p.y = y;
    p.life = 1;
    game.particles.push(p);
}

function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            releaseParticle(game.particles.splice(i, 1)[0]);
        }
    }
}
```

---

## V. Checklist Before Declaring Complete

Use this checklist for EVERY game:

### Functionality
- [ ] No console errors
- [ ] Game starts on button click
- [ ] All controls work (keyboard + touch)
- [ ] Score updates correctly
- [ ] Death/restart works
- [ ] High score saves (localStorage)

### Visual Polish
- [ ] Player sprite animated (not static rectangle)
- [ ] Enemies animated or distinctive
- [ ] Particles on key events
- [ ] Background has depth (not flat color)
- [ ] UI readable on all backgrounds

### Difficulty
- [ ] First 30s tutorial-easy (90% success rate)
- [ ] Can survive 1+ minutes on first try
- [ ] Deaths feel fair (not random)
- [ ] Clear improvement path visible

### Age-Appropriateness
- [ ] Controls respond within 50ms
- [ ] Hitboxes forgiving (20-30% smaller than visual)
- [ ] No pixel-perfect timing required
- [ ] Feedback immediate (sound + visual)

### Performance
- [ ] 60 FPS on target hardware
- [ ] No memory leaks (test 10-minute session)
- [ ] Loads in <3 seconds
- [ ] Works on mobile (touch controls)

---

## VI. Common Template Variants

### Variant A: No Lives System (Endless Runner)
Remove `lives` stat, add `distance`:

```javascript
const game = {
    score: 0,
    distance: 0, // meters traveled
    speed: 5,    // increases over time
    // ...
};

function update(dt) {
    game.distance += game.speed * dt;
    game.speed += 0.01 * dt; // gradual acceleration
    document.getElementById('distance').textContent = Math.floor(game.distance);
}
```

### Variant B: Timer-Based (Survival)
Add countdown timer:

```javascript
const game = {
    timeRemaining: 60, // seconds
    // ...
};

function update(dt) {
    game.timeRemaining -= dt;
    if (game.timeRemaining <= 0) {
        gameWon();
    }
    document.getElementById('timer').textContent = Math.ceil(game.timeRemaining);
}
```

### Variant C: Wave-Based (Tower Defense)
Add wave system:

```javascript
const game = {
    wave: 1,
    enemiesRemaining: 0,
    waveDelay: 3, // seconds between waves
    // ...
};

function startWave() {
    const count = 5 + (game.wave * 2);
    for (let i = 0; i < count; i++) {
        spawnEnemy();
    }
    game.enemiesRemaining = count;
}

function update(dt) {
    if (game.enemiesRemaining === 0 && game.enemies.length === 0) {
        game.waveDelay -= dt;
        if (game.waveDelay <= 0) {
            game.wave++;
            game.waveDelay = 3;
            startWave();
        }
    }
}
```

---

**END OF TEMPLATE STRUCTURE**

Use this as the starting point for ALL new games. Deviations require justification.