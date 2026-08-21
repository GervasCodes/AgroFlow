// Data-access for TrustScore (Trust domain). One row per user, created
// lazily on first read/adjustment rather than at registration -- most
// users never need one computed until they complete an order or a
// dispute is filed.
import { prisma } from "../lib/prisma.js";

export function findTrustScoreByUser(userId: string) {
  return prisma.trustScore.findUnique({ where: { userId } });
}

function getOrCreate(userId: string) {
  return prisma.trustScore.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function recordCompletedOrder(userId: string) {
  await getOrCreate(userId);
  return prisma.trustScore.update({
    where: { userId },
    data: { completedOrders: { increment: 1 }, score: { increment: 1 } },
  });
}

export async function recordDisputeFiled(userId: string) {
  await getOrCreate(userId);
  return prisma.trustScore.update({
    where: { userId },
    data: { disputesFiled: { increment: 1 } },
  });
}

export async function recordDisputeAgainst(userId: string) {
  await getOrCreate(userId);
  return prisma.trustScore.update({
    where: { userId },
    data: { disputesAgainst: { increment: 1 }, score: { decrement: 3 } },
  });
}
