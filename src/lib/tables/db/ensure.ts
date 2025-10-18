import { selectNextBatch, type UserFact as SchedulerUserFact } from '../core/scheduler';
import type { DbUserFactRecord, DbUserFactWithFact, PrismaClientLike } from './types';

const FACT_COUNT = 12;
const DEFAULT_EASINESS = 2.5;
const MAX_OFFSET_MINUTES = 6 * 60; // stagger initial due dates within the last 6 hours

/**
 * Generate a deterministic pseudo-random offset used to stagger due dates for a
 * user's multiplication facts so that initial schedules are distributed.
 */
function seededOffsetMinutes(userId: string, factId: string): number {
  const key = `${userId}:${factId}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash % MAX_OFFSET_MINUTES;
}

/**
 * Convert an offset in minutes to a concrete due date relative to the current
 * time.
 */
function initialDueAt(offsetMinutes: number): Date {
  return new Date(Date.now() - offsetMinutes * 60 * 1000);
}

/**
 * Translate a minute offset into an initial spaced-repetition interval in days.
 */
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

/**
 * Map a database user fact record into the scheduler-friendly structure.
 */
function toSchedulerUserFact(record: DbUserFactRecord): SchedulerUserFact {
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

/**
 * Build a lookup map keyed by the `id` property from the provided records.
 */
function byId<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

/**
 * Seed the multiplication facts table with FACT_COUNT × FACT_COUNT entries when
 * the database has not been initialized yet.
 */
export async function ensureFacts(prisma: PrismaClientLike): Promise<void> {
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

/**
 * Ensure a user exists with the default student role so practice sessions can
 * be tracked.
 */
export async function ensureUser(prisma: PrismaClientLike, userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      role: 'STUDENT',
      aiAllowed: false,
    },
  });
}

/**
 * Create missing `userFact` rows so every multiplication fact has a tracking
 * record for the given user.
 */
export async function ensureUserFacts(prisma: PrismaClientLike, userId: string): Promise<void> {
  const factIds = await prisma.fact.findMany({ select: { id: true } });
  if (!factIds.length) return;

  const existing = (await prisma.userFact.findMany({
    where: { userId },
    select: { factId: true },
  })) as Array<{ factId: string }>;
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

/**
 * Retrieve the next batch of multiplication facts for the user, seeding any
 * required data and falling back to simple ordering when the scheduler has no
 * due records available.
 */
export async function getNextFactsForUser(
  prisma: PrismaClientLike,
  userId: string,
  batchSize = 10,
): Promise<NextFact[]> {
  await ensureFacts(prisma);
  await ensureUser(prisma, userId);
  await ensureUserFacts(prisma, userId);

  const now = new Date();

  const dueRecords = (await prisma.userFact.findMany({
    where: { userId, dueAt: { lte: now } },
    include: { fact: true },
    orderBy: [{ dueAt: 'asc' }],
  })) as DbUserFactWithFact[];

  const backlogRecords = (await prisma.userFact.findMany({
    where: { userId, dueAt: { gt: now } },
    include: { fact: true },
    orderBy: [{ dueAt: 'asc' }],
  })) as DbUserFactWithFact[];

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

  const lookup = new Map<string, DbUserFactWithFact>();
  duePairs.forEach((pair) => lookup.set(pair.scheduler.id, pair.record));
  backlogPairs.forEach((pair) => lookup.set(pair.scheduler.id, pair.record));

  const selectedRecords = selectedScheduler
    .map((entry) => lookup.get(entry.id))
    .filter((value): value is DbUserFactWithFact => Boolean(value));

  if (!selectedRecords.length) {
    const fallbackFacts = await prisma.fact.findMany({
      orderBy: [{ a: 'asc' }, { b: 'asc' }],
      take: batchSize,
    });
    const userFacts = (await prisma.userFact.findMany({
      where: { userId, factId: { in: fallbackFacts.map((fact) => fact.id) } },
    })) as DbUserFactRecord[];
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

/**
 * Convenience mapper that exposes the scheduler transformation for external
 * callers such as tests.
 */
export function mapUserFactRecord(record: DbUserFactRecord): SchedulerUserFact {
  return toSchedulerUserFact(record);
}
