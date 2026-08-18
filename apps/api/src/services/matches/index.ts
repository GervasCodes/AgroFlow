// Business logic for the "matches" domain -- the core Marketplace loop:
// a buyer proposes a match against a published listing, the listing's
// farm owner approves or rejects it, and approval automatically creates
// a PurchaseOrder. Two different ownership checks apply depending on
// the action: only the DEMAND side (buyer) may propose; only the SUPPLY
// side (farm owner) may approve/reject.
import type { AuthenticatedUser } from "@agroflow/types";
import type { ProposeMatchInput } from "@agroflow/validation";
import {
  demandOrderRepository,
  matchRepository,
  produceListingRepository,
  purchaseOrderRepository,
  userRepository,
} from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";
import { notify } from "../notifications/index.js";

export function listMatchesAsBuyer(user: AuthenticatedUser) {
  return matchRepository.findMatchesForBuyer(user.id);
}

export function listMatchesAsSeller(user: AuthenticatedUser) {
  return matchRepository.findMatchesForSeller(user.id);
}

export async function proposeMatch(user: AuthenticatedUser, input: ProposeMatchInput) {
  const demandOrder = await demandOrderRepository.findDemandOrderById(input.demandOrderId);
  if (!demandOrder) throw AppError.notFound("Demand order not found");
  if (demandOrder.buyerId !== user.id) {
    throw AppError.forbidden("You can only propose matches for your own demand orders");
  }
  if (demandOrder.status !== "OPEN") {
    throw AppError.conflict(`Demand order is ${demandOrder.status.toLowerCase()}, not open`);
  }

  const listing = await produceListingRepository.findListingById(input.produceListingId);
  if (!listing) throw AppError.notFound("Produce listing not found");
  if (listing.status !== "PUBLISHED") {
    throw AppError.conflict(`Listing is ${listing.status.toLowerCase()}, not published`);
  }
  if (listing.cropId !== demandOrder.cropId) {
    throw AppError.badRequest("Listing crop does not match the demand order's crop");
  }

  const created = await matchRepository.createMatch({
    demandOrderId: input.demandOrderId,
    produceListingId: input.produceListingId,
    matchedQuantity: input.matchedQuantity,
    proposedPricePerUnit: input.proposedPricePerUnit,
  });

  const seller = await userRepository.findUserById(listing.farm.ownerId);
  if (seller) {
    notify({
      phoneNumber: seller.phoneNumber,
      type: "match_proposed",
      data: { cropLabel: listing.crop.name, quantity: input.matchedQuantity, unit: listing.unit },
    });
  }

  return created;
}

async function assertSellerOwnsMatch(user: AuthenticatedUser, matchId: string) {
  const match = await matchRepository.findMatchById(matchId);
  if (!match) throw AppError.notFound("Match not found");
  if (match.produceListing.farm.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only respond to matches on your own listings");
  }
  if (match.status !== "PROPOSED") {
    throw AppError.conflict(`Match is already ${match.status.toLowerCase()}`);
  }
  return match;
}

export async function approveMatch(user: AuthenticatedUser, matchId: string) {
  const match = await assertSellerOwnsMatch(user, matchId);

  const pricePerUnit = match.proposedPricePerUnit ?? match.produceListing.pricePerUnit;
  if (!pricePerUnit) {
    throw AppError.badRequest("This match has no agreed price -- propose a price before approving");
  }

  const updated = await matchRepository.updateMatchStatus(matchId, "ACCEPTED");
  await produceListingRepository.updateListingStatus(match.produceListingId, "MATCHED");
  await demandOrderRepository.updateDemandOrderStatus(match.demandOrderId, "MATCHED");

  const purchaseOrder = await purchaseOrderRepository.createPurchaseOrder({
    matchId,
    buyerId: match.demandOrder.buyerId,
    sellerId: match.produceListing.farm.ownerId,
    totalAmount: pricePerUnit * match.matchedQuantity,
    item: {
      produceListingId: match.produceListingId,
      quantity: match.matchedQuantity,
      unit: match.produceListing.unit,
      pricePerUnit,
      subtotal: pricePerUnit * match.matchedQuantity,
    },
  });

  const buyer = await userRepository.findUserById(match.demandOrder.buyerId);
  if (buyer) {
    notify({
      phoneNumber: buyer.phoneNumber,
      type: "match_approved",
      data: { cropLabel: match.produceListing.crop.name, quantity: match.matchedQuantity, unit: match.produceListing.unit },
    });
  }

  return { match: updated, purchaseOrder };
}

export async function rejectMatch(user: AuthenticatedUser, matchId: string) {
  await assertSellerOwnsMatch(user, matchId);
  return matchRepository.updateMatchStatus(matchId, "REJECTED");
}
