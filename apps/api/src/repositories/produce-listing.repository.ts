// Data-access for ProduceListing records (Agriculture domain). Public
// browsing (for buyers/aggregators) only ever sees PUBLISHED listings;
// an owner sees all statuses for their own farms.
import { prisma } from "../lib/prisma.js";
import type { ProduceListingStatus } from "@prisma/client";

const listingInclude = {
  crop: true,
  farm: { select: { id: true, name: true, regionId: true, ownerId: true } },
} as const;

export function findListingsByFarmOwner(ownerId: string) {
  return prisma.produceListing.findMany({
    where: { farm: { ownerId } },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function findListingById(id: string) {
  return prisma.produceListing.findUnique({ where: { id }, include: listingInclude });
}

export function findPublishedListings(filters: { cropId?: string; regionId?: string }) {
  return prisma.produceListing.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.regionId ? { farm: { regionId: filters.regionId } } : {}),
    },
    include: listingInclude,
    orderBy: { availableFrom: "asc" },
  });
}

export function createListing(input: {
  farmId: string;
  cropId: string;
  quantity: number;
  unit: string;
  qualityGrade?: string;
  pricePerUnit?: number;
  availableFrom: Date;
  images?: string[];
  createdByChannel?: string;
}) {
  return prisma.produceListing.create({ data: input, include: listingInclude });
}

export function updateListingStatus(id: string, status: ProduceListingStatus) {
  return prisma.produceListing.update({ where: { id }, data: { status }, include: listingInclude });
}

export function updateListingQualityGrade(id: string, qualityGrade: string) {
  return prisma.produceListing.update({ where: { id }, data: { qualityGrade }, include: listingInclude });
}
