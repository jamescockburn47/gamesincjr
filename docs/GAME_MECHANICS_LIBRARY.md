# Game Mechanics Library
## Reusable Patterns & Systems for Games Inc Jr

**Version:** 1.0  
**Last Updated:** October 22, 2025

---

## I. Physics Systems

### A. Gravity & Falling

#### Basic Gravity (Platformers, Landers)
```javascript
const GRAVITY = 0.5; // pixels per frame² (60 FPS)
const TERMINAL_VELOCITY = 10; // max fall speed

function updateGravity(entity, dt) {
    entity.vy += GRAVITY * dt;
    entity.vy = Math.min(entity.vy, TERMINAL_VELOCITY);
    entity.y += entity.vy * dt;
}
```

#### Variable Jump Height (Responsive Feel)
```javascript
const JUMP_POWER = -12;
const JUMP_HOLD_BOOST = 0.3;
const MAX_JUMP_HOLD = 0.3; // seconds

let jumpHoldTime = 0;

function handleJump() {
    if (keys['space'] && isGrounded) {
        entity.vy = JUMP_POWER;
        jumpHoldTime = 0;
    }
    
    // Hold space for higher jump
    if (keys['space'] && jumpHoldTime < MAX_JUMP_HOLD && entity.vy < 0) {
        entity.vy += JUMP_HOLD_BOOST;
        jumpHoldTime += dt;
    }
}
```

**Tuning for Age 10:**
- Jump height should clear 2-3× player height
- Coyote time: 0.1s after leaving platform (still allow jump)
- Jump buffer: 0.1s before landing (queue jump input)

---

### B. Movement & Acceleration

#### Smooth Acceleration (Feels Natural)
```javascript
const ACCELERATION = 0.8;
const MAX_SPEED = 5;
const FRICTION = 0.85;

function updateMovement(entity, dt) {
    // Input
    if (keys['arrowleft'] || keys['a']) {
        entity.vx -= ACCELERATION * dt;
    }
    if (keys['arrowright'] || keys['d']) {
        entity.vx += ACCELERATION * dt;
    }
    
    // Cap speed
    entity.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, entity.vx));
    
    // Apply friction when no input
    if (!keys['arrowleft'] && !keys['arrowright'] && !keys['a'] && !keys['d']) {
        entity.vx *= FRICTION;
        if (Math.abs(entity.vx) < 0.1) entity.vx = 0; // Stop jitter
    }
    
    // Update position
    entity.x += entity.vx * dt;
}
```

#### Instant Movement (Arcade Feel - Simpler for Kids)
```javascript
const MOVE_SPEED = 4;

function updateMovement(entity, dt) {
    entity.vx = 0;
    entity.vy = 0;
    
    if (keys['arrowleft'] || keys['a']) entity.vx = -MOVE_SPEED;
    if (keys['arrowright'] || keys['d']) entity.vx = MOVE_SPEED;
    if (keys['arrowup'] || keys['w']) entity.vy = -MOVE_SPEED;
    if (keys['arrowdown'] || keys['s']) entity.vy = MOVE_SPEED;
    
    // Normalize diagonal movement
    if (entity.vx !== 0 && entity.vy !== 0) {
        entity.vx *= 0.707; // 1/√2
        entity.vy *= 0.707;
    }
    
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
}
```

**When to use which:**
- **Smooth acceleration**: Platformers, racing games (feels realistic)
- **Instant movement**: Top-down games, grid-based games (easier to control)

---

### C. Collision Detection

#### AABB (Axis-Aligned Bounding Box) - Fast & Simple
```javascript
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}
```

#### Circle Collision (More Forgiving)
```javascript
function checkCircleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    return distance < (a.radius + b.radius);
}
```

#### Forgiving Hitboxes (CRITICAL for Age 10)
```javascript
// Visual sprite size
const SPRITE_SIZE = 32;

// Actual hitbox (70% of visual)
const HITBOX_SIZE = SPRITE_SIZE * 0.7; // 22.4px

// For collectibles, make even more forgiving
const COLLECT_RADIUS = SPRITE_SIZE * 1.2; // 38.4px (20% larger than visual)
```

**Best Practice:** Always make hitboxes SMALLER than visual sprites by 20-30%.

---

## II. Enemy AI Patterns

### A. Basic Patrol

```javascript
const enemy = {
    x: 100, y: 100,
    vx: 2, // patrol speed
    patrolLeft: 50,
    patrolRight: 200
};

function updatePatrol(enemy, dt) {
    enemy.x += enemy.vx * dt;
    
    // Bounce at patrol boundaries
    if (enemy.x <= enemy.patrolLeft || enemy.x >= enemy.patrolRight) {
        enemy.vx *= -1; // reverse direction
    }
}
```

