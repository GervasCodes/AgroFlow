// Data-access for Shipment (Logistics domain).
import { prisma } from "../lib/prisma.js";

const include = {
  purchaseOrder: { select: { id: true, buyerId: true, sellerId: true, totalAmount: true, currency: true } },
  transporter: { select: { id: true, fullName: true, phoneNumber: true } },
} as const;

export function findShipmentById(id: string) {
  return prisma.shipment.findUnique({ where: { id }, include });
}

export function findShipmentByPurchaseOrder(purchaseOrderId: string) {
  return prisma.shipment.findUnique({ where: { purchaseOrderId }, include });
}

/** Unclaimed jobs any transporter can pick up. */
export function findAvailableShipments() {
  return prisma.shipment.findMany({
    where: { status: "PENDING_PICKUP", transporterId: null },
    include,
    orderBy: { createdAt: "asc" },
  });
}

export function findShipmentsForBuyer(buyerId: string) {
  return prisma.shipment.findMany({
    where: { purchaseOrder: { buyerId } },
    include,
    orderBy: { createdAt: "desc" },
  });
}

export function findShipmentsForTransporter(transporterId: string) {
  return prisma.shipment.findMany({
    where: { transporterId },
    include,
    orderBy: { createdAt: "desc" },
  });
}

export function createShipment(input: { purchaseOrderId: string; deliveryLocation: string }) {
  return prisma.shipment.create({ data: input, include });
}

export function assignTransporter(id: string, transporterId: string) {
  return prisma.shipment.update({
    where: { id },
    data: { transporterId, status: "ASSIGNED" },
    include,
  });
}

export function updateStatus(id: string, status: string, extra: { pickedUpAt?: Date; deliveredAt?: Date } = {}) {
  return prisma.shipment.update({ where: { id }, data: { status, ...extra }, include });
}
