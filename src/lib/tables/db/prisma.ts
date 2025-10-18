/* eslint-disable @typescript-eslint/no-require-imports */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PrismaClientLike } from './types';

type PrismaClientConstructor = new (options?: { log?: Array<'warn' | 'error'> }) => PrismaClientLike;

type GlobalWithPrisma = typeof globalThis & {
  __prisma__?: PrismaClientLike;
};

const globalForPrisma = globalThis as GlobalWithPrisma;
const prismaClientEntry = join(process.cwd(), 'node_modules/.prisma/client/index.js');
const PLACEHOLDER_DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
// Opt-in flag so tests can still exercise the non-database code paths without a
// generated Prisma client. Production builds should keep this disabled so we
// fail fast when the client has not been generated.
const allowStub = process.env.PRISMA_ALLOW_STUB === '1' || process.env.PRISMA_ALLOW_STUB === 'true';

/**
 * Determine whether the provided connection string is the placeholder shipping
 * with the repository.
 */
function isPlaceholderDatabaseUrl(url: string | undefined): boolean {
  if (!url) return true;
  return url === PLACEHOLDER_DATABASE_URL || /placeholder/i.test(url);
}

/**
 * Resolve the database connection string from the available environment
 * variables. Vercel’s Postgres integration exposes `POSTGRES_PRISMA_URL`, while
 * local setups often rely on `DATABASE_URL`. The resolved URL is written back to
 * `process.env.DATABASE_URL` so Prisma’s runtime always receives a concrete
 * value.
 */
function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const candidate of candidates) {
    if (!isPlaceholderDatabaseUrl(candidate)) {
      if (isPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
        process.env.DATABASE_URL = candidate;
      }
      return candidate;
    }
  }

  return undefined;
}

/**
 * Determine whether a generated Prisma client is available on disk.
 */
function hasGeneratedPrismaClient(): boolean {
  return existsSync(prismaClientEntry);
}

/**
 * Create a stub Prisma client that throws helpful errors in environments where
 * the real client cannot be loaded (for example in CI without `prisma generate`).
 * The stub is only constructed when `PRISMA_ALLOW_STUB` is explicitly enabled.
 */
function createStubPrismaClient(reason: string, cause?: unknown): PrismaClientLike {
  const buildError = () =>
    new Error(
      `${reason}\n` +
        'Run `pnpm prisma generate` locally (or ensure your deploy runs Prisma generate) to enable database features.',
      { cause },
    );

  const reject = async () => {
    throw buildError();
  };

  const stub: PrismaClientLike = {
    fact: {
      count: reject,
      createMany: reject,
      findMany: reject,
      findUnique: reject,
    },
    session: {
      create: reject,
      update: reject,
      findUnique: reject,
    },
    attempt: {
      create: reject,
    },
    user: {
      upsert: reject,
    },
    userFact: {
      findMany: reject,
      findUnique: reject,
      createMany: reject,
      update: reject,
    },
  } as PrismaClientLike;

  stub.__isStub = true;
  return stub;
}

/**
 * Lazily instantiate the Prisma client. Using a runtime require avoids build-time
 * type resolution issues when Prisma has not generated full typings yet (common
 * in sandboxed CI environments).
 */
function createClient(): PrismaClientLike {
  const missingClientMessage =
    'Prisma client could not be located. The generated client is expected at node_modules/.prisma/client/index.js. ' +
    'Run `pnpm prisma generate` before starting the app or building for production.';

  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    const message =
      'No database connection string detected. Set DATABASE_URL (or POSTGRES_PRISMA_URL when using Vercel Postgres) before starting the app.';

    if (allowStub) {
      console.warn(`${message} Falling back to stub because PRISMA_ALLOW_STUB is enabled.`);
      return createStubPrismaClient(message);
    }

    throw new Error(message);
  }

  if (!hasGeneratedPrismaClient()) {
    if (allowStub) {
      console.warn(`${missingClientMessage} Falling back to stub because PRISMA_ALLOW_STUB is enabled.`);
      return createStubPrismaClient(missingClientMessage);
    }

    throw new Error(missingClientMessage);
  }

  try {
    const { PrismaClient } = require('@prisma/client') as { PrismaClient: PrismaClientConstructor };
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  } catch (error) {
    if (allowStub) {
      console.error('Failed to load Prisma client; using stub fallback.', error);
      return createStubPrismaClient('Failed to load Prisma client due to a runtime error.', error);
    }

    throw new Error(
      'Failed to load Prisma client. See inner error for details and verify `pnpm prisma generate` completes successfully.',
      { cause: error },
    );
  }
}

export const prisma = globalForPrisma.__prisma__ || createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}

/**
 * Retrieve the shared Prisma client instance, which may be a stub when the
 * generated client is unavailable.
 */
export function getPrisma(): PrismaClientLike {
  return prisma;
}


