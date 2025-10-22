# Game Design Specification
## Games Inc Jr - Age 10 Target Audience

**Version:** 1.0  
**Last Updated:** October 22, 2025  
**Author:** Senior Design Standards

---

## I. Cognitive & Motor Baselines (Age 10)

### A. Cognitive Abilities
- **Working Memory**: Can hold 3-4 instructions simultaneously
- **Pattern Recognition**: Strong for simple patterns, emerging for complex ones
- **Strategic Planning**: 2-3 moves ahead maximum
- **Reading Speed**: 150-200 WPM (keep tutorial text under 20 words)
- **Attention Span**: 15-20 minutes optimal play session

### B. Motor Skills
- **Reaction Time**: 400-600ms average (design for 500ms baseline)
- **Simultaneous Inputs**: Maximum 2 keys at once reliably (WASD + Space = limit)
- **Fine Motor Control**: Emerging precision (hitboxes should be forgiving)
- **Touch Accuracy**: 44px minimum touch target (Apple HIG standard)

### C. Emotional Regulation
- **Frustration Tolerance**: Low for "unfair" mechanics
- **Reward Sensitivity**: High - needs frequent positive feedback
- **Fear Response**: Moderate - avoid jump scares or graphic violence
- **Mastery Drive**: Strong - wants to feel competent quickly

---

## II. Mandatory Design Requirements

### A. Difficulty Calibration

#### 1. First 30 Seconds (Tutorial Phase)
- **MUST** succeed on first attempt if instructions followed
- Controls introduced ONE AT A TIME
- No fail states during tutorial
- Visual confirmation of each action (particles, sound, score pop)

#### 2. First 2 Minutes (Learning Phase)
- Difficulty ramps by 10% per 30 seconds
- Player should achieve "small win" every 15-20 seconds
- Fail states allowed but with immediate retry (no menu navigation)

#### 3. Sustained Play (Minutes 3+)
- Challenge curve: difficulty increases 5% per minute until plateau
- "Flow zone" target: 70% success rate on core mechanic
- Reset difficulty slightly after death to reduce frustration

#### 4. Difficulty Tuning Formula
```
effective_difficulty = base_difficulty × (1 + (time_minutes × 0.05))
max_difficulty_multiplier = 2.5× base
```

### B. Visual Design Standards

#### 1. Mandatory Visual Elements
Every game MUST include:
- **Animated player sprite** (not just a rectangle)
- **Parallax or moving background** (creates depth)
- **Particle effects** for key actions (collect, damage, power-up)
- **Screen shake** on impact (2-4px, 100ms duration)
- **Color gradients** (avoid flat colors - looks cheap)
- **Shadows or outlines** for depth perception

#### 2. Color Palette Rules
- **Primary palette**: 3-5 colors maximum
- **Contrast ratio**: 4.5:1 minimum (WCAG AA)
- **Danger states**: Red/orange ONLY (universal recognition)
- **Success states**: Green/gold (universal recognition)
- **Background**: Desaturated (30-50% saturation) so foreground pops

#### 3. Animation Requirements
- **Player movement**: Minimum 3 frames per action
- **Enemy movement**: Must have idle/move/attack states
- **Collectibles**: Pulse, rotate, or bob (static = looks broken)
- **UI transitions**: Fade in/out (100-200ms) not instant

### C. Audio Requirements

#### 1. Sound Effects (Mandatory)
- **Player action**: Jump, shoot, collect (instant feedback)
- **Success**: Coin, point, level-up (positive reinforcement)
- **Failure**: Hit, crash, death (but not scary)
- **Ambient**: Background loop (8-16 bars, seamless)

#### 2. Audio Guidelines
- **Volume**: User-controllable, default 70%
- **No sudden loud noises**: Max 10dB variance
- **Mute button**: Accessible at all times (M key + icon)

### D. Control Schemes

#### 1. Keyboard (Primary)
```
WASD + Arrow Keys: Movement (support both)
Space: Primary action (universal)
E/F: Secondary actions
M: Mute
P/Esc: Pause
R: Restart (after death)
```

#### 2. Touch (Mandatory for Mobile)
- **Virtual buttons**: Minimum 64px diameter
- **Button spacing**: 16px minimum between targets
- **Visual feedback**: Button press = scale to 0.9× for 100ms
- **No drag gestures**: Unreliable on small screens

#### 3. Control Feedback
- **Input lag**: Must be <50ms from press to action
- **Visual confirmation**: Button press shows immediate sprite change
- **Control hints**: Displayed in-game for first 5 seconds

---

## III. Gameplay Architecture

