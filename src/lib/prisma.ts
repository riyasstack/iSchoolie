import { PrismaClient } from '@prisma/client';

/**
 * One Prisma client per server process.
 *
 * Next.js dev mode re-evaluates modules on every hot reload; keeping the
 * instance on `globalThis` avoids leaking a connection pool per edit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
