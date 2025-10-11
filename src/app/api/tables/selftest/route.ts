import { NextResponse } from 'next/server';
import { onAttemptUpdateUF, type UserFact } from '@/lib/tables/core/scheduler';
import { deterministicHint } from '@/lib/tables/core/hints';
import { generateDeterministicProblem } from '@/lib/tables/core/problems';

export const runtime = 'nodejs';

type TestResult = { name: string; ok: boolean; info?: string };

export async function GET() {
  const results: TestResult[] = [];

  // Scheduler correct path
  try {
    let uf: UserFact = {
      id: 't', userId: 'u', factId: 'f', masteryLevel: 0, streak: 0, easiness: 2.5, intervalDays: 0, dueAt: new Date()
    };
    uf = onAttemptUpdateUF(uf, true);
    results.push({ name: 'scheduler:correct_increments', ok: uf.streak === 1 && uf.masteryLevel === 1 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: 'scheduler:correct_increments', ok: false, info: msg });
  }

  // Scheduler wrong path
  try {
    let uf: UserFact = {
      id: 't2', userId: 'u', factId: 'f', masteryLevel: 2, streak: 3, easiness: 2.5, intervalDays: 1, dueAt: new Date()
    };
    uf = onAttemptUpdateUF(uf, false);
    results.push({ name: 'scheduler:wrong_resets', ok: uf.streak === 0 && uf.masteryLevel === 1 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: 'scheduler:wrong_resets', ok: false, info: msg });
  }

  // Hints
  try {
    const h = deterministicHint(7, 8);
    results.push({ name: 'hints:7x8_rhyme', ok: /five\-six|five\s*six|56/i.test(h) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: 'hints:7x8_rhyme', ok: false, info: msg });
  }

  // Problems
  try {
    const p = generateDeterministicProblem(3, 4, 'animals');
    results.push({ name: 'problems:structure', ok: !!p && p.op === '*' && Array.isArray(p.operands) && p.problem.length > 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: 'problems:structure', ok: false, info: msg });
  }

  const ok = results.every(r => r.ok);
  return NextResponse.json({ ok, results });
}


