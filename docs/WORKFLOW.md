# Game Development Workflow
## Optimal Division of Labor: Chat Interface vs Claude Code CLI

**Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** Production Standard - MANDATORY for all game projects

---

## Executive Summary

This workflow optimizes game development by assigning tasks to the most capable tool:
- **Chat Interface (this conversation)** = Design, critique, refinement
- **Claude Code CLI** = Implementation, mechanical execution

**Key Principle:** Use chat for decisions requiring judgment, use Claude Code for execution requiring speed.

---

## I. Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME DEVELOPMENT CYCLE                    │
└─────────────────────────────────────────────────────────────┘

[DESIGN PHASE]          [IMPLEMENTATION PHASE]      [POLISH PHASE]
    (Chat)                  (Claude Code)               (Chat)
      ↓                          ↓                         ↓
  Concept                    Scaffolding              Visual Tuning
  Mechanics                  Physics Code             Difficulty Balance
  Difficulty Curve           Input Systems            Color Refinement
  Visual Theme               Core Rendering           Particle Polish
      ↓                          ↓                         ↓
  Detailed Spec ----------→  Working Game  ----------→  Production Ready
  (20-30 min)                (90-120 min)              (30-60 min)
```

**Total Time:** 2.5-3.5 hours per game  
**Output Quality:** 8-9/10

---

## II. Phase Breakdown

### PHASE 1: DESIGN (Chat Interface)
**Duration:** 20-30 minutes  
**Location:** This chat conversation  
**Output:** Detailed game specification document

#### What Happens Here:

1. **Concept Refinement**
   ```
   User: "I want a platformer about a ninja collecting scrolls"
   
   Chat Response:
   - Challenge assumptions ("Why scrolls? What makes them compelling?")
   - Identify core loop ("Jump → Collect → Avoid → Progress")
   - Reference similar games ("Like Mega Man but with stealth?")
   - Propose unique mechanic ("Wall-cling for 2 seconds?")
   ```

2. **Mechanics Design**
   ```
   Chat provides:
   - Jump height calculation (for age 10 motor skills)
   - Enemy patrol patterns (reference GAME_MECHANICS_LIBRARY.md)
   - Scroll spawn algorithm (density, placement logic)
   - Power-up system (if applicable)
   - Win/lose conditions
   ```

3. **Difficulty Calibration**
   ```
   Chat calculates:
   - First 30s: Tutorial phase difficulty constants
   - Level 1-3: Progression curve (5% ramps)
   - Hitbox sizes (player: 24px, enemies: 28px, collectibles: 36px)
   - Enemy speeds (Level 1: 2px/frame, Level 2: 2.6px/frame...)
   - Platform spacing (90px gaps for 12px jump height)
   ```

4. **Visual Design Specification**
   ```
   Chat decides:
   - Color palette (specific hex codes: #1a1a2e, #00ffff, etc.)
   - Animation frame counts (ninja run: 4 frames, enemy idle: 2 frames)
   - Particle specifications (collect: 12 gold particles, death: 20 red)
   - Background layers (3-layer parallax with specific scroll speeds)
   - UI layout (HUD position, font sizes, icon dimensions)
   ```

5. **Output: Complete Specification**
   ```markdown
   # Ninja Scroll Collector - Detailed Specification
   
   ## Core Mechanics
   - Player movement: 4px/frame horizontal, jump: -12px initial velocity
   - Gravity: 0.5px/frame², terminal velocity: 10px/frame
   - Wall-cling: 2 second duration, -2px/frame slide
   
   ## Difficulty Constants
   Level 1:
   - Enemy speed: 2px/frame
   - Enemy count: 3
   - Platform gaps: 90-120px
   - Scroll count: 10
   - Time limit: 90 seconds
   
   Level 2:
   - Enemy speed: 2.6px/frame (30% increase)
   [continues...]
   
   ## Visual Specifications
   Background: Linear gradient #0a0a1a to #1a1a2e
   Player sprite: 32x32px, 4-frame run cycle, 2-frame jump
   Enemy sprite: 28x28px, 2-frame idle, 3-frame walk
   
   Particles on scroll collect:
   - Count: 12
   - Color: #FFD700 (gold)
   - Velocity: radial burst, 3-6px/frame
   - Lifetime: 0.5-1.0 seconds
   - Size: 2-4px
   
   [Complete specification continues...]
   ```

#### Decision Checklist (Chat Handles):
- [ ] Is the core mechanic fun? (simulate mentally)
- [ ] Is difficulty appropriate for age 10? (reference cognitive baselines)
- [ ] Do colors work together? (contrast ratio, palette harmony)
- [ ] Is progression clear? (goals obvious, feedback immediate)
- [ ] Are there edge cases? (what if player does X?)
- [ ] Which mechanics library patterns apply? (reference docs)

---

### PHASE 2: IMPLEMENTATION (Claude Code CLI)
**Duration:** 90-120 minutes  
**Location:** Terminal / PowerShell  
**Output:** Working game at 6-7/10 quality

#### What Happens Here:

1. **Preparation**
   ```powershell
   cd C:\Users\James\Desktop\gamesincjr
   
   # Ensure specs are accessible
   ls docs/*.md
   ```

2. **Construct Claude Code Prompt**
   ```
   Template structure:
   
   "You are building a game for Games Inc Jr (age 10 audience).
   
   MANDATORY: Read these files BEFORE writing any code:
   1. docs/GAME_DESIGN_SPEC.md
   2. docs/GAME_MECHANICS_LIBRARY.md
   3. docs/GAME_TEMPLATE_STRUCTURE.md
   
   [PASTE DETAILED SPEC FROM PHASE 1 HERE]
   
   Build at: public/demos/ninja-scroll-collector/index.html
   
   Follow ALL requirements in GAME_DESIGN_SPEC.md.
   Use patterns from GAME_MECHANICS_LIBRARY.md.
   Start from template in GAME_TEMPLATE_STRUCTURE.md.
   
   Report progress at each step."
   ```

3. **Execute**
   ```powershell
   claude "[paste complete prompt]"
   ```

4. **Monitor Progress**
   Claude Code should report:
   - "Reading specification files..."
   - "Creating game scaffold from template..."
   - "Implementing physics system (gravity, jump)..."
   - "Adding enemy AI (patrol pattern)..."
   - "Implementing collision detection..."
   - "Adding particle effects..."
   - "Creating UI overlay..."
   - "Testing build... No errors."
   - "Game created at public/demos/ninja-scroll-collector/index.html"

5. **Initial Validation** (Quick Check)
   ```powershell
   # Open in browser
   start public/demos/ninja-scroll-collector/index.html
   
   # Quick sanity checks:
   # - Does it load?
   # - Do controls work?
   # - Does it crash?
   # - Is basic gameplay present?
   ```

#### What Claude Code Does Well:
- ✅ Template application (perfect structure)
- ✅ Physics implementation (exact formulas)
- ✅ Collision detection (correct algorithms)
- ✅ Input handling (keyboard + touch)
- ✅ Game loop structure (proper delta-time)
- ✅ UI scaffolding (overlays, HUD)
- ✅ Save/load system (localStorage)

#### What Claude Code Does Poorly:
- ⚠️ Particle aesthetics (technically correct but may look weak)
- ⚠️ Color choices (follows spec but may need adjustment)
- ⚠️ Animation timing (right frame count but may feel stiff)
- ⚠️ Difficulty feel (uses formulas but can't playtest)
- ⚠️ Visual polish (meets requirements but lacks "juice")

---

### PHASE 3: POLISH (Chat Interface)
**Duration:** 30-60 minutes  
**Location:** This chat conversation  
**Output:** Production-ready game at 8-9/10 quality

#### What Happens Here:

1. **User Reports Issues**
   ```
   User: "The particles when collecting scrolls are barely visible"
   
   Chat Response:
   [Reads the actual code from public/demos/ninja-scroll-collector/index.html]
   
   Analysis:
   - Current: 8 particles, size 2px, lifetime 0.5s
   - Problem: Too few, too small, dies too fast
   
   Fix:
   - Increase to 15 particles
   - Size range: 3-5px (was 2px)
   - Lifetime: 0.8-1.2s (was 0.5s)
   - Add velocity variance: vx *= 1.5
   
   [Provides exact code changes via str_replace tool]
   ```

2. **Iterative Refinement**
   ```
   Typical issues caught in this phase:
   
   ❌ "Enemy movement feels janky"
   → Chat adjusts animation frame timing
   
   ❌ "Can't tell when I'm about to die"
   → Chat adds health color-coding + warning flash
   
   ❌ "Difficulty spike at Level 2 is too harsh"
   → Chat reduces enemy speed from 2.6 to 2.3px/frame
   
   ❌ "Background is boring"
   → Chat adds third parallax layer with specific scroll speed
   
   ❌ "Screen shake on death is too subtle"
   → Chat increases intensity from 4px to 6px
   ```

3. **Quality Gate Validation**
   ```
   Chat runs through checklist:
   
   Gate 1: PLAYABILITY
   ✅ No console errors
   ✅ Controls responsive (<50ms measured)
   ✅ 60 FPS stable
   
   Gate 2: AGE-APPROPRIATENESS
   ✅ Tutorial clear (tested first 30s)
   ✅ Difficulty calibrated (simulated 70% success)
   ✅ No inappropriate content
   
   Gate 3: POLISH
   ✅ Sprites animated (4-frame run cycle confirmed)
   ✅ Particles on key events (verified all 5 event types)
   ✅ Sound effects present (8 unique sounds)
   ✅ Background has depth (3-layer parallax)
   
   Gate 4: ENGAGEMENT
   ✅ "One more try" feeling (progression clear)
   ✅ Score system compelling (combo multiplier visible)
   ✅ Varied gameplay (3 enemy types, 2 power-ups)
   ```

4. **Final Tweaks**
   ```
   Chat provides line-by-line fixes:
   
   str_replace:
   - File: public/demos/ninja-scroll-collector/index.html
   - Old: const PARTICLE_COUNT = 8;
   - New: const PARTICLE_COUNT = 15;
   
   str_replace:
   - File: public/demos/ninja-scroll-collector/index.html
   - Old: p.size = 2;
   - New: p.size = 3 + Math.random() * 2;
   
   [Continues until all issues resolved]
   ```

5. **Documentation Update**
   ```
   Chat updates games.json:
   {
     "slug": "ninja-scroll-collector",
     "status": "released",  // Changed from "coming-soon"
     "version": "1.0.0",
     "tags": ["platformer", "action", "ninja"],
     [...]
   }
   ```

#### Decision Points (Chat Handles):
- Does particle burst *feel* satisfying?
- Do colors *look* harmonious rendered?
- Does difficulty *feel* fair?
- Are animations *smooth* enough?
- Does screen shake have *impact*?
- Is feedback *immediate* and *clear*?

---

## III. Tool Capability Matrix

| Task Category | Chat Interface | Claude Code CLI | Why |
|--------------|----------------|-----------------|-----|
| **DESIGN DECISIONS** |
| Concept refinement | ✅ **PRIMARY** | ❌ No judgment | Requires creative thinking |
| Mechanic design | ✅ **PRIMARY** | ❌ No simulation | Needs mental playtesting |
| Difficulty calibration | ✅ **PRIMARY** | ⚠️ Uses formulas only | Requires experience |
| Visual theme | ✅ **PRIMARY** | ❌ No aesthetic sense | Subjective judgment |
| Color palette | ✅ **PRIMARY** | ⚠️ Can apply spec | Contrast/harmony judgment |
| **IMPLEMENTATION** |
| Template application | ⚠️ Slower | ✅ **PRIMARY** | Mechanical task |
| Physics code | ⚠️ Slower | ✅ **PRIMARY** | Formula application |
| Collision detection | ⚠️ Slower | ✅ **PRIMARY** | Algorithm implementation |
| Input handling | ⚠️ Slower | ✅ **PRIMARY** | Boilerplate code |
| Game loop | ⚠️ Slower | ✅ **PRIMARY** | Standard pattern |
| UI scaffolding | ⚠️ Slower | ✅ **PRIMARY** | Template-based |
| **POLISH & QA** |
| Particle tuning | ✅ **PRIMARY** | ❌ Can't see result | Visual judgment |
| Animation timing | ✅ **PRIMARY** | ❌ Can't feel smoothness | Subjective feel |
| Difficulty balance | ✅ **PRIMARY** | ❌ Can't playtest | Requires iteration |
| Color adjustments | ✅ **PRIMARY** | ❌ No aesthetic sense | Harmony judgment |
| Sound balance | ✅ **PRIMARY** | ❌ Can't hear | Volume judgment |
| Edge case handling | ✅ **PRIMARY** | ⚠️ Finds some | Creative problem-solving |
| Quality gate validation | ✅ **PRIMARY** | ❌ Can't assess | Holistic evaluation |

**Legend:**
- ✅ = Best tool for job
- ⚠️ = Can do but suboptimal
- ❌ = Cannot do or does poorly

---

## IV. Communication Patterns

### Starting a New Game

**User to Chat:**
```
"I want to build [game type] about [theme] with [core mechanic]"
```

**Chat Response:**
```
[20-minute back-and-forth design conversation]

Final output:
"Here's your complete specification. Save this for Phase 2.

[Detailed spec document]

Next steps:
1. Copy the spec above
2. Open PowerShell
3. Run: claude '[paste spec here with prompt wrapper]'
4. Come back here when it's done for polish phase"
```

---

### Implementation Handoff

**User to Claude Code:**
```powershell
claude "You are building a game for Games Inc Jr.

MANDATORY: Read these files first:
- docs/GAME_DESIGN_SPEC.md
- docs/GAME_MECHANICS_LIBRARY.md
- docs/GAME_TEMPLATE_STRUCTURE.md

[DETAILED SPEC FROM CHAT]

Build at: public/demos/[game-slug]/index.html"
```

**Claude Code Response:**
```
Reading specifications...
Creating game scaffold...
[Progress updates...]
Game created at public/demos/[game-slug]/index.html
Build successful. No errors.
```

---

### Polish Phase Return

**User to Chat:**
```
"Claude Code finished building [game name]. Issues I see:
1. Particles are too weak
2. Enemy movement looks janky  
3. Colors don't pop
4. Level 2 feels too hard"
```

**Chat Response:**
```
Let me examine the code...

[Reads actual file]

I see the issues. Here are the fixes:

[Provides exact str_replace commands or code snippets]

Try these changes. If particles still feel weak, increase count to 20 
and add more velocity variance.
```

---

## V. Critical Rules

### **RULE 1: Never Skip Phase 1 (Design)**
❌ **Bad:** "Claude Code, build me a platformer"  
✅ **Good:** Design in chat first, get detailed spec, THEN use Claude Code

**Why:** Claude Code without direction produces 2/10 quality games.

---

### **RULE 2: Never Use Chat for Implementation**
❌ **Bad:** "Can you write all 600 lines of code here?"  
✅ **Good:** "Here's the spec, feed this to Claude Code"

**Why:** Chat is slower for mechanical code generation. Use the right tool.

---

### **RULE 3: Always Return for Polish**
❌ **Bad:** Ship Claude Code output directly  
✅ **Good:** Polish phase in chat after implementation

**Why:** Claude Code produces 6-7/10 quality. Polish gets you to 8-9/10.

---

### **RULE 4: Iterate in the Right Place**
- **Design changes** (mechanics, theme) → Chat
- **Bug fixes** (crashes, errors) → Claude Code
- **Feel changes** (particles, colors, difficulty) → Chat

---

### **RULE 5: Document Everything in Chat**
After each game is complete:
```
"Document this game's design decisions for future reference:
- Core mechanic: [...]
- Difficulty constants: [...]
- What worked well: [...]
- What needed polish: [...]"
```

**Why:** Builds institutional knowledge, improves future games.

---

## VI. Quality Benchmarks

### Phase 2 Output (Claude Code Alone)
**Expected Quality:** 6-7/10

**Characteristics:**
- ✅ Mechanically sound
- ✅ No errors/crashes
- ✅ Controls work
- ⚠️ Visuals "okay" but not engaging
- ⚠️ Difficulty "playable" but not optimized
- ❌ Lacks "juice" and polish

**Acceptable for:** Internal testing, proof-of-concept  
**NOT acceptable for:** Public release

---

### Phase 3 Output (After Chat Polish)
**Expected Quality:** 8-9/10

**Characteristics:**
- ✅ Mechanically sound
- ✅ No errors/crashes
- ✅ Controls responsive
- ✅ Visuals engaging and polished
- ✅ Difficulty calibrated through iteration
- ✅ Has "juice" (particles, shake, feedback)

**Acceptable for:** Public release, production

---

## VII. Time Estimates

| Project Type | Phase 1 (Chat) | Phase 2 (Code) | Phase 3 (Chat) | Total |
|--------------|----------------|----------------|----------------|-------|
| Simple arcade game | 20 min | 90 min | 30 min | 2.5 hrs |
| Platformer (3 levels) | 30 min | 120 min | 45 min | 3.25 hrs |
| Complex game (systems) | 45 min | 180 min | 60 min | 4.75 hrs |
| **Fixing broken game** | 15 min | 60 min | 30 min | 1.75 hrs |

**Note:** These assume:
- User has clear game concept
- No major scope changes mid-project
- Specs are followed correctly
- Chat available for polish questions

---

## VIII. Troubleshooting

### "Claude Code didn't follow the specs"

**Likely causes:**
1. Specs not in Claude Code's context (didn't read docs)
2. Specs too vague (missing exact constants)
3. Context window overflow (prompt too long)

**Fix:**
```
Return to chat, provide diagnostic:

"Claude Code built X but the spec said Y. 
Here's what I see in the code: [paste relevant section]
What went wrong?"

Chat will either:
- Clarify spec was ambiguous → Provide better instructions
- Identify Claude Code error → Give surgical fix
- Realize design flaw → Revise spec and rebuild
```

---

### "Chat is taking too long in Phase 1"

**Likely cause:** Overthinking design, analysis paralysis

**Fix:**
```
"Give me a minimal viable spec for [game concept]. 
We can iterate in Phase 3 if needed."

Chat provides:
- Core mechanic only
- Single level
- Basic visuals
- Standard difficulty curve

Gets you to implementation faster.
```

---

### "Game is done but still feels 'off'"

**Likely cause:** Difficulty not playtested, needs empirical tuning

**Fix:**
```
User: "I've died 10 times in first minute. Too hard?"

Chat: "Yes. Reduce enemy speed by 15% and increase hitbox forgiveness.

Change:
- Enemy speed: 3px/frame → 2.6px/frame
- Player hitbox: 24px → 22px (more forgiving)

Test for 5 attempts. Report back with success rate."

[Iterate until 70% success rate achieved]
```

---

## IX. Future: API-Driven Game Generation

### Vision (Your Long-Term Goal)

**User interface on website:**
```
┌─────────────────────────────────────┐
│  Create Your Game                    │
├─────────────────────────────────────┤
│ Game Type: [Platformer ▼]           │
│ Theme: [____________]                │
│ Difficulty: ○ Easy ● Normal ○ Hard  │
│ Style: ○ Pixel Art ● Cartoon ○ 3D   │
│                                      │
│ [Generate Game →]                    │
└─────────────────────────────────────┘
```

**Backend (API request to Claude):**
```javascript
// System prompt = This workflow document + all specs
const systemPrompt = `
${GAME_DEVELOPMENT_WORKFLOW}
${GAME_DESIGN_SPEC}
${GAME_MECHANICS_LIBRARY}
${GAME_TEMPLATE_STRUCTURE}
`;

// User request
const userPrompt = `
Build a ${gameType} game about ${theme}.
Difficulty: ${difficulty}
Visual style: ${style}
Target age: 10 years old
`;

// Claude generates complete game
const gameCode = await claude.complete({
    system: systemPrompt,
    prompt: userPrompt,
    model: "claude-sonnet-4-20250514"
});

// Save and serve
fs.writeFile(`/games/${gameId}/index.html`, gameCode);
```

**Result:** User gets playable game in 30 seconds, quality 7-8/10 (good enough for UGC).

**This workflow document becomes your API system prompt.**

---

## X. Checklist for Every Game Project

### Phase 1: Design (Chat)
- [ ] Core mechanic defined and simulated mentally
- [ ] Difficulty constants calculated for age 10
- [ ] Visual specifications complete (colors, animations, particles)
- [ ] Edge cases identified
- [ ] Mechanics library patterns selected
- [ ] Complete spec document generated

### Phase 2: Implementation (Claude Code)
- [ ] Specs accessible in /docs directory
- [ ] Prompt includes "Read docs first" instruction
- [ ] Claude Code confirms reading specs
- [ ] Game built at correct path
- [ ] No build errors reported
- [ ] Quick sanity check (loads, controls work)

### Phase 3: Polish (Chat)
- [ ] Visual issues identified and fixed
- [ ] Difficulty empirically tested and tuned
- [ ] All Quality Gates passed
- [ ] games.json updated to "released" status
- [ ] Documentation updated with learnings

---

## XI. Reference for Future Sessions

### **When You Return to This Issue, I Will:**

1. **Read this workflow document first** (you're reading it now)
2. **Identify which phase you're in:**
   - Starting new game? → Phase 1 (Design)
   - Game partially built? → Check Claude Code output, move to Phase 3 (Polish)
   - Fixing broken game? → Diagnostic → Surgical fix

3. **Ask clarifying questions:**
   - "What phase are you in?"
   - "Do you have a spec already?"
   - "What did Claude Code produce?"
   - "What specific issues do you see?"

4. **Execute appropriate workflow:**
   - If Phase 1: Design conversation → Spec generation
   - If Phase 3: Code review → Surgical fixes
   - If unclear: Triage → Route to correct phase

---

## XII. Success Metrics

### You'll Know This Workflow is Working When:

✅ **Design Phase:**
- Spec document is complete in <30 minutes
- All constants have exact values (not "around X")
- User understands the game before code is written

✅ **Implementation Phase:**
- Claude Code produces working game in <2 hours
- No crashes or console errors
- Basic gameplay functional

✅ **Polish Phase:**
- Issues identified are "feel" not "broken"
- Fixes take <5 minutes each
- Quality gates pass after 3-5 iterations

✅ **Overall:**
- Total time: 2.5-4 hours per game
- Output quality: 8-9/10
- User satisfaction: "Feels professional"

---

## XIII. Emergency Procedures

### "Everything is broken, workflow isn't working"

**Step 1: Identify failure point**
```
User: "The workflow failed at [Phase X] because [reason]"

Chat diagnoses:
- Phase 1 failure? → Spec was incomplete, regenerate
- Phase 2 failure? → Claude Code didn't follow instructions, rebuild
- Phase 3 failure? → Changes aren't fixing issues, deeper redesign needed
```

**Step 2: Fallback options**
```
Plan A: Fix current approach (patch existing game)
Plan B: Restart from Phase 1 (new spec, rebuild)
Plan C: Build entirely in chat (slower but higher quality guaranteed)
```

**Step 3: Learn and document**
```
After resolution:
"What went wrong and how do we prevent it?"

Update this workflow document with:
- New troubleshooting entry
- Clarified specifications
- Additional validation steps
```

---

## XIV. Final Principles

### **1. Trust the Process**
Each phase has a purpose. Don't skip steps.

### **2. Use the Right Tool**
Chat for judgment, Claude Code for execution.

### **3. Iterate Fearlessly**
Phase 3 is EXPECTED. Polish is where magic happens.

### **4. Document Everything**
Every game teaches us something. Capture it.

### **5. Quality Over Speed**
2.5 hours with polish > 1 hour without.

---

## XV. Version History & Maintenance

### v1.0 (October 22, 2025)
- Initial workflow document
- Based on Gravity Lander analysis
- Validated against Arctic Bear Survival (good example)
- Includes all 3 phases with time estimates

### Future Updates:
- Add more troubleshooting scenarios as they emerge
- Refine time estimates based on actual projects
- Add new tool capabilities as they develop
- Document common failure patterns

**Review Cycle:** After every 3 games, evaluate workflow effectiveness.

---

**END OF WORKFLOW DOCUMENT**

═══════════════════════════════════════════════════════════════

## HOW TO USE THIS DOCUMENT

**Every time you start a conversation about game development:**

1. I will read this file first
2. I will ask: "Which phase are you in?"
3. I will execute the appropriate workflow
4. I will reference quality standards from other docs
5. I will ensure we're using the right tool for each task

**You don't need to explain the workflow each time.**  
**Just say: "Let's build/fix [game name]" and I'll take it from there.**

═══════════════════════════════════════════════════════════════