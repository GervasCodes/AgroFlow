// Business logic for the AI domain: ranks published ProduceListings
// against a buyer's DemandOrder for a "recommended matches" view --
// called only from the backend (no client-side model/keys), same
// pattern as services/payments. Deliberately a transparent, explainable
// scoring function rather than an external model call: crop match is a
// hard filter, then price fit + region match + quality grade + the
// seller's TrustScore each contribute to a 0-100 ranking score.
import type { AuthenticatedUser } from "@agroflow/types";
import { demandOrderRepository, produceListingRepository, trustScoreRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

const QUALITY_GRADE_WEIGHT: Record<string, number> = {
  GRADE_A: 20,
  GRADE_B: 12,
  GRADE_C: 5,
  REJECTED: -30,
};

export async function recommendMatchesForDemandOrder(user: AuthenticatedUser, demandOrderId: string) {
  const demandOrder = await demandOrderRepository.findDemandOrderById(demandOrderId);
  if (!demandOrder) throw AppError.notFound("Demand order not found");
  if (demandOrder.buyerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You do not own this demand order");
  }

  const candidates = await produceListingRepository.findPublishedListings({
    cropId: demandOrder.cropId,
    regionId: demandOrder.regionId ?? undefined,
  });

  const scored = await Promise.all(
    candidates.map(async (listing) => {
      let score = 40; // baseline for matching crop (+ region, if the buyer specified one)

      if (demandOrder.maxPricePerUnit && listing.pricePerUnit) {
        if (listing.pricePerUnit <= demandOrder.maxPricePerUnit) {
          // Reward listings comfortably under budget, cap the bonus at 25.
          const headroom = (demandOrder.maxPricePerUnit - listing.pricePerUnit) / demandOrder.maxPricePerUnit;
          score += Math.min(25, Math.round(headroom * 50));
        } else {
          score -= 20; // over budget, but not disqualifying -- buyer may still want to see it
        }
      }

      if (listing.qualityGrade) {
        score += QUALITY_GRADE_WEIGHT[listing.qualityGrade] ?? 0;
      }

      if (listing.quantity >= demandOrder.quantity) {
        score += 10; // can fulfil the full order in one match
      }

      const trust = await trustScoreRepository.findTrustScoreByUser(listing.farm.ownerId);
      score += Math.round(((trust?.score ?? 50) / 100) * 15);

      return {
        listing,
        score: Math.max(0, Math.min(100, score)),
      };
    }),
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}
