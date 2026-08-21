// Data-access for StorageBooking (Logistics/Storage domain).
import { prisma } from "../lib/prisma.js";

const include = { warehouse: true } as const;

export function findBookingsByUser(bookedById: string) {
  return prisma.storageBooking.findMany({ where: { bookedById }, include, orderBy: { startDate: "desc" } });
}

export function findBookingsByWarehouse(warehouseId: string) {
  return prisma.storageBooking.findMany({ where: { warehouseId }, include, orderBy: { startDate: "desc" } });
}

export function findBookingById(id: string) {
  return prisma.storageBooking.findUnique({ where: { id }, include });
}

export function createBooking(input: {
  warehouseId: string;
  bookedById: string;
  purchaseOrderId?: string;
  quantityTonnes: number;
  startDate: Date;
  endDate?: Date;
}) {
  return prisma.storageBooking.create({ data: input, include });
}