### B. Chase Player (Simple)

```javascript
const CHASE_SPEED = 3;
const CHASE_RANGE = 150; // pixels

function updateChase(enemy, player, dt) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance < CHASE_RANGE) {
        // Move toward player
        enemy.vx = (dx / distance) * CHASE_SPEED;
        enemy.vy = (dy / distance) * CHASE_SPEED;
    } else {
        // Too far, return to patrol
        enemy.vx = 0;
        enemy.vy = 0;
    }
    
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
}
```

### C. State Machine (Advanced but Clean)

```javascript
const enemy = {
    state: 'idle',
    stateTimer: 0,
    x: 100, y: 100,
    vx: 0, vy: 0
};

function updateEnemyAI(enemy, player, dt) {
    enemy.stateTimer -= dt;
    
    switch(enemy.state) {
        case 'idle':
            if (enemy.stateTimer <= 0) {
                enemy.state = 'patrol';
                enemy.stateTimer = 5; // patrol for 5 seconds
                enemy.vx = Math.random() > 0.5 ? 2 : -2;
            }
            break;
            
        case 'patrol':
            enemy.x += enemy.vx * dt;
            
            const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (distToPlayer < 100) {
                enemy.state = 'chase';
                enemy.stateTimer = 10;
            }
            
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 2;
                enemy.vx = 0;
            }
            break;
            
        case 'chase':
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;
            
            enemy.vx = (dx / dist) * 4;
            enemy.vy = (dy / dist) * 4;
            
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
            
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 2;
            }
            break;
    }
}
```

**Age 10 AI Rules:**
- Telegraph attacks (visible wind-up animation, 0.5-1s)
- Predictable patterns (no erratic movement)
- Fair chase (slightly slower than player)

---

## III. Scoring & Feedback Systems

### A. Score Popup (Visual Juice)

```javascript
const scorePopups = [];

function createScorePopup(x, y, value) {
    scorePopups.push({
        x, y,
        value,
        life: 1, // seconds
        vy: -2 // float upward
    });
}

function updateScorePopups(dt) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y += popup.vy * dt;
        popup.life -= dt;
        
        if (popup.life <= 0) {
            scorePopups.splice(i, 1);
        }
    }
}

function renderScorePopups(ctx) {
    scorePopups.forEach(popup => {
        ctx.save();
        ctx.globalAlpha = popup.life; // fade out
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`+${popup.value}`, popup.x, popup.y);
        ctx.restore();
    });
}

// Usage:
if (collectedCoin) {
    score += 10;
    createScorePopup(coin.x, coin.y, 10);
}
```

### B. Combo System

```javascript
const combo = {
    count: 0,
    multiplier: 1,
    timer: 0,
    COMBO_WINDOW: 2 // seconds to maintain combo
};

function addToCombo(baseScore) {
    combo.count++;
    combo.timer = combo.COMBO_WINDOW;
    
    // Multiplier increases every 5 hits
    combo.multiplier = 1 + Math.floor(combo.count / 5);
    
    const finalScore = baseScore * combo.multiplier;
    score += finalScore;
    
    return finalScore; // for popup display
}

function updateCombo(dt) {
    if (combo.timer > 0) {
        combo.timer -= dt;
        
        if (combo.timer <= 0) {
            // Combo broken
            combo.count = 0;
            combo.multiplier = 1;
        }
    }
}

function renderCombo(ctx) {
    if (combo.multiplier > 1) {
        ctx.save();
        ctx.fillStyle = '#FF4500';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${combo.multiplier}× COMBO!`, canvas.width / 2, 50);
        ctx.restore();
    }
}
```

### C. Particle Effects (Screen Juice)

```javascript
const particles = [];

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const speed = 2 + Math.random() * 3;
        
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.5,
            size: 3 + Math.random() * 3,
            color
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2; // gravity
        p.life -= dt;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function renderParticles(ctx) {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Usage examples:
createParticles(coin.x, coin.y, '#FFD700', 10); // gold burst
createParticles(enemy.x, enemy.y, '#FF0000', 15); // red explosion
createParticles(player.x, player.y + 10, '#FFFFFF', 5); // dust trail
```

---

## IV. Power-Up Systems

### A. Temporary Power-Up Template

```javascript
const powerUp = {
    type: 'speed_boost',
    duration: 5, // seconds
    active: false,
    timer: 0,
    originalValue: 0
};

function activatePowerUp(type) {
    switch(type) {
        case 'speed_boost':
            powerUp.originalValue = player.speed;
            player.speed *= 2;
            break;
        case 'invincibility':
            powerUp.originalValue = player.invincible;
            player.invincible = true;
            break;
        case 'double_score':
            powerUp.originalValue = scoreMultiplier;
            scoreMultiplier *= 2;
            break;
    }
    
    powerUp.active = true;
    powerUp.timer = powerUp.duration;
    powerUp.type = type;
}

function updatePowerUp(dt) {
    if (powerUp.active) {
        powerUp.timer -= dt;
        
        if (powerUp.timer <= 0) {
            // Revert effect
            switch(powerUp.type) {
                case 'speed_boost':
                    player.speed = powerUp.originalValue;
                    break;
                case 'invincibility':
                    player.invincible = false;
                    break;
                case 'double_score':
                    scoreMultiplier = powerUp.originalValue;
                    break;
            }
            
            powerUp.active = false;
        }
    }
}

function renderPowerUpTimer(ctx) {
    if (powerUp.active) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 50, 150, 30);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(10, 50, 150 * (powerUp.timer / powerUp.duration), 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.type.toUpperCase(), 85, 70);
        ctx.restore();
    }
}
```

---

## V. Screen Effects

### A. Screen Shake (Impact Feel)

```javascript
const screenShake = {
    intensity: 0,
    duration: 0
};

