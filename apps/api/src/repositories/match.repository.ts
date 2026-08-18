// Data-access for Match (Marketplace domain) -- the proposal linking a
// buyer's DemandOrder to a seller's ProduceListing.
import { prisma } from "../lib/prisma.js";
import type { Match } from "@prisma/client";

const include = {
  demandOrder: { include: { crop: true } },
  produceListing: {
    include: { crop: true, farm: { select: { id: true, name: true, regionId: true, ownerId: true } } },
  },
} as const;

export function findMatchById(id: string) {
  return prisma.match.findUnique({ where: { id }, include });
}

/** Matches proposed BY this buyer (across all their demand orders). */
export function findMatchesForBuyer(buyerId: string) {
  return prisma.match.findMany({
    where: { demandOrder: { buyerId } },
    include,
    orderBy: { createdAt: "desc" },
  });
}

/** Matches proposed AGAINST this seller's listings -- what a farmer sees
 * as incoming interest they can approve/reject. */
export function findMatchesForSeller(sellerId: string) {
  return prisma.match.findMany({
    where: { produceListing: { farm: { ownerId: sellerId } } },
    include,
    orderBy: { createdAt: "desc" },
  });
}

export function createMatch(input: {
  demandOrderId: string;
  produceListingId: string;
  matchedQuantity: number;
  proposedPricePerUnit?: number;
}) {
  return prisma.match.create({ data: input, include });
}

export function updateMatchStatus(id: string, status: Match["status"]) {
  return prisma.match.update({ where: { id }, data: { status }, include });
}
