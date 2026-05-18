import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient | null {
  if (!process.env['DATABASE_URL']) return null;
  if (global._prisma) return global._prisma;
  const client = new PrismaClient();
  if (process.env['NODE_ENV'] !== 'production') global._prisma = client;
  return client;
}

export function getPrisma(): PrismaClient | null {
  return createClient();
}