### A. Core Loop Design

#### 1. Minimum Viable Loop (30 seconds)
```
Action → Feedback → Reward → Escalation → Repeat
```

**Example (Platformer):**
1. Jump (action)
2. Land safely (feedback: sound + particle)
3. Collect coin (reward: +10 points, chime sound)
4. Next platform slightly harder (escalation)
5. Repeat

#### 2. Meta-Loop (5-10 minutes)
```
Learn → Master → Test → Unlock → Learn New
```

**Example (Survival Game):**
1. Learn: Gather wood, avoid bears
2. Master: Efficient resource routes
3. Test: Bear charges player
4. Unlock: Build igloo (new safe zone)
5. Learn New: Traps unlock strategic depth

### B. Progression Systems

#### 1. Score System
- **Granular feedback**: +10, +25, +50, +100 (not +1, +2)
- **Combo multipliers**: Visible on-screen (2×, 3×, 5×)
- **High score**: Persistent (localStorage), displayed on death screen

#### 2. Level Progression
- **Level 1**: Tutorial + Easy mode (90% success rate)
- **Level 2-3**: Gradual ramp (70% success rate)
- **Level 4+**: Skill ceiling (50% success rate acceptable)
- **Boss levels**: Every 5 levels, 3× normal difficulty

#### 3. Unlockables (Optional but Recommended)
- **Cosmetic skins**: No gameplay impact, pure reward
- **New abilities**: Unlocked after mastery demonstration
- **Challenge modes**: For advanced players (optional)

### C. Fail States & Recovery

#### 1. Death Mechanics
- **Instant restart**: No menu navigation required
- **Soft checkpoints**: Return to last "safe state" not full restart
- **Progress preservation**: Keep 50% of score/resources
- **Encouragement message**: "Almost! Try again!" not "Game Over"

#### 2. Difficulty Adjustment (Dynamic)
```javascript
if (deaths_in_last_minute > 3) {
    difficulty_multiplier *= 0.9; // Reduce by 10%
    show_hint("Tip: Try [specific strategy]");
}
```

---

## IV. Technical Requirements

### A. Performance Standards
- **Frame rate**: 60 FPS minimum (16.67ms per frame)
- **Load time**: <3 seconds to first interactive frame
- **File size**: <500KB per game (including assets)
- **Browser compatibility**: Chrome 90+, Safari 14+, Firefox 88+

### B. Code Quality
- **No console errors**: Zero errors in production
- **Responsive canvas**: Adapts to viewport (no fixed 800×600)
- **Touch optimization**: No hover states that break on mobile

### C. Accessibility
- **Keyboard-only**: Must be fully playable (no mouse required)
- **Color-blind safe**: Don't rely on red/green distinction
- **Screen reader**: Aria labels for UI elements
- **Reduced motion**: Respect `prefers-reduced-motion` media query

---

## V. Content & Theming

### A. Age-Appropriate Content
**ALLOWED:**
- Cartoon violence (no blood)
- Mild peril (chases, falling)
- Fantasy themes (magic, aliens, robots)
- Competitive scoring

**FORBIDDEN:**
- Realistic violence or gore
- Sexual content or innuendo
- Gambling mechanics (loot boxes)
- Social comparison (vs other named players)
- Real-money transactions

### B. Visual Theming
**Preferred aesthetics:**
- **Pixel art**: 8-bit or 16-bit retro style
- **Flat design**: Bold colors, simple shapes
- **Cartoon**: Hand-drawn or cel-shaded look

**Avoid:**
- Realistic graphics (uncanny valley)
- Dark or horror aesthetics
- Overly complex textures

---

## VI. Playtesting Protocol

### A. Pre-Launch Checklist
Before declaring a game "complete," verify:

1. **Tutorial Clarity**
   - [ ] First-time player can start without reading instructions
   - [ ] Controls shown on-screen for first 10 seconds
   - [ ] Success on first attempt if instructions followed

2. **Difficulty Calibration**
   - [ ] Can survive >1 minute on first try
   - [ ] Death feels fair (not random or cheap)
   - [ ] Clear path to improvement visible

3. **Visual Polish**
   - [ ] Player sprite animated (not static)
   - [ ] Background has depth (parallax or gradients)
   - [ ] Particles on key actions
   - [ ] Smooth frame rate (no jank)

4. **Audio Implementation**
   - [ ] Sound effects on all actions
   - [ ] Background music loops seamlessly
   - [ ] Mute button works

5. **Engagement Test**
   - [ ] "One more try" feeling after death
   - [ ] Clear progression visible (score increasing)
   - [ ] Varied gameplay (not repetitive after 2 minutes)

