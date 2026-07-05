# PROMPT-RECIPES — Specifying Games to an AI (and Why It's the Real Lesson)

**Purpose:** Worked recipes for turning an idea into instructions an AI can build from,
then iterating to something genuinely good. Used two ways: (1) by AI build sessions as the
model of what a good brief looks like; (2) as the seed of the Games Inc Jr curriculum —
these recipes, lightly adapted, are what we teach children.

**When to load:** when starting a new game from a loose idea, when helping a student
specify one, or when writing/reviewing the make-your-game generator flow.

---

## The point of all this

Building a game with an AI is not about games. It is practice in the general skill of
**instructing an LLM** — which is rapidly becoming how most software, documents, and
analysis get made. The loop is always the same:

1. **Cover your ideas.** Say everything that matters. The AI builds what you said, not
   what you meant. Unstated assumptions become someone else's guesses.
2. **Test against reality.** Play the build. Reality is the referee — not your intention,
   not the AI's confidence. If the jump feels wrong, it *is* wrong.
3. **Iterate.** Describe the gap between what you got and what you wanted, precisely.
   "Make it better" teaches nothing; "the boss appears too late and dies too fast —
   bring him in at 60 seconds and give him three phases" is engineering.
4. **Persevere.** The first build is never the good one. The difference between a toy
   and a product is how many honest iterations you survive.
5. **Learn on the job.** Architecture, language syntax, physics, data structures — you
   absorb them by needing them: "why does my game speed up on Dad's laptop?" is how a
   child meets frame-rate independence and `dt`. Vocabulary follows necessity.

Every recipe below exercises all five. That is deliberate.

---

## Recipe 1 — The first brief (idea → specification)

A good brief covers six headings. One or two sentences each is enough; missing headings
are where builds go wrong.

```
GAME: Otter Post — a delivery game
SKELETON: Catcher (see VARIETY-MATRIX)
TWIST: Fragile scoring — parcels are carried, and banked at the post office
THEME: River village
VERBS: swim up/down to catch parcels; press space to dive under logs
DECISIONS: carrying more parcels = bigger bonus but slower swimming — when do I bank?
PHASES: every 45s the river speeds up AND something new arrives
  (min 1: herons that snatch carried parcels — telegraphed shadow first)
WIN/LOSE: 3 soaked parcels = game over; distance + banked parcels = score
UNLOCKS: 1,000 pts → night river palette; 3 perfect deliveries → straw hat; 5,000 → Storm mode
```

Then the standards clause — always include it:

```
Build to Games Inc Jr standards: DEPTH-STANDARD (two interacting verbs, decision every
10s, phase every 45-60s, meta-progression), JUICE-CHECKLIST (feedback + GameAudio on
every event), DIFFICULTY-AND-ONBOARDING (easy first 30s, telegraphs, no cliffs).
```

## Recipe 2 — The playtest report (reality → iteration)

After playing, report in this shape. Specific observations, one change request each.

```
PLAYED: 4 runs, ~6 minutes.
WORKS: catching feels good; banking decision is real — I kept greeding and drowning.
GAP 1: the heron takes parcels with no warning → give it a circling shadow 1s before it dives.
GAP 2: minute 3 is identical to minute 1 → add the log-jam phase at 90s (river narrows).
GAP 3: nothing tells me the next unlock → add "Next: Night River at 1,000" to the game-over screen.
KEEP EVERYTHING ELSE THE SAME.
```

That last line matters: uncontrolled changes are how working things break. (This is the
child-sized version of a regression-safe change request.)

## Recipe 3 — Asking for depth (the anti-boring prompt)

When a build is functional but dull, do not say "make it more fun." Order from the menu:

- "Add a second verb that interacts with the first: [pick from the genre's playbook]."
- "Give me a rule twist from VARIETY-MATRIX axis 2 that fits this theme."
- "Add a mini-boss at 90 seconds with a telegraphed attack and 3 hit points."
- "Add one enemy with the Coward behaviour and make it worth triple points."
- "Give the player a reason to go NEAR the danger" (risk/reward placement).

## Recipe 4 — The diagnosis prompt (when something feels wrong)

Teach the pattern: describe the symptom, ask for hypotheses BEFORE fixes.

```
SYMPTOM: the game feels unfair — I die and don't know why.
Don't change anything yet. List the 3 most likely causes in this code, tell me how to
confirm each one, and wait.
```

This is systematic debugging in miniature: hypothesis → test → fix, never fix-by-guessing.
It transfers directly to every kind of software work.

## Recipe 5 — The architecture question (learning on the job)

Encourage "why" prompts alongside "do" prompts:

- "Why is all movement multiplied by dt? What breaks if it isn't?"
- "Why do we keep enemies in an array instead of separate variables?"
- "What is localStorage and why does my high score survive a refresh?"
- "Show me the same logic in Python so I can see what's language and what's idea."

One why-question per session, answered against the child's own game, beats a term of
abstract lessons. Their game is the textbook.

---

## Anti-patterns (for teachers and AI sessions alike)

| Anti-pattern | Why it fails | Instead |
|---|---|---|
| "Make it better/cooler/more fun" | No testable meaning | Name the gap and the target |
| Accepting the first build | Skips the entire skill | Minimum 3 iterations before "done" |
| Changing 5 things at once | Can't tell what worked | One change per iteration when tuning |
| Vibes-only review | Intent isn't evidence | Play it; count decisions; run the fun test |
| Blaming the AI | The brief was incomplete | Re-read the brief; find the unstated assumption |
| Quitting at "it's broken" | Perseverance IS the curriculum | Diagnose (Recipe 4), then fix |
