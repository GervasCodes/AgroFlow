// Read-only aggregate queries for the Analytics domain. Every query here
// is a straight Prisma aggregate/groupBy over existing tables plus the
// new Dispute model -- there's no separate analytics store.
import { prisma } from "../lib/prisma.js";

/** Count of PUBLISHED+ listings grouped by the channel they were created
 * through (APP/USSD/SMS/WHATSAPP/AGENT) -- see ProduceListing.createdByChannel. */
export function channelMix() {
  return prisma.produceListing.groupBy({
    by: ["createdByChannel"],
    _count: { _all: true },
  });
}

/** Average and count of pricePerUnit per crop, across published listings
 * that have a price set. */
export function priceTrendsByCrop() {
  return prisma.produceListing.groupBy({
    by: ["cropId"],
    where: { status: "PUBLISHED", pricePerUnit: { not: null } },
    _avg: { pricePerUnit: true },
    _count: { _all: true },
  });
}

export async function disputeRate() {
  const [totalOrders, totalDisputes] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.dispute.count(),
  ]);
  return { totalOrders, totalDisputes };
}
