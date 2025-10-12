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

/**
 * Determine whether a generated Prisma client is available on disk.
 */
function hasGeneratedPrismaClient(): boolean {
  return existsSync(prismaClientEntry);
}

/**
 * Create a stub Prisma client that throws helpful errors in environments where
 * the real client cannot be loaded (for example in CI without `prisma generate`).
 */
function createStubPrismaClient(): PrismaClientLike {
  const buildError = () =>
    new Error(
      'Prisma client is unavailable in this environment. Run `pnpm prisma generate` locally to enable database features.',
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
  if (!hasGeneratedPrismaClient()) {
    console.warn('Prisma client not generated; using stub fallback.');
    return createStubPrismaClient();
  }

  const { PrismaClient } = require('@prisma/client') as { PrismaClient: PrismaClientConstructor };
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
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