### B. 10-Year-Old Playtest Questions
If you have access to target age group, ask:
1. "Did you understand what to do right away?"
2. "Was anything confusing or frustrating?"
3. "Did you want to play again after dying?"
4. "What was your favorite part?"
5. "Was it too easy, too hard, or just right?"

---

## VII. Failure Modes to Avoid

### A. Common Design Mistakes

| Failure Mode | Symptom | Fix |
|--------------|---------|-----|
| **Pixel-perfect hitboxes** | Feels unfair, too hard | Reduce hitbox by 20% |
| **No visual feedback** | Boring, unclear | Add particles, screen shake |
| **Instant difficulty spike** | Frustrating deaths | Gradual 5% ramps |
| **Ambiguous controls** | "How do I...?" | On-screen prompts first 10s |
| **Static visuals** | Looks cheap/broken | Animate everything |
| **No sound** | Lifeless, no juice | Minimum 5 sound effects |
| **Tutorial overload** | Players skip/ignore | Show, don't tell (learn by doing) |
| **Restart friction** | Players quit after death | Instant retry (R key) |

---

## VIII. Reference Examples

### A. GOOD: Arctic Bear Survival
**Why it works:**
- Progressive tutorial (docile bears for 15s)
- Multiple systems create depth (traps, fire, crafting)
- Visual polish (particles, gradients, animations)
- Clear feedback (sound, messages, score pops)
- Strategic gameplay (resource management)

### B. BAD: Gravity Lander (Original)
**Why it failed:**
- Too difficult (vSpeed<1.2 is pixel-perfect)
- No visual feedback (rectangle sprite, no thrust glow)
- Ambiguous controls (thrust force unclear)
- No progression (same difficulty forever)
- Visually boring (flat colors, no animation)

---

## IX. Severity Levels

When reviewing games, classify issues by severity:

**CRITICAL (Must Fix Before Release):**
- Unplayable (crashes, soft-locks)
- Too difficult for target age (>80% death rate in first minute)
- Missing core feedback (no sound, no particles)
- Broken controls (inputs don't work)

**HIGH (Fix Before Feature-Complete):**
- Visual poverty (static sprites, flat colors)
- Confusing tutorial (no on-screen hints)
- Frustrating difficulty (60-80% death rate)
- Poor performance (<30 FPS)

**MEDIUM (Polish Phase):**
- Minor visual issues (jagged edges, color mismatches)
- Suboptimal difficulty curve (too easy or too hard)
- Missing secondary feedback (screen shake, combo text)

**LOW (Nice-to-Have):**
- Advanced features (unlockables, achievements)
- Cosmetic variety (skins, color modes)
- Accessibility enhancements (beyond basics)

---

## X. Quality Gates

Before submitting a game for publication, it must pass ALL gates:

### Gate 1: Playability
- [ ] No crashes or errors in 10-minute playtest
- [ ] All controls work on keyboard AND touch
- [ ] Frame rate stable at 60 FPS

### Gate 2: Age-Appropriateness
- [ ] 10-year-old tester can understand and play
- [ ] No inappropriate content (violence, language, themes)
- [ ] Difficulty calibrated to 70% success rate

### Gate 3: Polish
- [ ] Animated sprites (not rectangles)
- [ ] Particle effects on key actions
- [ ] Sound effects on all interactions
- [ ] Visual depth (gradients, shadows, parallax)

### Gate 4: Engagement
- [ ] "One more try" feeling after death
- [ ] Clear progression visible
- [ ] Not repetitive after 5 minutes

**If ANY gate fails, return to development.**

---

## Appendix A: Difficulty Calibration Calculator

Use this formula to tune landing windows, timing thresholds, etc:

```javascript
// For 10-year-olds with 500ms reaction time:
const REACTION_WINDOW = 0.5; // seconds
const FORGIVENESS_MULTIPLIER = 1.5; // 50% extra time

const effective_window = REACTION_WINDOW * FORGIVENESS_MULTIPLIER; // 0.75s

// Example: Landing speed threshold
const MAX_SAFE_SPEED = 3.0; // pixels per frame (60 FPS)
// At 60 FPS, 3px/frame = 180px/second
// Gives player ~0.75s to correct if falling at max speed

// Example: Hitbox sizing
const SPRITE_SIZE = 32; // pixels
const HITBOX_SIZE = SPRITE_SIZE * 0.7; // 22.4px (30% smaller than visual)
```

---

**END OF SPECIFICATION**

This document is the authoritative source for game design standards at Games Inc Jr. All games must comply with these requirements before publication.