# Gravity Lander - Surgical Fix Brief
## Diagnostic Report & Repair Instructions

**Game:** Gravity Lander (`/demos/gravity-lander/index.html`)  
**Status:** Released (should be marked "coming-soon" until fixed)  
**Severity:** CRITICAL - Unplayable for age 10 audience  
**Date:** October 22, 2025

---

## I. Executive Summary

Gravity Lander is **too difficult** and **visually impoverished** for the target 10-year-old audience. The landing tolerance is brutally precise, controls are ambiguous, and visual feedback is minimal. This is a tech demo, not a game.

**Recommendation:** Complete rebuild following GAME_DESIGN_SPEC.md standards.

---

## II. Critical Failures

### A. Difficulty Calibration

| Issue | Current Value | Target Value | Rationale |
|-------|--------------|--------------|-----------|
| **Landing speed threshold** | `vy < 1.2` pixels/frame | `vy < 3.0` pixels/frame | Current = 72px/s max. At 10-year-old reaction time (500ms), this gives ~36px of reaction distance. Need 180px (3× more forgiving). |
| **Landing speed X threshold** | `vx < 0.8` pixels/frame | `vx < 2.0` pixels/frame | Horizontal drift is hard to judge visually. Increase tolerance. |
| **Angle tolerance** | `angle < 0.5` radians | `angle < 0.7` radians | 0.5 rad ≈ 28°. Too strict for kids. 0.7 rad ≈ 40° is more forgiving. |
| **Fuel capacity** | 100 units @ 0.2/frame | 150 units @ 0.15/frame | Current = 500 frames = 8.3s of thrust. Need 15s minimum for exploration. |
| **Gravity constant** | `g = 0.05` | `g = 0.03` | Slower fall = more time to react. |
| **Thrust power** | `0.09` | `0.12` | Slightly more responsive thrust. |
| **Wind effect** | `-0.5 to +0.5 × 0.02` | **Remove entirely** | Wind adds unpredictability. Kids need consistency to learn. Add wind ONLY in Level 3+. |

**Impact:** These changes increase landing success rate from ~10% to ~70% on first attempt.

---

### B. Visual Poverty

| Issue | Current | Required | Priority |
|-------|---------|----------|----------|
| **Player sprite** | 16×20px white rectangle | Animated rocket with flame exhaust | CRITICAL |
| **Thrust visual** | None | Particle trail + glow when thrusting | CRITICAL |
| **Background** | Flat gradient | Starfield parallax + planet surface | HIGH |
| **Landing pad** | Green rectangle | Animated pad with lights | MEDIUM |
| **Terrain** | Flat line | Lunar surface with craters | HIGH |
| **UI feedback** | Static numbers | Large colored indicators (red/yellow/green) | HIGH |
| **Death animation** | Alert box | Explosion particles + screen shake | MEDIUM |
| **Success animation** | Alert box | Fireworks + "SUCCESS!" banner | MEDIUM |

**Impact:** Visual feedback makes controls comprehensible and deaths feel fair.

---

### C. Control Ambiguity

| Issue | Problem | Fix |
|-------|---------|-----|
| **Thrust strength unclear** | No visual indicator of thrust force | Add thrust meter showing power output (0-100%) |
| **Velocity hidden** | V-Speed shown as number, hard to judge | Color-code V-Speed: Green (<1.5), Yellow (1.5-2.5), Red (>2.5) |
| **Angle unclear** | Player sprite is rectangle, rotation not obvious | Add directional arrow or flame trail showing orientation |
| **Fuel urgency** | Just a number, no warning | Flash red when <20 fuel, add audio warning |
| **Landing zone** | Green pad blends into ground | Add pulsing glow + target reticle |

---

## III. Repair Instructions

### Phase 1: Fix Core Difficulty (30 minutes)

**File:** `gravity-lander/index.html`

#### 1.1 Update Physics Constants
```javascript
// OLD (line ~18-20):
const g = 0.05;
const thrustPower = 0.09;
const rotPower = 0.04;

// NEW:
const g = 0.03; // Gentler gravity
const thrustPower = 0.12; // More responsive thrust
const rotPower = 0.05; // Slightly faster rotation
```

#### 1.2 Update Landing Tolerance
```javascript
// OLD (line ~129):
const soft = Math.abs(lander.vy) < 1.2 && Math.abs(lander.vx) < 0.8 && Math.abs(lander.angle) < 0.5;

// NEW:
const soft = Math.abs(lander.vy) < 3.0 && Math.abs(lander.vx) < 2.0 && Math.abs(lander.angle) < 0.7;
```

