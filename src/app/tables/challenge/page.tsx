"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateDeterministicProblem } from "@/lib/tables/core/problems";

type Target = { id: string; a: number; b: number; op: "*" };

type AttemptResponse = {
  correct: boolean;
  expected: number;
  awarded: number;
  masteryLevel: number;
  streak: number;
  dueAt: string;
};

type AttemptError = { error?: string };

type Difficulty = {
  id: "rookie" | "pro" | "legend";
  label: string;
  description: string;
  duration: number;
  maxFactor: number;
  comboSpan: number;
  baseBonus: number;
};

type Mission = {
  id: string;
  description: string;
  goal: number;
  progress: number;
  completed: boolean;
  reward: number;
};

const DIFFICULTIES: Difficulty[] = [
  {
    id: "rookie",
    label: "Rookie Relay",
    description: "Friendly warm up. Facts up to 5 with a long clock.",
    duration: 90,
    maxFactor: 5,
    comboSpan: 3,
    baseBonus: 2,
  },
  {
    id: "pro",
    label: "Pro Circuit",
    description: "Faster mix of 1–9 facts. Keep that combo climbing!",
    duration: 75,
    maxFactor: 9,
    comboSpan: 4,
    baseBonus: 4,
  },
  {
    id: "legend",
    label: "Legend League",
    description: "All 12×12 facts with a tight timer. Earn massive bonuses.",
    duration: 60,
    maxFactor: 12,
    comboSpan: 5,
    baseBonus: 6,
  },
];

function isAttemptResponse(data: unknown): data is AttemptResponse {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<AttemptResponse>;
  return (
    typeof candidate.correct === "boolean" &&
    typeof candidate.expected === "number" &&
    typeof candidate.awarded === "number" &&
    typeof candidate.masteryLevel === "number" &&
    typeof candidate.streak === "number" &&
    typeof candidate.dueAt === "string"
  );
}

/**
 * Returns a shuffled copy of the provided array using the Fisher–Yates algorithm.
 */
