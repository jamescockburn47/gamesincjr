"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ChallengeQuestion } from "@/lib/tables/ai/challenge";

type AttemptResponse = {
  correct: boolean;
  expected: number;
  awarded: number;
};

type ChallengeSession = {
  sessionId: string;
  questions: ChallengeQuestion[];
};

export default function ChallengePage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [queue, setQueue] = useState<ChallengeQuestion[]>([]);
  const [reserved, setReserved] = useState<ChallengeQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<ChallengeQuestion[]>([]);
  const [input, setInput] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(60);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wrongFacts, setWrongFacts] = useState<Record<string, number>>({});
  const [solvedFacts, setSolvedFacts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const current = queue.length > 0 ? queue[0] : null;
  const trickyCount = reserved.length;
  const totalFacts = allQuestions.length;
  const solvedCount = useMemo(() => Object.keys(solvedFacts).length, [solvedFacts]);
  const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const allCleared = !isLoading && remaining > 0 && !current && trickyCount === 0;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/tables/challenge/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          throw new Error("Could not load challenge questions");
        }
        const data = (await res.json()) as ChallengeSession;
        if (cancelled) return;
        setSessionId(data.sessionId);
        setQueue(data.questions);
        setAllQuestions(data.questions);
        setReserved([]);
        setFeedback(null);
        setWrongFacts({});
        setSolvedFacts({});
        setRemaining(60);
        setCorrectCount(0);
        setTotalAttempts(0);
        setCoins(0);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Failed to load challenge questions");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || remaining <= 0) return;
    if (queue.length === 0 && reserved.length > 0) {
      setQueue(reserved);
      setReserved([]);
      setFeedback((prev) => prev ?? "Let’s retry the tricky ones!");
    }
  }, [isLoading, queue, reserved, remaining]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => setRemaining((time) => (time > 0 ? time - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  async function submit() {
    if (!current || remaining === 0 || isSubmitting) return;
    const trimmed = input.trim();
    if (!trimmed) {
      setFeedback("Type your answer to continue.");
      return;
    }
    const answer = Number(trimmed);
    if (!Number.isFinite(answer)) {
      setFeedback("Please enter a valid number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tables/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          factId: current.factId,
          a: current.a,
          b: current.b,
          answer,
          latencyMs: 0,
          hintUsed: false,
        }),
      });
      if (!res.ok) {
        throw new Error("We could not save that answer. Please try again.");
      }
      const data = (await res.json()) as AttemptResponse | { error?: string };
      if ("error" in data) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      const wasCorrect = (data as AttemptResponse).correct === true;
      const expected = (data as AttemptResponse).expected ?? current.answer;
      if (typeof (data as AttemptResponse).awarded === "number") {
        setCoins((c) => c + (data as AttemptResponse).awarded);
      }
      setTotalAttempts((t) => t + 1);
      if (wasCorrect) {
        setCorrectCount((count) => count + 1);
        setSolvedFacts((prev) => ({ ...prev, [current.factId]: true }));
        setFeedback("Brilliant! Keep going.");
      } else {
        setFeedback(`Almost! ${current.a} × ${current.b} = ${expected}. We’ll revisit it soon.`);
        setWrongFacts((prev) => ({ ...prev, [current.factId]: (prev[current.factId] ?? 0) + 1 }));
        setReserved((prev) => {
          if (prev.some((item) => item.factId === current.factId)) return prev;
          return [...prev, current];
        });
      }
      setQueue((prev) => prev.slice(1));
      setInput("");
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "We hit a snag saving that answer. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-semibold">Challenge</h1>
        <p className="mt-4 text-sm text-muted-foreground">Loading questions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-semibold">Challenge</h1>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Challenge</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Time left: {remaining}s — Accuracy: {accuracy}% — Coins: <span className="font-semibold">{coins}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Solved {solvedCount} of {totalFacts}
        {trickyCount > 0 ? ` — Tricky facts waiting: ${trickyCount}` : ""}
      </div>
      {remaining > 0 && current ? (
        <div className="mt-6">
          <div className="text-3xl font-bold">{current.prompt}</div>
          <div className="mt-4 flex gap-2">
            <input
              className="w-32 rounded border px-3 py-2"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              inputMode="numeric"
              aria-label="Answer"
              disabled={isSubmitting}
            />
            <button className="rounded bg-black px-3 py-2 text-white disabled:opacity-60" onClick={submit} disabled={isSubmitting}>
              Submit
            </button>
          </div>
          {feedback && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{feedback}</p>}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium">
            {remaining === 0
              ? "Time! Fantastic effort—check out the questions to review."
              : allCleared
                ? "You cleared every fact in this run. Stellar work!"
                : "Challenge complete. Review the facts below."}
          </p>
          {Object.keys(wrongFacts).length > 0 ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <h2 className="font-semibold">Facts to review</h2>
              <ul className="mt-2 space-y-1">
                {Object.entries(wrongFacts).map(([factId, attempts]) => {
                  const fact = allQuestions.find((item) => item.factId === factId);
                  if (!fact) return null;
                  return (
                    <li key={factId}>
                      {fact.a} × {fact.b} — needed {attempts + 1} tries
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tricky facts left—amazing accuracy!</p>
          )}
        </div>
      )}
    </div>
  );
}