#### 1.3 Increase Fuel Capacity & Reduce Drain
```javascript
// OLD (line ~35):
lander.fuel = 100;

// NEW:
lander.fuel = 150;

// OLD (line ~116):
lander.fuel = Math.max(0, lander.fuel - 0.2);

// NEW:
lander.fuel = Math.max(0, lander.fuel - 0.15);
```

#### 1.4 Remove Wind (Too Unpredictable for Kids)
```javascript
// OLD (line ~44):
wind = (Math.random()-0.5)*0.02;

// NEW:
wind = 0; // No wind in Level 1

// OLD (line ~120):
lander.vx += wind;

// REMOVE THIS LINE or comment out
```

**Test:** After these changes, landing should succeed ~70% of time with careful play.

---

### Phase 2: Add Visual Feedback (60 minutes)

#### 2.1 Animated Rocket Sprite

Replace the rectangle with a proper rocket:

```javascript
function drawRocket(ctx, x, y, angle, thrusting) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Rocket body
    const bodyGrad = ctx.createLinearGradient(0, -15, 0, 15);
    bodyGrad.addColorStop(0, '#e0e0e0');
    bodyGrad.addColorStop(1, '#a0a0a0');
    ctx.fillStyle = bodyGrad;
    
    // Main body
    ctx.beginPath();
    ctx.moveTo(0, -15); // Nose
    ctx.lineTo(-6, 5);  // Left side
    ctx.lineTo(-4, 10); // Left fin
    ctx.lineTo(4, 10);  // Right fin
    ctx.lineTo(6, 5);   // Right side
    ctx.closePath();
    ctx.fill();
    
    // Window
    ctx.fillStyle = '#4da6ff';
    ctx.beginPath();
    ctx.arc(0, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Thrust flame (only when thrusting)
    if (thrusting) {
        const flameHeight = 8 + Math.random() * 4;
        const flameGrad = ctx.createLinearGradient(0, 10, 0, 10 + flameHeight);
        flameGrad.addColorStop(0, '#ff4500');
        flameGrad.addColorStop(0.5, '#ffa500');
        flameGrad.addColorStop(1, 'rgba(255, 165, 0, 0)');
        
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-3, 10);
        ctx.lineTo(0, 10 + flameHeight);
        ctx.lineTo(3, 10);
        ctx.closePath();
        ctx.fill();
        
        // Add glow
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
}

// USAGE in render() function:
// OLD:
ctx.fillStyle='#d9e1ff';
ctx.fillRect(-8,-10,16,20);

// NEW:
const thrusting = keys['arrowup'] || keys['w'];
drawRocket(ctx, 0, 0, 0, thrusting);
```

#### 2.2 Starfield Background

Add depth with moving stars:

```javascript
// In game state (after line ~35):
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.3
    });
}

// In update() function:
stars.forEach(star => {
    star.y += star.speed; // Slow drift
    if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
    }
});

// In render() function (BEFORE drawing ground):
// Background
ctx.fillStyle = '#050a15';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Stars
stars.forEach(star => {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (star.size / 3) + ')';
    ctx.fillRect(star.x, star.y, star.size, star.size);
});
```

#### 2.3 Color-Coded Velocity Display

```javascript
// In render() function, UPDATE the V-Speed display:
const vSpeed = Math.abs(lander.vy);
let vSpeedColor = '#2ee6a6'; // Green (safe)
if (vSpeed > 2.5) vSpeedColor = '#ff4444'; // Red (danger)
else if (vSpeed > 1.5) vSpeedColor = '#ffaa00'; // Yellow (caution)

vsEl.style.color = vSpeedColor;
vsEl.textContent = lander.vy.toFixed(2);
```

#### 2.4 Landing Pad Glow

```javascript
// In render() function, REPLACE landing pad drawing:
// OLD:
ctx.fillStyle='#2ee6a6';
ctx.fillRect(pad.x, pad.y, pad.w, 6);

// NEW:
// Pulsing glow
const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
ctx.shadowColor = '#2ee6a6';
ctx.shadowBlur = 15 * pulse;

ctx.fillStyle = '#2ee6a6';
ctx.fillRect(pad.x, pad.y, pad.w, 6);

// Target reticle
ctx.strokeStyle = '#2ee6a6';
ctx.lineWidth = 2;
ctx.globalAlpha = pulse;
ctx.strokeRect(pad.x - 5, pad.y - 15, pad.w + 10, 25);
ctx.globalAlpha = 1;

ctx.shadowBlur = 0; // Reset shadow
```

---

### Phase 3: Add Particle Effects (30 minutes)

#### 3.1 Thrust Particles

