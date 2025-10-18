/** Lightweight shapes mirrored from the Prisma schema for build-time safety. */
export type DbFact = {
  id: string;
  a: number;
  b: number;
  op: '*';
};

export type DbSession = {
  id: string;
  userId: string;
  mode: string;
  endedAt: Date | null;
};

export type DbUserFactRecord = {
  id: string;
  userId: string;
  factId: string;
  masteryLevel: number;
  streak: number;
  easiness: number;
  intervalDays: number;
  dueAt: Date;
  lastLatencyMs: number | null;
  lastAccuracy: number | null;
};

export type DbUserFactWithFact = DbUserFactRecord & { fact: DbFact };

/**
 * Minimal Prisma client contract used by the tables features. Prisma's generated
 * type definitions are not available during CI builds because postinstall hooks
 * are skipped, so we rely on this structural typing to keep builds green while
 * still providing helpful editor hints locally.
 */
export type PrismaClientLike = {
  __isStub?: true;
  fact: {
    count(): Promise<number>;
    createMany(args: { data: Array<{ a: number; b: number; op: string }>; skipDuplicates?: boolean }): Promise<unknown>;
    findMany(args: {
      select?: { id: true };
      orderBy?: Array<{ a: 'asc' } | { b: 'asc' }>;
      take?: number;
    }): Promise<Array<DbFact>>;
    findUnique(args: { where: { id: string } }): Promise<DbFact | null>;
  };
  session: {
    create(args: { data: { id?: string; userId: string; mode: string } }): Promise<DbSession>;
    update(args: { where: { id: string }; data: { endedAt: Date } }): Promise<DbSession>;
    findUnique(args: { where: { id: string } }): Promise<DbSession | null>;
  };
  attempt: {
    create(args: {
      data: {
        sessionId: string;
        factId: string;
        correct: boolean;
        latencyMs: number;
        hintUsed: boolean;
      };
    }): Promise<unknown>;
  };
  user: {
    upsert(args: {
      where: { id: string };
      update: Record<string, unknown>;
      create: { id: string; role: string; aiAllowed: boolean };
    }): Promise<void>;
  };
  userFact: {
    findMany(args: {
      where: {
        userId: string;
        dueAt?: { lte?: Date; gt?: Date };
        factId?: { in: string[] };
      };
      select?: { factId: true };
      include?: { fact: true };
      orderBy?: Array<{ dueAt: 'asc' }>;
    }): Promise<Array<Record<string, unknown>>>;
    findUnique(args: {
      where: { userId_factId: { userId: string; factId: string } };
    }): Promise<DbUserFactRecord | null>;
    createMany(args: { data: Array<Record<string, unknown>> }): Promise<unknown>;
    update(args: {
      where: { id: string };
      data: Partial<DbUserFactRecord> & { lastLatencyMs?: number; lastAccuracy?: number };
    }): Promise<DbUserFactRecord>;
  };
};
