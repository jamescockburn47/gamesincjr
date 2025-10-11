import { NextResponse } from 'next/server';
import { onAttemptUpdateUF, type UserFact } from '@/src/lib/tables/core/scheduler';
import { deterministicHint } from '@/src/lib/tables/core/hints';
import { generateDeterministicProblem } from '@/src/lib/tables/core/problems';

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
  } catch (e: any) {
    results.push({ name: 'scheduler:correct_increments', ok: false, info: String(e?.message || e) });
  }

  // Scheduler wrong path
  try {
    let uf: UserFact = {
      id: 't2', userId: 'u', factId: 'f', masteryLevel: 2, streak: 3, easiness: 2.5, intervalDays: 1, dueAt: new Date()
    };
    uf = onAttemptUpdateUF(uf, false);
    results.push({ name: 'scheduler:wrong_resets', ok: uf.streak === 0 && uf.masteryLevel === 1 });
  } catch (e: any) {
    results.push({ name: 'scheduler:wrong_resets', ok: false, info: String(e?.message || e) });
  }

  // Hints
  try {
    const h = deterministicHint(7, 8);
    results.push({ name: 'hints:7x8_rhyme', ok: /five\-six|five\s*six|56/i.test(h) });
  } catch (e: any) {
    results.push({ name: 'hints:7x8_rhyme', ok: false, info: String(e?.message || e) });
  }

  // Problems
  try {
    const p = generateDeterministicProblem(3, 4, 'animals');
    results.push({ name: 'problems:structure', ok: !!p && p.op === '*' && Array.isArray(p.operands) && p.problem.length > 0 });
  } catch (e: any) {
    results.push({ name: 'problems:structure', ok: false, info: String(e?.message || e) });
  }

  const ok = results.every(r => r.ok);
  return NextResponse.json({ ok, results });
}


