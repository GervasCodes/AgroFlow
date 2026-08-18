// Data-access for Role lookups. Roles themselves are seeded (see
// database/prisma/seed.ts) from @agroflow/config -- this repository only
// reads them.
import { prisma } from "../lib/prisma.js";

export function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } });
}
