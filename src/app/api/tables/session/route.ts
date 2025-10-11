import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { mode, end, sessionId } = await req.json();
  if (end && sessionId) {
    return NextResponse.json({ ok: true, sessionId, endedAt: Date.now() });
  }
  const id = `s_${Math.random().toString(36).slice(2)}`;
  // For MVP return a stub next targets list (facts)
  const targets = Array.from({ length: 10 }).map((_, i) => ({ id: `f_${i}`, a: 1 + (i % 12), b: 1 + ((i * 2) % 12), op: '*' }));
  return NextResponse.json({ sessionId: id, mode: mode || 'PRACTICE', targets });
}


