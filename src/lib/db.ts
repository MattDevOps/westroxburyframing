import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client Singleton
 * 
 * This ensures we reuse the same Prisma instance across the application,
 * preventing connection pool exhaustion and "connection closed" errors.
 * 
 * For connection pool configuration, add parameters to your DATABASE_URL:
 * - For direct connections: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 * - For connection poolers (PgBouncer): Use the pooler URL with transaction mode
 * 
 * Common causes of "connection closed" errors:
 * - Database server closing idle connections (increase pool_timeout)
 * - Too many concurrent connections (reduce connection_limit)
 * - Network issues or database restarts
 */
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

export const prisma =
  global.prisma ||
  new PrismaClient(prismaClientOptions);

// In development, reuse the same instance to prevent connection exhaustion
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Graceful shutdown - disconnect on process exit
if (typeof process !== "undefined") {
  const gracefulShutdown = async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error disconnecting Prisma:", error);
    }
  };

  process.on("beforeExit", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}
