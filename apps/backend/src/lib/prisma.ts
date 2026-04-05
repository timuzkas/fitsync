import { PrismaClient } from '@prisma/client';

console.log('[PRISMA] Initializing PrismaClient');

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error'],
  });

console.log('[PRISMA] PrismaClient initialized');

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
