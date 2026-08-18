// Data-access for Farm records (Agriculture domain).
import { prisma } from "../lib/prisma.js";

export function findFarmsByOwner(ownerId: string) {
  return prisma.farm.findMany({
    where: { ownerId },
    include: { farmCrops: { include: { crop: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findFarmById(id: string) {
  return prisma.farm.findUnique({
    where: { id },
    include: { farmCrops: { include: { crop: true } } },
  });
}

export function createFarm(input: {
  ownerId: string;
  name: string;
  regionId: string;
  district?: string;
  ward?: string;
  village?: string;
  sizeHectares?: number;
}) {
  return prisma.farm.create({ data: input });
}

export function updateFarm(
  id: string,
  input: Partial<{ name: string; district: string; ward: string; village: string; sizeHectares: number }>,
) {
  return prisma.farm.update({ where: { id }, data: input });
}
