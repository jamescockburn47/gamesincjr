import { NextRequest, NextResponse } from 'next/server';
import { recordAttempt } from '@/lib/tables/service';
import { DEFAULT_USER_ID } from '@/lib/tables/constants';

export const runtime = 'nodejs';

type AttemptRequest = {
  sessionId?: string;
  factId: string;
  answer: number;
  latencyMs?: number;
  hintUsed?: boolean;
  userId?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AttemptRequest;
  if (!body.factId) {
    return NextResponse.json({ error: 'Missing factId' }, { status: 400 });
  }

  try {
    const result = await recordAttempt({
      userId: body.userId ?? DEFAULT_USER_ID,
      sessionId: body.sessionId,
      factId: body.factId,
      answer: Number(body.answer),
      latencyMs: body.latencyMs,
      hintUsed: body.hintUsed,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

