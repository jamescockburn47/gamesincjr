import { PrismaClient } from '@prisma/client';
import { getPrisma } from './db/prisma';
import { ensureFacts, ensureUser, ensureUserFacts, getNextFactsForUser, mapUserFactRecord } from './db/ensure';
import { DEFAULT_USER_ID } from './constants';
import { onAttemptUpdateUF } from '../core/scheduler';

export type SessionMode = 'PRACTICE' | 'CHALLENGE' | 'BOSS';

export type SessionTarget = {
  id: string;
  a: number;
  b: number;
  op: '*';
};

export async function createSessionWithTargets(options?: {
  userId?: string;
  mode?: SessionMode | string;
  batchSize?: number;
}) {
  const prisma = getPrisma();
  const userId = options?.userId?.trim() || DEFAULT_USER_ID;
  const mode = (options?.mode as SessionMode) || 'PRACTICE';
  const batchSize = options?.batchSize ?? 10;

  await ensureFacts(prisma);
  await ensureUser(prisma, userId);
  await ensureUserFacts(prisma, userId);

  const session = await prisma.session.create({
    data: {
      userId,
      mode,
    },
  });

  const targets = await getNextFactsForUser(prisma, userId, batchSize);

  return {
    session,
    userId,
    targets: targets.map((target) => ({
      id: target.id,
      a: target.a,
      b: target.b,
      op: target.op,
    })),
  };
}

export async function endSession(sessionId: string) {
  const prisma = getPrisma();
  return prisma.session
    .update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    })
    .catch(() => null);
}

export type AttemptResult = {
  correct: boolean;
  expected: number;
  awarded: number;
  masteryLevel: number;
  streak: number;
  dueAt: Date;
};

export async function recordAttempt(params: {
  userId?: string;
  sessionId?: string;
  factId: string;
  answer: number;
  latencyMs?: number;
  hintUsed?: boolean;
}): Promise<AttemptResult> {
  const prisma = getPrisma();
  const latencyMs = Number.isFinite(params.latencyMs)
    ? Math.max(0, Math.round(Number(params.latencyMs)))
    : 0;
  const hintUsed = Boolean(params.hintUsed);
  const userId = params.userId?.trim() || DEFAULT_USER_ID;

  await ensureFacts(prisma);
  await ensureUser(prisma, userId);
  await ensureUserFacts(prisma, userId);

  const fact = await prisma.fact.findUnique({ where: { id: params.factId } });
  if (!fact) {
    throw new Error('Fact not found');
  }

  const expected = fact.a * fact.b;
  const correct = Number(params.answer) === expected;

  const session =
    (params.sessionId &&
      (await prisma.session.findUnique({ where: { id: params.sessionId } }))) ||
    (await prisma.session.create({
      data: {
        id: params.sessionId,
        userId,
        mode: 'PRACTICE',
      },
    }));

  await prisma.attempt.create({
    data: {
      sessionId: session.id,
      factId: fact.id,
      correct,
      latencyMs,
      hintUsed,
    },
  });

  const userFact = await prisma.userFact.findUnique({
    where: { userId_factId: { userId, factId: fact.id } },
  });
  if (!userFact) {
    throw new Error('User fact missing');
  }

  const previousLevel = userFact.masteryLevel;
  const updatedUF = onAttemptUpdateUF(mapUserFactRecord(userFact), correct);

  const updated = await prisma.userFact.update({
    where: { id: userFact.id },
    data: {
      masteryLevel: updatedUF.masteryLevel,
      streak: updatedUF.streak,
      easiness: updatedUF.easiness,
      intervalDays: updatedUF.intervalDays,
      dueAt: updatedUF.dueAt,
      lastLatencyMs: latencyMs,
      lastAccuracy: correct ? 1 : 0,
    },
  });

  const awarded =
    correct && updated.masteryLevel > previousLevel
      ? previousLevel === 0
        ? 200
        : 10
      : correct
        ? 10
        : 0;

  return {
    correct,
    expected,
    awarded,
    masteryLevel: updated.masteryLevel,
    streak: updated.streak,
    dueAt: updated.dueAt,
  };
}
