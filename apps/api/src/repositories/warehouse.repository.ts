// Data-access for Warehouse (Storage domain).
import { prisma } from "../lib/prisma.js";

export function findWarehousesByOwner(ownerId: string) {
  return prisma.warehouse.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
}

export function findAllWarehouses(filters: { regionId?: string }) {
  return prisma.warehouse.findMany({
    where: filters.regionId ? { regionId: filters.regionId } : undefined,
    orderBy: { name: "asc" },
  });
}

export function findWarehouseById(id: string) {
  return prisma.warehouse.findUnique({ where: { id } });
}

export function createWarehouse(input: {
  ownerId: string;
  name: string;
  regionId: string;
  district?: string;
  address?: string;
  capacityTonnes?: number;
}) {
  return prisma.warehouse.create({ data: input });
}

export function updateUtilization(id: string, currentUtilization: number) {
  return prisma.warehouse.update({ where: { id }, data: { currentUtilization } });
}
