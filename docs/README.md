# Game Development Standards - Master Index
## Games Inc Jr Documentation Suite

**Version:** 1.1  
**Last Updated:** October 22, 2025  
**Status:** Production Ready

---

## ⚠️ START HERE: Workflow Document

**NEW:** Before doing anything else, read **[WORKFLOW.md](./WORKFLOW.md)**

This document defines the optimal division of labor between:
- **This chat interface** (design, critique, polish)
- **Claude Code CLI** (implementation, execution)

**Every game development session should follow the 3-phase workflow:**
1. **Phase 1 (Chat):** Design & specification (20-30 min)
2. **Phase 2 (Claude Code):** Implementation (90-120 min)
3. **Phase 3 (Chat):** Polish & quality gates (30-60 min)

**Total time:** 2.5-3.5 hours per game  
**Output quality:** 8-9/10

---

## Overview

This documentation suite provides **comprehensive game design standards** for Games Inc Jr, a kids' gaming platform targeting 10-year-old players. All games must comply with these standards before release.

**Purpose:** Eliminate design failures by codifying best practices into enforceable specifications.

---

## Quick Start

### For New Game Development

**Follow WORKFLOW.md exactly:**

1. **Phase 1 - Design (This Chat)** (20-30 min):
   - Discuss game concept
   - Get detailed specification document
   - Review [`GAME_DESIGN_SPEC.md`](#1-game-design-specification) for standards
   - Chat provides complete spec with exact constants

2. **Phase 2 - Implementation (Claude Code)** (90-120 min):
   - Copy spec from Phase 1
   - Use [`CLAUDE_CODE_GAME_PROMPT.md`](#6-claude-code-prompt-template) template
   - Run: `claude "[paste spec with prompt wrapper]"`
   - Reference [`GAME_MECHANICS_LIBRARY.md`](#2-game-mechanics-library) (Claude Code reads this)

3. **Phase 3 - Polish (This Chat)** (30-60 min):
   - Report issues to chat
   - Chat reads your game code
   - Apply surgical fixes
   - Verify all Quality Gates pass

### For Fixing Broken Games

1. **Diagnose** in this chat using [`GRAVITY_LANDER_FIX.md`](#4-surgical-fix-example) as template
2. **Apply fixes** - chat provides exact code changes
3. **Retest** against acceptance criteria

---

## Document Suite

### 0. **WORKFLOW.md** ⭐ START HERE
**File:** `WORKFLOW.md`  
**Length:** ~7,000 words  
**Purpose:** **MANDATORY reading - defines optimal development process**

**Contents:**
- 3-phase workflow (Design → Implementation → Polish)
- Tool capability matrix (Chat vs Claude Code)
- Communication patterns
- Time estimates per project type
- Troubleshooting guide
- Quality benchmarks
- Critical rules (never skip phases)

**Key Sections:**
- **Section II**: Phase breakdown with exact procedures
- **Section III**: Tool capability matrix (what each tool does best)
- **Section V**: Critical rules (workflow enforcement)
- **Section X**: Checklist for every game project

**When to use:** Read at start of EVERY game development session. I will read this file first every time you return to game development.

---

### 1. Game Design Specification
**File:** `GAME_DESIGN_SPEC.md`  
**Length:** ~4,000 words  
**Purpose:** Authoritative design standards for age 10 audience

**Contents:**
- Cognitive & motor baselines (reaction time, working memory)
- Mandatory design requirements (difficulty, visuals, audio, controls)
- Gameplay architecture (core loops, progression, fail states)
- Technical requirements (performance, accessibility)
- Content guidelines (age-appropriate themes)
- Playtesting protocol
- Common failure modes to avoid

**Key Sections:**
- **Section II.A**: Difficulty calibration formulas
- **Section II.B**: Visual design mandates (animations, particles, depth)
- **Section III.A**: Core loop architecture
- **Section VI**: Pre-launch checklist
- **Section VII**: Failure mode reference table

**When to use:** Every game development project, from initial design through QA.

---

### 2. Game Mechanics Library
**File:** `GAME_MECHANICS_LIBRARY.md`  
**Length:** ~3,500 words  
**Purpose:** Reusable code patterns for common game systems

**Contents:**
- Physics systems (gravity, movement, collision)
- Enemy AI patterns (patrol, chase, state machines)
- Scoring & feedback (popups, combos, particles)
- Power-up systems
- Screen effects (shake, slow-mo)
- Progression & difficulty curves
- Input handling (keyboard + touch unified)
- Save system (localStorage)

**Key Patterns:**
- **Section I.A**: Gravity implementation (with age-appropriate constants)
- **Section II.C**: State machine AI (clean, maintainable)
- **Section III.A**: Score popup system (visual juice)
- **Section V.A**: Screen shake (impact feedback)
- **Section VI.A**: Adaptive difficulty (keeps players in flow state)

**When to use:** During implementation phase, copy-paste proven patterns instead of reinventing.

---

### 3. Game Template Structure
**File:** `GAME_TEMPLATE_STRUCTURE.md`  
**Length:** ~2,500 words  
**Purpose:** Canonical HTML5 game scaffold

**Contents:**
- Complete working HTML template
- CSS styling standards (responsive, mobile-optimized)
- JavaScript game loop structure
- Input handling boilerplate
- UI overlay system
- Performance optimization techniques
- Common template variants (endless runner, timer-based, wave-based)

**Key Features:**
- Single-file architecture (self-contained)
- Keyboard + touch support built-in
- Responsive canvas scaling
- Modal overlay system (try/start/game-over)
- Message toast system

**When to use:** Starting point for EVERY new game. Don't start from scratch.

---

### 4. Surgical Fix Example
**File:** `GRAVITY_LANDER_FIX.md`  
**Length:** ~2,800 words  
**Purpose:** Detailed diagnostic and repair blueprint

**Contents:**
- Executive summary (what's broken, why, severity)
- Critical failures analysis (difficulty, visuals, controls)
- Line-by-line repair instructions
- Before/after code comparisons
- Testing protocol
- Effort estimation
- Acceptance criteria checklist

**Case Study: Gravity Lander**
- Too difficult (landing tolerance pixel-perfect)
- Visually impoverished (rectangle sprites, no feedback)
- Ambiguous controls (thrust strength unclear)
- Fix: 2.5 hours of surgical edits OR 3-4 hour rebuild

**When to use:** Template for auditing and fixing existing games that fail quality gates.

---

### 5. Claude Code Prompt Template
**File:** `CLAUDE_CODE_GAME_PROMPT.md`  
**Length:** ~2,000 words  
**Purpose:** Standardized instruction template for Claude Code CLI

**Contents:**
- Complete prompt template with fill-in-the-blank sections
- Mandatory requirements checklist
- Development process (5-step workflow)
- Common pitfalls to avoid
- Quality gates verification
- Example usage for different game types

**How to use:**
1. Get detailed spec from Phase 1 (this chat)
2. Insert spec into prompt template
3. Run: `claude "paste_complete_prompt_here"`
4. Claude Code builds game following ALL standards

**Benefits:**
- Ensures Claude Code reads specs before coding
- Prevents common mistakes (pixel-perfect hitboxes, flat colors)
- Enforces quality gates
- Produces consistent, high-quality output

**When to use:** Phase 2 of workflow (implementation).

---

## Updated Workflow Diagrams

### Standard Development Flow (3-Phase)

```
PHASE 1: DESIGN (This Chat - 20-30 min)
    ↓
  Concept discussion
    ↓
  Detailed specification generated
    ↓
[Spec includes: mechanics, constants, colors, animations]
    ↓
    
PHASE 2: IMPLEMENTATION (Claude Code - 90-120 min)
    ↓
  Copy spec from Phase 1
    ↓
  Add prompt wrapper from CLAUDE_CODE_GAME_PROMPT.md
    ↓
  Run: claude "[complete prompt]"
    ↓
  Working game at 6-7/10 quality
    ↓
    
PHASE 3: POLISH (This Chat - 30-60 min)
    ↓
  User reports issues
    ↓
  Chat reads actual code
    ↓
  Surgical fixes applied
    ↓
  Quality gates validation
    ↓
[PASS] → Production ready (8-9/10 quality)
[FAIL] → More iterations
```

### Fix Existing Game Flow

```
Broken Game Identified
    ↓
Report to Chat: "Game X has issues: Y, Z"
    ↓
Chat reads game code
    ↓
Diagnostic (following GRAVITY_LANDER_FIX.md pattern)
    ↓
Fix Brief created
    ↓
Surgical fixes applied (Chat provides exact changes)
    ↓
Validate against Quality Gates
    ↓
[PASS] → Mark "released"
[FAIL] → Consider rebuild from template
```

---

## Quality Gates Summary

All games must pass these gates before release:

### Gate 1: PLAYABILITY
- ✅ No crashes or console errors
- ✅ All controls work (keyboard + touch)
- ✅ Stable 60 FPS

### Gate 2: AGE-APPROPRIATENESS
- ✅ 10-year-old can understand immediately
- ✅ 70% success rate in first 2 minutes
- ✅ No inappropriate content

### Gate 3: POLISH
- ✅ Animated sprites (not rectangles)
- ✅ Particle effects on key events
- ✅ Sound effects on all interactions
- ✅ Background has depth (gradients, parallax)

### Gate 4: ENGAGEMENT
- ✅ "One more try" feeling after death
- ✅ Clear progression visible
- ✅ Not repetitive after 5 minutes

**If ANY gate fails, game returns to development.**

---

## Key Design Principles (TL;DR)

### Difficulty
- First 30s: 90% success rate (tutorial)
- First 2 min: 70% success rate (learning)
- Hitboxes: 20-30% smaller than visual sprites
- Reaction windows: Minimum 500ms

### Visuals
- Animate everything (minimum 3 frames)
- Particles on: collect, damage, death
- Backgrounds: depth via parallax/gradients
- Color code: green=good, yellow=caution, red=danger

### Controls
- Support keyboard (WASD + Arrows) AND touch
- Input lag < 50ms
- Show controls on-screen for 10 seconds
- Maximum 2 simultaneous inputs

### Feedback
- Small wins every 15-20 seconds
- Score in meaningful increments (+10, +25, +50)
- Sound effects on every action
- Screen shake on impacts

### Progression
- Difficulty +5% per minute, caps at 2.5× base
- Dynamic adjustment: -10% after 3 deaths in 60s
- High score saved (localStorage)
- Instant restart (R key, no menus)

---

## Common Failure Modes (Reference Table)

| Symptom | Diagnosis | Fix Location |
|---------|-----------|--------------|
| Too difficult | Pixel-perfect hitboxes, tight timing | GAME_DESIGN_SPEC.md §II.A |
| Boring visuals | Static sprites, flat colors | GAME_DESIGN_SPEC.md §II.B |
| Confusing controls | No on-screen hints, ambiguous mechanics | GAME_DESIGN_SPEC.md §II.D |
| No feedback | Missing particles/sound | GAME_MECHANICS_LIBRARY.md §III |
| Frustrating difficulty | Instant spikes, no progression | GAME_DESIGN_SPEC.md §III.B |
| "Feels cheap" | No screen shake, no juice | GAME_MECHANICS_LIBRARY.md §V |
| Players quit after death | No instant restart | GAME_DESIGN_SPEC.md §III.C |

---

## Tool Capability Quick Reference

| Task | Use This Tool | Why |
|------|---------------|-----|
| Game concept design | **Chat** | Requires creative judgment |
| Difficulty calibration | **Chat** | Needs mental simulation |
| Visual theme selection | **Chat** | Subjective aesthetics |
| Color palette | **Chat** | Harmony judgment |
| Implementation | **Claude Code** | Fast mechanical execution |
| Physics code | **Claude Code** | Formula application |
| Template scaffolding | **Claude Code** | Boilerplate generation |
| Particle tuning | **Chat** | Visual feel judgment |
| Animation smoothness | **Chat** | Subjective quality |
| Difficulty balance | **Chat** | Empirical iteration |
| Edge case handling | **Chat** | Creative problem-solving |

**Rule of thumb:** If it requires "does this feel good?" → Chat. If it's "implement this formula" → Claude Code.

---

## Version History

### v1.1 (October 22, 2025)
- Added WORKFLOW.md (3-phase process)
- Updated Quick Start to reference workflow
- Added tool capability matrix
- Clarified chat vs Claude Code division of labor

### v1.0 (October 22, 2025)
- Initial release
- Complete documentation suite
- Validated against Arctic Bear Survival (good) and Gravity Lander (bad)
- Ready for production use

---

## Maintenance & Updates

**Owner:** Senior Design Standards  
**Review Cycle:** Quarterly  
**Update Trigger:** 3+ games fail same quality gate

**When to update:**
- New failure modes discovered
- Age-appropriate standards change
- Technical capabilities expand (new libraries, frameworks)
- User feedback reveals systemic issues
- Workflow proves inefficient (adjust phases)

**Process:**
1. Document failure mode in detail
2. Create fix pattern in GAME_MECHANICS_LIBRARY.md
3. Update Pre-Launch Checklist in GAME_DESIGN_SPEC.md
4. Add to CLAUDE_CODE_GAME_PROMPT.md pitfalls section
5. Update WORKFLOW.md if process changed
6. Increment version number

---

## Support & Questions

**For game development questions:**
- Start with WORKFLOW.md to determine which phase you're in
- Reference the specific section in this index
- Check GAME_MECHANICS_LIBRARY.md for code patterns
- Review GRAVITY_LANDER_FIX.md for diagnostic methodology

**For spec clarifications:**
- GAME_DESIGN_SPEC.md is authoritative
- In case of conflict, design spec overrides other docs
- When in doubt, optimize for 10-year-old playability

**For workflow questions:**
- WORKFLOW.md defines the process
- Never skip Phase 1 (design) or Phase 3 (polish)
- Use the right tool for each task

**For Claude Code issues:**
- Verify prompt includes "Read docs first" instruction
- Check that all spec files are present in /docs
- Ensure Claude Code has read access to project files
- Remember: Claude Code produces 6-7/10 quality, chat polishes to 8-9/10

---

## How I Use This System

**Every time you return to game development, I will:**

1. **Read WORKFLOW.md first** (you're reading the master index now)
2. **Ask: "Which phase are you in?"**
   - Starting new game? → Phase 1 (Design in chat)
   - Game partially built? → Phase 3 (Polish in chat)
   - Fixing broken game? → Diagnostic in chat
3. **Execute appropriate workflow**
4. **Reference quality standards from other docs**
5. **Ensure we're using the right tool for each task**

**You don't need to explain the workflow each time.**  
Just say: **"Let's build/fix [game name]"** and I'll take it from there.

---

## Appendix: File Locations

All documentation lives in:
```
/docs/
├── README.md                          [This file - Master index]
├── WORKFLOW.md                        [⭐ 3-phase development process]
├── GAME_DESIGN_SPEC.md                [Core design standards]
├── GAME_MECHANICS_LIBRARY.md          [Reusable code patterns]
├── GAME_TEMPLATE_STRUCTURE.md         [HTML5 scaffold]
├── GRAVITY_LANDER_FIX.md              [Diagnostic example]
└── CLAUDE_CODE_GAME_PROMPT.md         [Prompt template]
```

**Access from project root:**
```bash
# Read the workflow (do this first)
cat docs/WORKFLOW.md

# Read the specs
cat docs/GAME_DESIGN_SPEC.md
cat docs/GAME_MECHANICS_LIBRARY.md
cat docs/GAME_TEMPLATE_STRUCTURE.md

# Use with Claude Code (Phase 2)
claude "Read docs/GAME_DESIGN_SPEC.md and docs/GAME_TEMPLATE_STRUCTURE.md, then build [game description]"
```

---

**END OF MASTER INDEX**

This documentation suite is your authoritative reference for game development at Games Inc Jr. The **WORKFLOW.md** is mandatory for all projects.