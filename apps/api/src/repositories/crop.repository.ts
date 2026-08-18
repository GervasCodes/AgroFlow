// Data-access for Crop lookups. Crops are seeded (see
// database/prisma/seed.ts) from @agroflow/config -- this repository
// only reads them.
import { prisma } from "../lib/prisma.js";

export function findAllCrops() {
  return prisma.crop.findMany({ orderBy: { name: "asc" } });
}

export function findCropByName(name: string) {
  return prisma.crop.findUnique({ where: { name } });
}
