import { NextRequest, NextResponse } from 'next/server';
import { createSessionWithTargets } from '@/lib/tables/service';
import { DEFAULT_USER_ID } from '@/lib/tables/constants';
import { generateChallengeQuestions } from '@/lib/tables/ai/challenge';

export const runtime = 'nodejs';

type ChallengeRequest = {
  userId?: string;
  batchSize?: number;
};

function normaliseBatchSize(size: unknown): number {
  const value = Number(size);
  if (!Number.isFinite(value)) return 10;
  return Math.min(20, Math.max(5, Math.round(value)));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ChallengeRequest | undefined;
  const userId = body?.userId?.trim() || DEFAULT_USER_ID;
  const batchSize = normaliseBatchSize(body?.batchSize);

  const { session, targets } = await createSessionWithTargets({
    userId,
    mode: 'CHALLENGE',
    batchSize,
  });

  const questions = await generateChallengeQuestions(targets);

  return NextResponse.json({
    sessionId: session.id,
    userId,
    questions,
  });
}
