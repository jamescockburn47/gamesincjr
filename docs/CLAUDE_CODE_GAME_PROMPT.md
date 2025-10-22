# Claude Code Game Creation Prompt
## Standardized Instruction Template for Building Games

**Purpose:** Feed this prompt to Claude Code CLI when requesting new game development.  
**Updated:** October 22, 2025

---

## How to Use This Template

1. Fill in the `[GAME_SPECIFIC]` sections with your game idea
2. Copy the entire prompt
3. Run: `claude "paste_prompt_here"`
4. Claude Code will build the complete game following all standards

---

## THE PROMPT (Copy Everything Below This Line)

```
You are building a game for Games Inc Jr, a kids' game platform targeting 10-year-olds.

CRITICAL: Before writing ANY code, you MUST:
1. Read `/docs/GAME_DESIGN_SPEC.md` in full
2. Read `/docs/GAME_MECHANICS_LIBRARY.md` for reusable patterns
3. Read `/docs/GAME_TEMPLATE_STRUCTURE.md` for the base template
4. Read `/docs/GRAVITY_LANDER_FIX.md` to see what NOT to do

===========================================
GAME SPECIFICATION
===========================================

Game Name: [e.g., "Asteroid Dodge"]
Game Type: [e.g., "endless runner" / "platformer" / "shooter" / "puzzle"]
Core Mechanic: [e.g., "dodge falling asteroids while collecting power-ups"]

Win Condition: [e.g., "survive as long as possible, beat high score"]
Lose Condition: [e.g., "hit by asteroid 3 times"]

Target Difficulty: [Age 10 standard - 70% success rate in first 2 minutes]

Controls:
- Keyboard: [e.g., "Arrow keys to move, Space to boost"]
- Touch: [e.g., "Left/Right buttons + Action button"]

Visual Theme: [e.g., "space theme with pixel art asteroids and neon colors"]

Unique Features: [e.g., "combo system for dodging multiple asteroids", "power-up shields"]

===========================================
MANDATORY REQUIREMENTS (DO NOT SKIP)
===========================================

1. DIFFICULTY CALIBRATION
   - First 30 seconds: Tutorial-easy (90% success rate)
   - First 2 minutes: Gradual ramp (70% success rate)
   - Death must feel FAIR, never random or cheap
   - Hitboxes 20-30% smaller than visual sprites
   - Reaction windows: Minimum 500ms for 10-year-old reflexes

2. VISUAL REQUIREMENTS
   - Animated sprites (minimum 3 frames per action)
   - Particle effects on: collect, damage, power-up, death
   - Background with depth (parallax, gradients, NOT flat colors)
   - Color-coded feedback (green=good, yellow=caution, red=danger)
   - Screen shake on impacts (2-4px, 100ms)

3. AUDIO REQUIREMENTS
   - Sound effects on: player action, collect, damage, death
   - Background music loop (optional but recommended)
   - Mute button (M key + UI icon)

4. CONTROL REQUIREMENTS
   - Support BOTH keyboard (WASD + Arrow keys) AND touch
   - Input lag < 50ms
   - Visual feedback on button press
   - On-screen hints for first 10 seconds

5. GAME LOOP ARCHITECTURE
   Action → Feedback → Reward → Escalation → Repeat
   
   Every 15-20 seconds player should achieve a "small win":
   - Collect item
   - Clear obstacle
   - Level up
   - Earn points

6. PROGRESSION SYSTEM
   - Score in meaningful increments (+10, +25, +50, NOT +1)
   - Combo multipliers visible on screen
   - High score saved to localStorage
   - Difficulty increases 5% per minute, caps at 2.5× base

7. FAIL STATE HANDLING
   - Instant restart (R key, no menu navigation)
   - Encouraging message ("Almost! Try again!" not "Game Over")
   - Progress preservation (keep 50% of score if appropriate)
   - Dynamic difficulty: reduce 10% if 3+ deaths in 1 minute

8. TECHNICAL STANDARDS
   - 60 FPS minimum
   - Load time < 3 seconds
   - Responsive canvas (adapts to viewport)
   - No console errors
   - Works on mobile (touch + orientation)

===========================================
FILE STRUCTURE
===========================================

Create:
/public/demos/[game-slug]/index.html  [single self-contained file]

Use the template from GAME_TEMPLATE_STRUCTURE.md as your starting point.

===========================================
DEVELOPMENT PROCESS
===========================================

Step 1: READ THE SPECS
- Thoroughly read all 3 documentation files
- Identify which mechanics from GAME_MECHANICS_LIBRARY.md you'll use
- Note the failure modes in GRAVITY_LANDER_FIX.md to avoid

Step 2: PLAN THE GAME
Before writing code, output a brief plan:
- Core game loop (30-second cycle)
- Key game objects and their properties
- Difficulty progression formula
- Visual feedback moments (when to show particles/shake)

Step 3: BUILD FROM TEMPLATE
- Start with GAME_TEMPLATE_STRUCTURE.md
- Modify game state for your specific game
- Implement core mechanic first (get it playable)
- Add visual polish (animations, particles, effects)
- Tune difficulty (playtest and adjust constants)

Step 4: TESTING CHECKLIST
Before declaring complete, verify:
□ No console errors in 10-minute playtest
□ Can survive 1+ minute on first attempt
□ Deaths feel fair (not random)
□ Hitboxes forgiving (smaller than sprites)
□ Particles on key events
□ Animated sprites (not rectangles)
□ Background has depth
□ Sound effects present
□ Controls work (keyboard + touch)
□ High score saves

Step 5: DOCUMENTATION
Add these comments at top of index.html:
/**
 * [Game Name] - Games Inc Jr
 * 
 * Target Audience: Age 10
 * Difficulty: [Easy/Medium/Hard]
 * 
 * Controls:
 * - Keyboard: [list]
 * - Touch: [list]
 * 
 * Game Design Notes:
 * - [Key difficulty tuning values]
 * - [Core mechanic implementation notes]
 * - [Known issues or TODOs]
 */

===========================================
COMMON PITFALLS TO AVOID
===========================================

❌ DON'T:
- Use pixel-perfect hitboxes (too hard for kids)
- Make first 30 seconds difficult (tutorial phase)
- Use flat colors (looks cheap)
- Create static sprites (boring)
- Forget sound effects (no feedback)
- Skip particles (no juice)
- Use instant difficulty spikes (frustrating)
- Create ambiguous controls (unclear mechanics)
- Use framerate-dependent physics (buggy)
- Modify arrays during forEach (skips elements)

✅ DO:
- Make hitboxes 70% of visual size (forgiving)
- Tutorial-easy first 30 seconds (build confidence)
- Use gradients and depth (visual richness)
- Animate everything (engaging)
- Add sound on every action (feedback)
- Particle effects everywhere (juice)
- Gradual 5% difficulty ramps (fair curve)
- Show controls on screen (clear tutorial)
- Use delta-time physics (smooth 60 FPS)
- Iterate arrays backwards when splicing (correct)

===========================================
QUALITY GATES
===========================================

Your game must pass ALL gates before submission:

Gate 1: PLAYABILITY
- Runs without errors
- Controls responsive
- 60 FPS stable

Gate 2: AGE-APPROPRIATENESS  
- 10-year-old can understand immediately
- 70% success rate in first 2 minutes
- No inappropriate content

Gate 3: POLISH
- Sprites animated
- Particles on events
- Sound on actions
- Background has depth

Gate 4: ENGAGEMENT
- "One more try" feeling
- Clear progression
- Not repetitive

If ANY gate fails, continue development.

===========================================
OUTPUT FORMAT
===========================================

After completing development:

1. Confirm you've created the file at correct path
2. Summarize key features implemented
3. List difficulty tuning constants used
4. Note any deviations from standards (with justification)
5. Report test results (can you survive 1+ minute?)

===========================================
BEGIN DEVELOPMENT
===========================================

Now build the game described in the GAME SPECIFICATION section above.

Follow ALL mandatory requirements.
Use the template structure.
Reference the mechanics library for patterns.
Avoid the mistakes documented in the Gravity Lander fix.

Report progress as you work through each step.
```

