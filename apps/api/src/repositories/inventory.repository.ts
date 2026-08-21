// Data-access for Inventory (Aggregation domain).
import { prisma } from "../lib/prisma.js";

const include = { crop: true, warehouse: true } as const;

export function findInventoryByOwner(ownerId: string) {
  return prisma.inventory.findMany({ where: { ownerId }, include, orderBy: { createdAt: "desc" } });
}

export function findInventoryById(id: string) {
  return prisma.inventory.findUnique({ where: { id }, include });
}

export function createInventory(input: {
  ownerId: string;
  cropId: string;
  quantity: number;
  unit: string;
  warehouseId?: string;
}) {
  return prisma.inventory.create({ data: input, include });
}

export function updateInventoryQuantity(id: string, quantity: number) {
  return prisma.inventory.update({ where: { id }, data: { quantity }, include });
}