function triggerScreenShake(intensity = 4, duration = 0.2) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.intensity *= 0.9; // decay
    } else {
        screenShake.intensity = 0;
    }
}

function applyScreenShake(ctx) {
    if (screenShake.intensity > 0) {
        const offsetX = (Math.random() - 0.5) * screenShake.intensity;
        const offsetY = (Math.random() - 0.5) * screenShake.intensity;
        ctx.translate(offsetX, offsetY);
    }
}

// Usage in render function:
function render() {
    ctx.save();
    applyScreenShake(ctx);
    
    // ... draw everything ...
    
    ctx.restore();
}

// Trigger on impact:
if (playerHitEnemy) {
    triggerScreenShake(6, 0.3); // strong shake
}
if (collectedCoin) {
    triggerScreenShake(2, 0.1); // subtle shake
}
```

### B. Slow Motion (Dramatic Effect)

```javascript
const timeScale = {
    current: 1.0,
    target: 1.0,
    TRANSITION_SPEED: 3
};

function setSlowMotion(scale, duration) {
    timeScale.target = scale;
    setTimeout(() => {
        timeScale.target = 1.0;
    }, duration * 1000);
}

function updateTimeScale(dt) {
    if (timeScale.current !== timeScale.target) {
        const diff = timeScale.target - timeScale.current;
        timeScale.current += diff * timeScale.TRANSITION_SPEED * dt;
        
        if (Math.abs(diff) < 0.01) {
            timeScale.current = timeScale.target;
        }
    }
}

// Apply to all game updates:
function gameLoop(time) {
    const rawDt = (time - lastTime) / 1000;
    const dt = rawDt * timeScale.current; // scaled time
    lastTime = time;
    
    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

// Usage:
if (bossDefeated) {
    setSlowMotion(0.3, 2); // 30% speed for 2 seconds
}
```

---

## VI. Progression & Difficulty

### A. Adaptive Difficulty (Keeps Players in Flow State)

```javascript
const difficulty = {
    base: 1.0,
    current: 1.0,
    deathCount: 0,
    lastDeathTime: 0,
    MIN: 0.5,
    MAX: 2.5
};

function onPlayerDeath() {
    difficulty.deathCount++;
    difficulty.lastDeathTime = Date.now();
    
    // Died 3+ times in last minute? Reduce difficulty
    if (difficulty.deathCount >= 3 && 
        (Date.now() - difficulty.lastDeathTime) < 60000) {
        difficulty.current = Math.max(
            difficulty.MIN,
            difficulty.current * 0.9
        );
        showMessage("Difficulty adjusted!");
    }
}

function onPlayerSuccess() {
    // Survived 2 minutes without dying? Increase difficulty
    if (Date.now() - difficulty.lastDeathTime > 120000) {
        difficulty.current = Math.min(
            difficulty.MAX,
            difficulty.current * 1.1
        );
        difficulty.deathCount = 0;
    }
}

// Apply to game values:
const enemySpeed = BASE_ENEMY_SPEED * difficulty.current;
const spawnRate = BASE_SPAWN_RATE / difficulty.current;
```

### B. Level Progression Template

```javascript
const levels = [
    { // Level 1: Tutorial
        enemyCount: 3,
        enemySpeed: 1,
        obstacleCount: 2,
        duration: 60, // seconds
        successRate: 0.9 // expect 90% success
    },
    { // Level 2: Easy
        enemyCount: 5,
        enemySpeed: 1.2,
        obstacleCount: 4,
        duration: 90,
        successRate: 0.7
    },
    { // Level 3: Medium
        enemyCount: 8,
        enemySpeed: 1.5,
        obstacleCount: 6,
        duration: 120,
        successRate: 0.5
    }
    // ... more levels
];

let currentLevel = 0;

function loadLevel(levelIndex) {
    const level = levels[levelIndex];
    
    // Clear previous level
    enemies = [];
    obstacles = [];
    
    // Spawn enemies
    for (let i = 0; i < level.enemyCount; i++) {
        enemies.push(createEnemy(level.enemySpeed));
    }
    
    // Spawn obstacles
    for (let i = 0; i < level.obstacleCount; i++) {
        obstacles.push(createObstacle());
    }
    
    levelTimer = level.duration;
}

function onLevelComplete() {
    currentLevel++;
    if (currentLevel < levels.length) {
        loadLevel(currentLevel);
    } else {
        // Game won!
        showVictoryScreen();
    }
}
```

---

## VII. Input Handling

### A. Keyboard + Touch Unified System

```javascript
const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    action: false
};

