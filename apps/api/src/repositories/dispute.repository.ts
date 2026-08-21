// Data-access for Dispute (Trust domain).
import { prisma } from "../lib/prisma.js";
import type { DisputeStatus } from "@prisma/client";

export function findDisputeById(id: string) {
  return prisma.dispute.findUnique({ where: { id } });
}

export function findDisputesForPurchaseOrder(purchaseOrderId: string) {
  return prisma.dispute.findMany({ where: { purchaseOrderId }, orderBy: { createdAt: "desc" } });
}

export function findDisputesRaisedBy(userId: string) {
  return prisma.dispute.findMany({ where: { raisedById: userId }, orderBy: { createdAt: "desc" } });
}

export function findOpenDisputes() {
  return prisma.dispute.findMany({
    where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "asc" },
  });
}

export function createDispute(input: { purchaseOrderId: string; raisedById: string; reason: string }) {
  return prisma.dispute.create({ data: input });
}

export function resolveDispute(input: {
  id: string;
  status: Extract<DisputeStatus, "RESOLVED" | "DISMISSED">;
  resolutionNotes?: string;
  resolvedById: string;
}) {
  return prisma.dispute.update({
    where: { id: input.id },
    data: {
      status: input.status,
      resolutionNotes: input.resolutionNotes,
      resolvedById: input.resolvedById,
      resolvedAt: new Date(),
    },
  });
}
