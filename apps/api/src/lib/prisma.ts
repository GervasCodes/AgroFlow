// Single shared Prisma client instance. Every repository imports this --
// never instantiate `new PrismaClient()` anywhere else (connection pool
// exhaustion in dev with hot-reload otherwise).
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __agroflowPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__agroflowPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__agroflowPrisma = prisma;
}