// Keyboard
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = true;
    if (key === 'arrowright' || key === 'd') input.right = true;
    if (key === 'arrowup' || key === 'w') input.up = true;
    if (key === 'arrowdown' || key === 's') input.down = true;
    if (key === ' ' || key === 'enter') input.action = true;
});

document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = false;
    if (key === 'arrowright' || key === 'd') input.right = false;
    if (key === 'arrowup' || key === 'w') input.up = false;
    if (key === 'arrowdown' || key === 's') input.down = false;
    if (key === ' ' || key === 'enter') input.action = false;
});

// Touch buttons (HTML)
/*
<div class="mobile-controls">
    <button id="btn-left">◀</button>
    <button id="btn-right">▶</button>
    <button id="btn-action">⚡</button>
</div>
*/

// Touch button handlers
function bindTouchButton(id, inputKey) {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        input[inputKey] = true;
    });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        input[inputKey] = false;
    });
}

bindTouchButton('btn-left', 'left');
bindTouchButton('btn-right', 'right');
bindTouchButton('btn-action', 'action');

// Now use 'input' object everywhere:
if (input.left) player.vx = -5;
if (input.right) player.vx = 5;
if (input.action) shoot();
```

---

## VIII. Save System (localStorage)

```javascript
const saveData = {
    highScore: 0,
    unlockedLevels: [1],
    settings: {
        music: true,
        sfx: true,
        difficulty: 'normal'
    }
};

function saveGame() {
    localStorage.setItem('gameData', JSON.stringify(saveData));
}

function loadGame() {
    const data = localStorage.getItem('gameData');
    if (data) {
        Object.assign(saveData, JSON.parse(data));
    }
}

function updateHighScore(newScore) {
    if (newScore > saveData.highScore) {
        saveData.highScore = newScore;
        saveGame();
        return true; // new high score!
    }
    return false;
}

// Call on game start:
loadGame();

// Call after game over:
if (updateHighScore(finalScore)) {
    showMessage("NEW HIGH SCORE!");
}
```

---

## IX. Common Pitfalls

### Avoid These Mistakes:

1. **Physics timestep bugs:**
   ```javascript
   // ❌ BAD: Framerate-dependent
   player.x += player.vx; // moves faster at higher FPS
   
   // ✅ GOOD: Delta-time scaling
   player.x += player.vx * dt;
   ```

2. **Collision detection after movement:**
   ```javascript
   // ❌ BAD: Can clip through walls
   player.x += player.vx * dt;
   if (checkCollision(player, wall)) player.x -= player.vx * dt;
   
   // ✅ GOOD: Predict and prevent
   const nextX = player.x + player.vx * dt;
   if (!checkCollision({...player, x: nextX}, wall)) {
       player.x = nextX;
   }
   ```

3. **Array modification during iteration:**
   ```javascript
   // ❌ BAD: Skips elements
   enemies.forEach((enemy, i) => {
       if (enemy.dead) enemies.splice(i, 1);
   });
   
   // ✅ GOOD: Iterate backwards
   for (let i = enemies.length - 1; i >= 0; i--) {
       if (enemies[i].dead) enemies.splice(i, 1);
   }
   ```

---

**END OF MECHANICS LIBRARY**

Reference this document when implementing game systems. All patterns are battle-tested for age 10 audience.