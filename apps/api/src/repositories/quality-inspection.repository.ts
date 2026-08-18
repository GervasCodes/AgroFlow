// Data-access for QualityInspection (Quality domain).
import { prisma } from "../lib/prisma.js";

const include = { inspector: { select: { id: true, fullName: true } } } as const;

export function findInspectionsForListing(produceListingId: string) {
  return prisma.qualityInspection.findMany({
    where: { produceListingId },
    include,
    orderBy: { inspectedAt: "desc" },
  });
}

export function createInspection(input: {
  produceListingId: string;
  inspectorId: string;
  grade: string;
  notes?: string;
  images?: string[];
}) {
  return prisma.qualityInspection.create({ data: input, include });
}