function shuffle<T>(items: readonly T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

/**
 * Supplies a high-resolution timestamp while remaining safe in non-browser environments.
 */
function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Builds the mission checklist configured for the selected challenge difficulty.
 */
function createMissions(difficulty: Difficulty): Mission[] {
  const missions: Mission[] = [
    {
      id: "streak",
      description: `Hold a streak of ${difficulty.comboSpan + 1} correct answers in a row.`,
      goal: difficulty.comboSpan + 1,
      progress: 0,
      completed: false,
      reward: 15 + difficulty.baseBonus,
    },
    {
      id: "speed",
      description: "Solve 5 facts in under 5 seconds each.",
      goal: 5,
      progress: 0,
      completed: false,
      reward: 20 + difficulty.baseBonus,
    },
    {
      id: "volume",
      description: "Answer 15 facts before the buzzer.",
      goal: 15,
      progress: 0,
      completed: false,
      reward: 25 + difficulty.baseBonus,
    },
  ];
  return missions;
}

/**
 * Selects a badge descriptor based on the total number of coins earned.
 */
function badgeForCoins(coins: number): { label: string; message: string } | null {
  if (coins >= 200) {
    return { label: "Galaxy Grandmaster", message: "Legendary work! You cleared the highest reward tier." };
  }
  if (coins >= 120) {
    return { label: "Meteor Medal", message: "Blazing speed and accuracy! You're on a roll." };
  }
  if (coins >= 60) {
    return { label: "Shooting Star", message: "Solid streaks add up. Keep aiming higher." };
  }
  if (coins >= 30) {
    return { label: "Comet Trail", message: "Great start! Try the next difficulty for bigger rewards." };
  }
  return null;
}

type Phase = "lobby" | "loading" | "active" | "complete";

/**
 * ChallengePage presents the fast-paced circuits with timers, streak multipliers, and missions.
 */
export default function ChallengePage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [difficultyId, setDifficultyId] = useState<Difficulty["id"]>("rookie");
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [pool, setPool] = useState<Target[]>([]);
  const [queue, setQueue] = useState<Target[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [input, setInput] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [correctAttempts, setCorrectAttempts] = useState<number>(0);
  const [missions, setMissions] = useState<Mission[]>(() => createMissions(DIFFICULTIES[0]));
  const [feedback, setFeedback] = useState<string>("");
  const [comboClock, setComboClock] = useState<number>(0);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tables/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "CHALLENGE" }),
        });
        if (!res.ok) {
          throw new Error("Unable to load challenge session");
        }
        const data = (await res.json()) as { sessionId: string; userId: string; targets: Target[] };
        setSessionId(data.sessionId);
        setUserId(data.userId);
        setPool(data.targets ?? []);
        setPhase("lobby");
      } catch (error) {
        console.error(error);
        setFeedback("We could not start the challenge. Please refresh and try again.");
        setPhase("lobby");
      }
    })();
  }, []);

  useEffect(() => {
    if (phase !== "active") return undefined;
    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setPhase("complete");
          return 0;
        }
        return prev - 1;
      });
      setComboClock((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  const difficulty = useMemo(
    () => DIFFICULTIES.find((item) => item.id === difficultyId) ?? DIFFICULTIES[0],
    [difficultyId],
  );

  const currentTarget = queue[currentIndex] ?? null;
  const accuracy = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const comboMultiplier = streak >= difficulty.comboSpan ? 1 + Math.floor(streak / difficulty.comboSpan) * 0.25 : 1;

  const ensureQueue = useCallback(
    async (incoming: Target[] = pool) => {
      const filtered = incoming.filter((target) => Math.max(target.a, target.b) <= difficulty.maxFactor);
      const source = filtered.length > 0 ? filtered : incoming;
      const freshQueue = shuffle(source);
      setQueue(freshQueue);
      setCurrentIndex(0);
      setQuestionStartedAt(now());
      return freshQueue;
    },
    [difficulty.maxFactor, pool],
  );

  const fetchAdditionalTargets = useCallback(async () => {
    if (!userId) return [];
    try {
      const res = await fetch(`/api/tables/scheduler/next?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as { targets?: Target[] };
      const nextTargets = Array.isArray(data.targets) ? data.targets : [];
      setPool((prev) => [...prev, ...nextTargets]);
      return nextTargets;
    } catch {
      return [];
    }
  }, [userId]);

  const startChallenge = useCallback(async () => {
    setPhase("loading");
    setFeedback("");
    setCoins(0);
    setStreak(0);
    setBestStreak(0);
    setTotalAttempts(0);
    setCorrectAttempts(0);
    setInput("");
    setMissions(createMissions(difficulty));
    setComboClock(0);
    setRemaining(difficulty.duration);
    setQuestionStartedAt(null);

    const queueSource = pool.length > 0 ? pool : await fetchAdditionalTargets();
    if (!queueSource || queueSource.length === 0) {
      setFeedback("We need more facts to start. Please try again in a moment.");
      setPhase("lobby");
      return;
    }
    setPool(queueSource);
    await ensureQueue(queueSource);
    setPhase("active");
  }, [difficulty, ensureQueue, pool, fetchAdditionalTargets]);

  const updateMissions = useCallback(
    (isCorrect: boolean, elapsed: number, nextStreak: number) => {
      let bonusAwarded = 0;
      setMissions((prev) =>
        prev.map((mission) => {
          if (mission.completed) return mission;
          if (mission.id === "streak") {
            const progress = isCorrect ? Math.max(mission.progress, nextStreak) : mission.progress;
            const completed = progress >= mission.goal;
            if (completed) bonusAwarded += mission.reward;
            return {
              ...mission,
              progress,
              completed,
            };
          }
          if (mission.id === "speed") {
            const progress = elapsed <= 5 ? mission.progress + 1 : mission.progress;
            const completed = progress >= mission.goal;
            if (completed) bonusAwarded += mission.reward;
            return {
              ...mission,
              progress,
              completed,
            };
          }
          if (mission.id === "volume") {
            const progress = mission.progress + 1;
            const completed = progress >= mission.goal;
            if (completed) bonusAwarded += mission.reward;
            return {
              ...mission,
              progress,
              completed,
            };
          }
          return mission;
        }),
      );
      if (bonusAwarded > 0) {
        setCoins((prev) => prev + bonusAwarded);
        setFeedback((prev) => `${prev ? `${prev} ` : ""}Mission complete! +${bonusAwarded} coins.`);
      }
    },
    [],
  );

  const advanceQueue = useCallback(async () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < queue.length) {
        setQuestionStartedAt(now());
        return nextIndex;
      }
      startTransition(async () => {
        const extra = await fetchAdditionalTargets();
        const merged = extra.length > 0 ? [...queue.slice(nextIndex), ...extra] : [...queue.slice(nextIndex)];
        const source = merged.length > 0 ? merged : queue;
        await ensureQueue(source);
      });
      return 0;
    });
  }, [queue, fetchAdditionalTargets, ensureQueue]);

  const submit = useCallback(async () => {
    if (phase !== "active" || !currentTarget || remaining === 0 || !sessionId) return;
    const trimmed = input.trim();
    if (!trimmed) {
      setFeedback("Enter an answer to keep your streak alive.");
      return;
    }
    const answer = Number(trimmed);
    if (Number.isNaN(answer)) {
      setFeedback("Answers must be numbers. Try again!");
      return;
    }

    setFeedback("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/tables/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId,
            factId: currentTarget.id,
            a: currentTarget.a,
            b: currentTarget.b,
            answer,
            latencyMs: 0,
            hintUsed: false,
          }),
        });

        const payload = (await res.json()) as unknown;

        if (!res.ok || !isAttemptResponse(payload)) {
          const attemptError = (payload as AttemptError)?.error ?? "We could not score that answer. Try again.";
          setFeedback(attemptError);
          return;
        }

        const isCorrect = payload.correct;
        const currentStreak = streak;
        const nextStreak = isCorrect ? currentStreak + 1 : 0;
        const effectiveMultiplier = isCorrect
          ? nextStreak >= difficulty.comboSpan
            ? 1 + Math.floor(nextStreak / difficulty.comboSpan) * 0.25
            : 1
          : 1;
        const awardedBase = payload.awarded ?? 0;
        const comboBonus = isCorrect ? Math.round((awardedBase + difficulty.baseBonus) * (effectiveMultiplier - 1)) : 0;
        const totalAward = awardedBase + comboBonus + (isCorrect ? difficulty.baseBonus : 0);
        const elapsedSeconds = questionStartedAt ? (now() - questionStartedAt) / 1000 : 0;

        setCoins((prev) => prev + totalAward);
        setTotalAttempts((prev) => prev + 1);
        if (isCorrect) {
          setCorrectAttempts((prev) => prev + 1);
          setStreak((prev) => {
            const next = prev + 1;
            setBestStreak((best) => Math.max(best, next));
            return next;
          });
          setComboClock(8);
          setFeedback(`Correct! +${totalAward} coins${comboBonus > 0 ? " (combo bonus!)" : ""}`);
        } else {
          setFeedback(`Nearly! ${currentTarget.a} × ${currentTarget.b} = ${payload.expected}. Streak resets.`);
          setStreak(0);
          setComboClock(0);
        }

        updateMissions(isCorrect, elapsedSeconds, nextStreak);

        setInput("");
        await advanceQueue();
      } catch (error) {
        console.error(error);
        setFeedback("Network hiccup. We did not score that answer.");
      }
    });
  }, [
    phase,
    currentTarget,
    remaining,
    sessionId,
    input,
    userId,
    difficulty,
    updateMissions,
    advanceQueue,
    streak,
    questionStartedAt,
  ]);

  useEffect(() => {
    if (phase !== "complete" || !sessionId) return;
    (async () => {
      try {
        await fetch("/api/tables/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, end: true }),
        });
      } catch (error) {
        console.warn("Unable to end challenge session", error);
      }
    })();
  }, [phase, sessionId]);

  useEffect(() => {
    if (phase === "active" && currentTarget) {
      setQuestionStartedAt(now());
    }
  }, [phase, currentTarget]);

  const currentProblem = useMemo(() => {
    if (!currentTarget) return null;
    return generateDeterministicProblem(currentTarget.a, currentTarget.b);
  }, [currentTarget]);

  const rewardBadge = badgeForCoins(coins);
  const comboSeconds = Math.max(comboClock, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Challenge mode</p>
        <h1 className="text-3xl font-semibold">Race the clock, rack up combos, claim badges</h1>
        <p className="text-sm text-muted-foreground">
          Choose your circuit, build streak multipliers, and clear mini-missions for bonus coins. Points sync to your profile, no
          downloads required.
        </p>
      </header>

      {phase === "lobby" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Select your difficulty</h2>
            <div className="mt-4 space-y-3">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficultyId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    difficultyId === item.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background hover:border-primary/60 hover:bg-accent"
                  }`}
                  disabled={isPending}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.label}</span>
                    <Badge variant="secondary">{item.duration}s</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={startChallenge}
              className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground shadow hover:-translate-y-0.5 transition disabled:opacity-50"
              disabled={isPending}
            >
              Start challenge
            </button>
            {feedback && <p className="mt-3 text-sm text-destructive">{feedback}</p>}
          </div>

          <aside className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm leading-relaxed text-primary">
            <h3 className="text-base font-semibold">How to earn a badge</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Keep a streak going to unlock combo multipliers. Every {difficulty.comboSpan} correct = +25% coins.</li>
              <li>Clear the three missions during the run for bonus rewards.</li>
              <li>Higher circuits shorten the timer but increase the base bonus.</li>
              <li>Finish strong to claim Shooting Star (60+ coins) up to Galaxy Grandmaster (200+ coins).</li>
            </ul>
          </aside>
        </div>
      )}

      {phase === "loading" && (
        <div className="mt-12 rounded-3xl border border-dashed border-muted-foreground/40 p-10 text-center text-sm text-muted-foreground">
          Warming up the arena…
        </div>
      )}

      {phase === "active" && currentTarget && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Time left: <span className="font-semibold text-foreground">{remaining}s</span></span>
              <span>Accuracy: <span className="font-semibold text-foreground">{accuracy}%</span></span>
              <span>Coins: <span className="font-semibold text-primary">{coins}</span></span>
              <span>Best streak: <span className="font-semibold text-foreground">{bestStreak}</span></span>
            </div>
            <div className="mt-6 text-4xl font-bold">
              {currentTarget.a} × {currentTarget.b} = ?
            </div>
            {currentProblem && (
              <p className="mt-3 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
                {currentProblem.problem}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
                inputMode="numeric"
                aria-label="Answer"
                disabled={isPending}
                className="w-32 rounded-2xl border border-border bg-background px-4 py-3 text-lg"
              />
              <button
                type="button"
                onClick={submit}
                className="rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow transition hover:-translate-y-0.5 disabled:opacity-50"
                disabled={isPending}
              >
                Submit
              </button>
              {comboSeconds > 0 && streak > 1 && (
                <Badge variant="outline">Combo active! {comboSeconds}s left</Badge>
              )}
            </div>
            {feedback && (
              <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
                {feedback}
              </p>
            )}
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Missions</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {missions.map((mission) => {
                  const percent = Math.min(100, Math.round((mission.progress / mission.goal) * 100));
                  return (
                    <li key={mission.id} className="rounded-2xl border border-muted/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{mission.description}</span>
                        <Badge variant={mission.completed ? "default" : "secondary"}>{mission.completed ? "+" + mission.reward : `${percent}%`}</Badge>
                      </div>
                      {!mission.completed && (
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                      {mission.completed && <p className="mt-2 text-xs text-muted-foreground">Bonus locked in!</p>}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-3xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
              <h2 className="text-base font-semibold text-foreground">Combo meter</h2>
              <p className="mt-2">
                {streak > 0
                  ? `Streak ${streak}. Multiplier ×${comboMultiplier.toFixed(2)}.`
                  : "Answer correctly to start building your combo multiplier."}
              </p>
              <p className="mt-2">
                Tip: combos grow every {difficulty.comboSpan} correct answers. Try to answer before the combo timer runs out!
              </p>
            </div>
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Run summary</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Coins earned</dt>
                <dd className="text-2xl font-semibold text-primary">{coins}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Accuracy</dt>
                <dd className="text-2xl font-semibold">{accuracy}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Best streak</dt>
                <dd className="text-2xl font-semibold">{bestStreak}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Facts attempted</dt>
                <dd className="text-2xl font-semibold">{totalAttempts}</dd>
              </div>
            </dl>
            {rewardBadge ? (
              <div className="mt-6 rounded-2xl border border-primary bg-primary/10 p-4 text-primary">
                <h3 className="text-base font-semibold">{rewardBadge.label}</h3>
                <p className="mt-1 text-sm">{rewardBadge.message}</p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Keep chasing higher streaks to unlock Shooting Star and beyond.
              </p>
            )}
            <button
              type="button"
              onClick={startChallenge}
              className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground shadow transition hover:-translate-y-0.5"
            >
              Run it again
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Mission results</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {missions.map((mission) => (
                <li key={mission.id} className="rounded-2xl border border-muted/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{mission.description}</span>
                    <Badge variant={mission.completed ? "default" : "secondary"}>
                      {mission.completed ? `+${mission.reward} coins` : `${mission.progress}/${mission.goal}`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mission.completed
                      ? "Mission complete! Bonus coins have been added to your tally."
                      : "Progress carries into your next run—beat your best!"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

 