---

## Example Usage

### Example 1: Space Shooter

```bash
claude "You are building a game for Games Inc Jr, targeting 10-year-olds.

Read these files first:
- /docs/GAME_DESIGN_SPEC.md
- /docs/GAME_MECHANICS_LIBRARY.md  
- /docs/GAME_TEMPLATE_STRUCTURE.md

Game Name: Cosmic Defender
Game Type: Vertical scrolling shooter
Core Mechanic: Shoot descending aliens while dodging their projectiles

Controls:
- Keyboard: Arrow keys move, Space shoots
- Touch: Left/Right buttons + Shoot button

Visual Theme: Retro arcade with neon colors and pixel art

Unique Features: 
- Power-up system (spread shot, shield, speed boost)
- Combo system for consecutive hits
- Boss fight every 5 waves

Follow ALL requirements in GAME_DESIGN_SPEC.md.
Build at /public/demos/cosmic-defender/index.html"
```

### Example 2: Puzzle Game

```bash
claude "You are building a game for Games Inc Jr, targeting 10-year-olds.

Read these files first:
- /docs/GAME_DESIGN_SPEC.md
- /docs/GAME_MECHANICS_LIBRARY.md
- /docs/GAME_TEMPLATE_STRUCTURE.md

Game Name: Color Match Cascade
Game Type: Match-3 puzzle
Core Mechanic: Swap adjacent gems to create lines of 3+ matching colors

Controls:
- Keyboard: Arrow keys to select, Space to swap
- Touch: Tap to select, tap again to swap

Visual Theme: Bright cartoon style with sparkling gem animations

Unique Features:
- Special gems for 4+ matches
- Cascade combos (falling gems create new matches)
- Target score per level
- Timer-based (60 seconds per level)

Follow ALL requirements in GAME_DESIGN_SPEC.md.
Build at /public/demos/color-match-cascade/index.html"
```

---

## Tips for Best Results

1. **Be specific in the GAME SPECIFICATION section**
   - Vague: "make it fun"
   - Specific: "combo system awards 2× points for 3 consecutive dodges"

2. **Reference existing good games**
   - "Use Arctic Bear Survival as reference for difficulty curve"
   - "Match the visual polish of Alien Unicorn Alliance"

3. **Specify deviations explicitly**
   - "No sound effects for this prototype"
   - "Skip combo system, focus on core mechanic first"

4. **Iterate with feedback**
   - First pass: "Build core mechanic only"
   - Second pass: "Add visual polish and particles"
   - Third pass: "Tune difficulty after playtesting"

---

**END OF PROMPT TEMPLATE**

Save this file and use it as your standard template for all Claude Code game requests.