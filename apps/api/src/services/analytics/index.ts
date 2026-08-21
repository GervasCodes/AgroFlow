// Business logic for the Analytics domain: read-only aggregates for the
// Phase 5 Analytics/Reports dashboard (channel-mix, price trends,
// dispute rate). Pure reads over existing tables plus Dispute -- see
// repositories/analytics.repository.ts.
import { analyticsRepository, cropRepository } from "../../repositories/index.js";

export async function getChannelMix() {
  const rows = await analyticsRepository.channelMix();
  return rows.map((row) => ({ channel: row.createdByChannel, listingCount: row._count._all }));
}

export async function getPriceTrends() {
  const [rows, crops] = await Promise.all([analyticsRepository.priceTrendsByCrop(), cropRepository.findAllCrops()]);
  const cropById = new Map(crops.map((c) => [c.id, c.name]));

  return rows.map((row) => ({
    crop: cropById.get(row.cropId) ?? row.cropId,
    averagePricePerUnit: row._avg.pricePerUnit,
    listingCount: row._count._all,
  }));
}

export async function getDisputeRate() {
  const { totalOrders, totalDisputes } = await analyticsRepository.disputeRate();
  return {
    totalOrders,
    totalDisputes,
    disputeRate: totalOrders === 0 ? 0 : totalDisputes / totalOrders,
  };
}
