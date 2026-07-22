/**
 * Prisma Client singleton.
 *
 * Prisma 7 uses a driver adapter for SQL access (no bundled query engine), so
 * we wire the `pg` driver via `@prisma/adapter-pg`. The instance is cached on
 * `globalThis` in development to survive Next.js hot-reloads (otherwise each
 * reload would open a new connection pool and exhaust Postgres).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
