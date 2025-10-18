"use client";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

type Target = { id: string; a: number; b: number; op: "*" };

export default function ChallengePage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [current, setCurrent] = useState<Target | null>(null);
  const [input, setInput] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(60);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/tables/session", { method: "POST", body: JSON.stringify({ mode: "CHALLENGE" }) });
      const data = await res.json();
      setSessionId(data.sessionId);
      setTargets(data.targets);
      setCurrent(data.targets[0] || null);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRemaining((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    if (!current || remaining === 0) return;
    const answer = Number(input);
    const res = await fetch("/api/tables/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, factId: current.id, a: current.a, b: current.b, answer, latencyMs: 0, hintUsed: false }) });
    const data = await res.json();
    if (typeof data.awarded === 'number') setCoins((c) => c + data.awarded);
    setTotal((t) => t + 1);
    if (data.correct) setCorrectCount((c) => c + 1);
    const idx = targets.findIndex(t => t.id === current.id);
    const next = targets[idx + 1] || targets[0] || null;
    setCurrent(next);
    setInput("");
  }

  const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Mirror the submit button for Enter key presses to speed up play.
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Challenge</h1>
      <div className="mt-2 text-sm text-muted-foreground">Time left: {remaining}s — Accuracy: {accuracy}% — Coins: <span className="font-semibold">{coins}</span></div>
      {remaining > 0 && current ? (
        <div className="mt-6">
          <div className="text-3xl font-bold">{current.a} × {current.b} = ?</div>
          <div className="mt-4 flex gap-2">
            <input className="w-32 rounded border px-3 py-2" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} inputMode="numeric" aria-label="Answer" />
            <button className="rounded bg-black px-3 py-2 text-white" onClick={submit}>Submit</button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm">Time! Great effort.</p>
        </div>
      )}
    </div>
  );
}

 


