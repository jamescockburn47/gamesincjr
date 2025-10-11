import { NextRequest, NextResponse } from 'next/server';
import { createSessionWithTargets, endSession, SessionMode } from '@/lib/tables/service';
import { DEFAULT_USER_ID } from '@/lib/tables/constants';

export const runtime = 'nodejs';

type SessionRequest = {
  userId?: string;
  mode?: SessionMode | string;
  end?: boolean;
  sessionId?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SessionRequest;

  const userId = body.userId?.trim() || DEFAULT_USER_ID;

  if (body.end && body.sessionId) {
    const session = await endSession(body.sessionId);
    return NextResponse.json({
      ok: Boolean(session),
      sessionId: body.sessionId,
      endedAt: session?.endedAt ?? new Date(),
    });
  }

  const { session, targets } = await createSessionWithTargets({
    userId,
    mode: body.mode ?? 'PRACTICE',
    batchSize: 10,
  });

  return NextResponse.json({
    sessionId: session.id,
    mode: session.mode,
    userId,
    targets,
  });
}


