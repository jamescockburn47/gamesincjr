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
// Opt-in flag so tests can still exercise the non-database code paths without a
// generated Prisma client. Production builds should keep this disabled so we
// fail fast when the client has not been generated.
const allowStub = process.env.PRISMA_ALLOW_STUB === '1' || process.env.PRISMA_ALLOW_STUB === 'true';

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


