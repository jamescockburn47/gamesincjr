"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { deterministicHint } from "@/lib/tables/core/hints";

type Target = { id: string; a: number; b: number; op: "*" };

type AttemptResponse = {
  correct: boolean;
  expected: number;
  awarded: number;
  masteryLevel: number;
  streak: number;
  dueAt: string;
};

type AttemptErrorResponse = {
  error?: string;
};

type AttemptResult = AttemptResponse | AttemptErrorResponse;

/**
 * Type guard ensuring the API payload matches the expected attempt response.
 * Guards against malformed responses before we access shape-specific fields.
 */
function isAttemptResponse(data: AttemptResult): data is AttemptResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.correct === "boolean" &&
    typeof candidate.expected === "number" &&
    typeof candidate.awarded === "number" &&
    typeof candidate.masteryLevel === "number" &&
    typeof candidate.streak === "number" &&
    typeof candidate.dueAt === "string"
  );
}

type Props = {
  sessionId: string;
  userId: string;
  initialTargets: Target[];
};

export function PracticeClient({ sessionId, userId, initialTargets }: Props) {
  const [targets, setTargets] = useState<Target[]>(initialTargets);
  const [index, setIndex] = useState(0);
  const [coins, setCoins] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const current = useMemo(() => targets[index] ?? null, [targets, index]);
  const totalInBatch = targets.length;
  const progress = totalInBatch > 0 ? Math.min(index + 1, totalInBatch) : 0;

  useEffect(() => {
    // Keep the answer field focused as new questions load so kids can type right away.
    inputRef.current?.focus();
  }, [current?.id]);

  const refreshBatch = useCallback(async (): Promise<Target[] | null> => {
    try {
      const res = await fetch(`/api/tables/scheduler/next?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      const nextTargets = Array.isArray(data.targets) ? data.targets : [];
      setTargets(nextTargets);
      setIndex(0);
      return nextTargets;
    } catch {
      return null;
    }
  }, [userId]);

  const submit = useCallback(() => {
    if (!current || !input.trim()) return;
    const answer = Number(input.trim());
    const factLabel = `${current.a} x ${current.b}`;
    setFeedback(null);
    startTransition(async () => {
      const res = await fetch("/api/tables/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId,
          factId: current.id,
          answer,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        setFeedback("We could not save that answer. Please try again.");
        return;
      }

      const data = (await res.json()) as AttemptResult;
      if ("error" in data && data.error) {
        setFeedback(data.error);
        return;
      }

      if (!isAttemptResponse(data)) {
        setFeedback("We could not understand the server response. Please try again.");
        return;
      }

      setCoins((prev) => prev + data.awarded);

      const total = targets.length;
      const nextIndex = index + 1;

      setInput("");
      setIndex(nextIndex);

      const wasCorrect = data.correct === true;
      const expected = data.expected;
      let message = wasCorrect ? "Correct! Nice work." : `Nearly. ${factLabel} = ${expected}.`;

      if (nextIndex >= total) {
        const nextBatch = await refreshBatch();
        if (nextBatch === null) {
          message = "Progress saved, but we could not load a new batch. Try again in a moment.";
        } else if (nextBatch.length === 0) {
          message = "Everything due is complete right now. Great job staying on top of your facts!";
        } else if (wasCorrect) {
          message = "Batch cleared! A fresh set of practice facts is ready.";
        }
      }

      setFeedback(message);
    });
  }, [current, input, sessionId, userId, targets.length, index, refreshBatch]);

  const requestHint = useCallback(async () => {
    if (!current) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/tables/coach/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a: current.a, b: current.b, op: "*", userId }),
        });
        if (!res.ok) {
          setFeedback(deterministicHint(current.a, current.b));
          return;
        }
        const data = (await res.json()) as { hint?: string };
        setFeedback(data.hint || deterministicHint(current.a, current.b));
      } catch {
        setFeedback(deterministicHint(current.a, current.b));
      }
    });
  }, [current, userId]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Allow Enter key presses to submit answers without clicking the button.
      if (event.key === "Enter") {
        event.preventDefault();
        if (!isPending) {
          submit();
        }
      }
    },
    [isPending, submit]
  );

  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/40 px-6 py-12 text-center">
        <h2 className="font-semibold">Awesome work!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve cleared this batch. Grab a break or jump into another mode.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Practice session</h2>
        <span className="text-sm">
          Coins: <strong>{coins}</strong>
        </span>
      </div>
      <div className="mt-6 text-4xl font-bold tracking-wide">
        {current.a} x {current.b} = ?
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-32 rounded-xl border border-border bg-background px-4 py-3 text-lg shadow-inner focus:border-primary focus:outline-none"
          inputMode="numeric"
          disabled={isPending}
          aria-label="Answer"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground shadow transition hover:-translate-y-0.5 disabled:opacity-60"
          disabled={isPending || !input.trim()}
        >
          Submit
        </button>
        <button
          type="button"
          onClick={requestHint}
          className="rounded-xl border border-muted px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          disabled={isPending}
        >
          Hint
        </button>
      </div>
      {feedback && (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
          {feedback}
        </p>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Fact {progress} of {totalInBatch}
      </p>
    </div>
  );
}