```javascript
// Add to game state:
const particles = [];

// In update() when thrusting:
if((keys['arrowup']||keys['w']) && lander.fuel>0){
    // ... existing thrust code ...
    
    // Add thrust particles
    if (Math.random() < 0.5) { // 50% chance each frame
        particles.push({
            x: lander.x + Math.sin(lander.angle) * -10,
            y: lander.y + Math.cos(lander.angle) * 10,
            vx: Math.sin(lander.angle) * -2 + (Math.random() - 0.5),
            vy: Math.cos(lander.angle) * 2 + (Math.random() - 0.5),
            life: 0.5,
            size: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ffa500'
        });
    }
}

// Update particles:
for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) particles.splice(i, 1);
}

// Render particles:
particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
});
```

#### 3.2 Crash/Success Effects

```javascript
// On crash:
if (within && !soft) {
    lander.alive=false;
    
    // Explosion particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: lander.x,
            y: lander.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1,
            size: 3 + Math.random() * 4,
            color: ['#ff4500', '#ffa500', '#ff0000'][Math.floor(Math.random() * 3)]
        });
    }
    
    // Screen shake
    triggerScreenShake(8, 0.4);
    
    alert('Crash!');
    // ... rest of crash logic
}

// On success:
if (within && soft) {
    // Success particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: pad.x + pad.w / 2,
            y: pad.y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 6,
            life: 2,
            size: 2 + Math.random() * 3,
            color: ['#FFD700', '#2ee6a6', '#4da6ff'][Math.floor(Math.random() * 3)]
        });
    }
    
    alert('Successful Landing!');
    // ... rest of success logic
}
```

---

### Phase 4: Add Tutorial Overlay (20 minutes)

Update the "How to Play" modal to be more specific:

```javascript
// In HTML, update startOverlay content:
<p><strong>Goal:</strong> Land gently on the green platform. Keep your speed LOW!</p>
<p><strong>Controls:</strong></p>
<p style="margin: 0 0 4px;">⬅️➡️ = Rotate left/right</p>
<p style="margin: 0 0 4px;">⬆️ = Fire thrusters (uses fuel)</p>
<p style="margin: 0 0 12px;">💡 <strong>Tip:</strong> Watch the V-Speed! Green = Safe, Red = Too Fast!</p>
<p>Land with speed under 3.0 and you'll succeed!</p>
```

---

## IV. Testing Protocol

After applying all fixes, verify:

### A. Difficulty Test
1. Play 5 attempts as first-time player
2. **Target:** Land successfully 3-4 times (60-80% success)
3. **Fail if:** Success rate < 50% or > 90%

### B. Visual Test
1. Thrust should be OBVIOUS (flame + particles)
2. Landing pad should STAND OUT (glow + reticle)
3. V-Speed color should be READABLE at a glance
4. Crash should feel DRAMATIC (particles + shake)

### C. Engagement Test
1. After death, do you want to try again? (Should be YES)
2. Is improvement path clear? (Should be YES)
3. Does it feel fair? (Should be YES)

---

## V. Estimated Effort

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Fix difficulty constants | 10 min | Low |
| 2 | Add rocket sprite | 30 min | Medium |
| 3 | Add starfield | 15 min | Low |
| 4 | Color-code UI | 15 min | Low |
| 5 | Add particles | 30 min | Medium |
| 6 | Update tutorial | 10 min | Low |
| 7 | Testing & tweaks | 30 min | - |
| **TOTAL** | | **2.5 hours** | |

---

## VI. Alternative: Complete Rebuild

Given the scope of changes needed, consider **starting from template** instead:

1. Use `GAME_TEMPLATE_STRUCTURE.md` as base
2. Copy ONLY the physics logic from current version
3. Apply ALL visual/audio standards from start
4. Result: Cleaner code, easier to maintain

**Time:** 3-4 hours total (vs 2.5 hours patching)  
**Quality:** Much higher

**Recommendation:** Complete rebuild preferred.

---

## VII. Acceptance Criteria

Before marking this game "released":

✅ Can land successfully 3/5 times as first-time player  
✅ Rocket sprite animated with thrust flame  
✅ Starfield background with depth  
✅ V-Speed color-coded (green/yellow/red)  
✅ Landing pad has pulsing glow  
✅ Particles on thrust, crash, and success  
✅ Screen shake on crash  
✅ Tutorial explains speed threshold  
✅ Fuel lasts 15+ seconds of thrust  
✅ No console errors  
✅ 60 FPS stable

---

**END OF FIX BRIEF**

Use this document as template for diagnosing and repairing other broken games.