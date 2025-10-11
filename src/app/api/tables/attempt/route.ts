import { NextRequest, NextResponse } from 'next/server';
import { onAttemptUpdateUF, type UserFact } from '@/src/lib/tables/core/scheduler';

export const runtime = 'edge';

const memoryUF: Record<string, UserFact> = {};

export async function POST(req: NextRequest) {
  const { sessionId, factId, a, b, answer, latencyMs, hintUsed } = await req.json();
  const correct = Number(answer) === Number(a) * Number(b);
  const key = `uf:${factId}`;
  let uf = memoryUF[key] || {
    id: key,
    userId: 'anon',
    factId: String(factId),
    masteryLevel: 0,
    streak: 0,
    easiness: 2.5,
    intervalDays: 0,
    dueAt: new Date(),
  } as UserFact;
  uf.lastLatencyMs = Number(latencyMs) || 0;
  uf.lastAccuracy = correct ? 1 : 0;
  uf = onAttemptUpdateUF(uf, !!correct);
  memoryUF[key] = uf;
  return NextResponse.json({ correct, uf, awarded: correct ? (uf.masteryLevel === 1 ? 200 : 10) : 0 });
}


