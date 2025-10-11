"use client";
import { useEffect, useState } from "react";

type Target = { id: string; a: number; b: number; op: "*" };

export default function BossPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [current, setCurrent] = useState<Target | null>(null);
  const [input, setInput] = useState<string>("");
  const [hp, setHp] = useState<number>(10);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/tables/scheduler/next");
      const data = await res.json();
      setTargets(data.targets);
      setCurrent(data.targets[0] || null);
    })();
  }, []);

  async function submit() {
    if (!current || hp <= 0) return;
    const answer = Number(input);
    const correct = answer === current.a * current.b;
    if (correct) setHp((h) => Math.max(0, h - 1));
    const idx = targets.findIndex(t => t.id === current.id);
    const next = targets[idx + 1] || null;
    setCurrent(next);
    setInput("");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Boss Battle</h1>
      <div className="mt-2 text-sm text-muted-foreground">Boss HP: {hp}</div>
      {hp > 0 && current ? (
        <div className="mt-6">
          <div className="text-3xl font-bold">{current.a} × {current.b} = ?</div>
          <div className="mt-4 flex gap-2">
            <input className="w-32 rounded border px-3 py-2" value={input} onChange={e => setInput(e.target.value)} inputMode="numeric" aria-label="Answer" />
            <button className="rounded bg-black px-3 py-2 text-white" onClick={submit}>Attack</button>
          </div>
        </div>
      ) : (
        <div className="mt-6"><p className="text-sm">You win! 🎉</p></div>
      )}
    </div>
  );
}

export { default } from "../../(app)/boss/page";


