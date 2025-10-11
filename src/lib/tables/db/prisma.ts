import { PrismaClient } from '@prisma/client';

type GlobalWithPrisma = typeof globalThis & {
  __prisma__?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

export const prisma =
  globalForPrisma.__prisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}

export function getPrisma(): PrismaClient {
  return prisma;
}


