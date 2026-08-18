// Data-access for DemandOrder (Marketplace domain).
import { prisma } from "../lib/prisma.js";

const include = { crop: true } as const;

export function findDemandOrdersByBuyer(buyerId: string) {
  return prisma.demandOrder.findMany({
    where: { buyerId },
    include,
    orderBy: { createdAt: "desc" },
  });
}

export function findDemandOrderById(id: string) {
  return prisma.demandOrder.findUnique({ where: { id }, include });
}

export function createDemandOrder(input: {
  buyerId: string;
  cropId: string;
  quantity: number;
  unit: string;
  qualityGrade?: string;
  maxPricePerUnit?: number;
  regionId?: string;
  neededBy: Date;
}) {
  return prisma.demandOrder.create({ data: input, include });
}

export function updateDemandOrderStatus(id: string, status: string) {
  return prisma.demandOrder.update({ where: { id }, data: { status }, include });
}
