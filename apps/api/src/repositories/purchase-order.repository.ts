// Data-access for PurchaseOrder + OrderItem (Marketplace domain). A
// PurchaseOrder is only ever created as a side effect of a Match being
// approved (see services/matches -- there is no direct
// purchase-order:create route in this phase).
import { prisma } from "../lib/prisma.js";
import type { PurchaseOrder } from "@prisma/client";

const include = { items: true } as const;

export function findPurchaseOrdersForBuyer(buyerId: string) {
  return prisma.purchaseOrder.findMany({ where: { buyerId }, include, orderBy: { createdAt: "desc" } });
}

export function findPurchaseOrdersForSeller(sellerId: string) {
  return prisma.purchaseOrder.findMany({ where: { sellerId }, include, orderBy: { createdAt: "desc" } });
}

export function findPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({ where: { id }, include });
}

export function updateStatus(id: string, status: PurchaseOrder["status"]) {
  return prisma.purchaseOrder.update({ where: { id }, data: { status }, include });
}

export function createPurchaseOrder(input: {
  matchId: string;
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  item: { produceListingId: string; quantity: number; unit: string; pricePerUnit: number; subtotal: number };
}) {
  return prisma.purchaseOrder.create({
    data: {
      matchId: input.matchId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      totalAmount: input.totalAmount,
      items: { create: [input.item] },
    },
    include,
  });
}
