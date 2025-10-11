import { Prisma, PrismaClient, Role, UserFact as PrismaUserFact } from '@prisma/client';
import { selectNextBatch, type UserFact as SchedulerUserFact } from '../core/scheduler';

const FACT_COUNT = 12;
const DEFAULT_EASINESS = 2.5;
const MAX_OFFSET_MINUTES = 6 * 60; // stagger initial due dates within the last 6 hours

function seededOffsetMinutes(userId: string, factId: string): number {
  const key = `${userId}:${factId}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash % MAX_OFFSET_MINUTES;
}

function initialDueAt(offsetMinutes: number): Date {
  return new Date(Date.now() - offsetMinutes * 60 * 1000);
}

function initialIntervalDays(offsetMinutes: number): number {
  return Math.max(0, offsetMinutes / (60 * 24));
}

export type NextFact = {
  id: string;
  userFactId: string;
  a: number;
  b: number;
  op: '*';
  masteryLevel: number;
  dueAt: Date;
};

type UserFactWithFact = Prisma.UserFactGetPayload<{ include: { fact: true } }>;

function toSchedulerUserFact(record: PrismaUserFact): SchedulerUserFact {
  return {
    id: record.id,
    userId: record.userId,
    factId: record.factId,
    masteryLevel: record.masteryLevel,
    streak: record.streak,
    easiness: record.easiness,
    intervalDays: record.intervalDays,
    dueAt: record.dueAt,
    lastLatencyMs: record.lastLatencyMs ?? undefined,
    lastAccuracy: record.lastAccuracy ?? undefined,
  };
}

function byId<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

export async function ensureFacts(prisma: PrismaClient): Promise<void> {
  const count = await prisma.fact.count();
  if (count >= FACT_COUNT * FACT_COUNT) return;

  const data: Array<{ a: number; b: number; op: string }> = [];
  for (let a = 1; a <= FACT_COUNT; a += 1) {
    for (let b = 1; b <= FACT_COUNT; b += 1) {
      data.push({ a, b, op: '*' });
    }
  }

  await prisma.fact.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function ensureUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      role: Role.STUDENT,
      aiAllowed: false,
    },
  });
}

export async function ensureUserFacts(prisma: PrismaClient, userId: string): Promise<void> {
  const factIds = await prisma.fact.findMany({ select: { id: true } });
  if (!factIds.length) return;

  const existing = await prisma.userFact.findMany({
    where: { userId },
    select: { factId: true },
  });
  const existingIds = new Set(existing.map((entry) => entry.factId));

  const missing = factIds
    .map((fact) => fact.id)
    .filter((id) => !existingIds.has(id))
    .map((factId) => {
      const offsetMinutes = seededOffsetMinutes(userId, factId);
      return {
        userId,
        factId,
        masteryLevel: 0,
        streak: 0,
        easiness: DEFAULT_EASINESS,
        intervalDays: initialIntervalDays(offsetMinutes),
        dueAt: initialDueAt(offsetMinutes),
      };
    });

  if (missing.length) {
    await prisma.userFact.createMany({ data: missing });
  }
}

export async function getNextFactsForUser(
  prisma: PrismaClient,
  userId: string,
  batchSize = 10,
): Promise<NextFact[]> {
  await ensureFacts(prisma);
  await ensureUser(prisma, userId);
  await ensureUserFacts(prisma, userId);

  const now = new Date();

  const dueRecords = await prisma.userFact.findMany({
    where: { userId, dueAt: { lte: now } },
    include: { fact: true },
    orderBy: [{ dueAt: 'asc' }],
  });

  const backlogRecords = await prisma.userFact.findMany({
    where: { userId, dueAt: { gt: now } },
    include: { fact: true },
    orderBy: [{ dueAt: 'asc' }],
  });

  const duePairs = dueRecords.map((record) => ({
    record,
    scheduler: toSchedulerUserFact(record),
  }));
  const backlogPairs = backlogRecords.map((record) => ({
    record,
    scheduler: toSchedulerUserFact(record),
  }));

  const selectedScheduler = selectNextBatch(
    duePairs.map((pair) => pair.scheduler),
    backlogPairs.map((pair) => pair.scheduler),
    batchSize,
  );

  const lookup = new Map<string, UserFactWithFact>();
  duePairs.forEach((pair) => lookup.set(pair.scheduler.id, pair.record));
  backlogPairs.forEach((pair) => lookup.set(pair.scheduler.id, pair.record));

  const selectedRecords = selectedScheduler
    .map((entry) => lookup.get(entry.id))
    .filter((value): value is UserFactWithFact => Boolean(value));

  if (!selectedRecords.length) {
    const fallbackFacts = await prisma.fact.findMany({
      orderBy: [{ a: 'asc' }, { b: 'asc' }],
      take: batchSize,
    });
    const userFacts = await prisma.userFact.findMany({
      where: { userId, factId: { in: fallbackFacts.map((fact) => fact.id) } },
    });
    const userFactMap = byId(userFacts);
    return fallbackFacts.map((fact) => {
      const uf = userFactMap.get(fact.id);
      return {
        id: fact.id,
        userFactId: uf?.id ?? '',
        a: fact.a,
        b: fact.b,
        op: '*',
        masteryLevel: uf?.masteryLevel ?? 0,
        dueAt: uf?.dueAt ?? now,
      };
    });
  }

  return selectedRecords.map((record) => ({
    id: record.fact.id,
    userFactId: record.id,
    a: record.fact.a,
    b: record.fact.b,
    op: '*',
    masteryLevel: record.masteryLevel,
    dueAt: record.dueAt,
  }));
}

export function mapUserFactRecord(record: PrismaUserFact): SchedulerUserFact {
  return toSchedulerUserFact(record);
}
