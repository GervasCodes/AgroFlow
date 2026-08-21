// Business logic for the Trust domain (Review + Dispute + TrustScore).
// Not one of the 5 stub services named in this phase, but the Prisma
// models it wires up (Review, Dispute, TrustScore) are exactly the ones
// services/ai reads for match ranking and services/analytics reads for
// the dispute-rate metric -- so it's implemented alongside them here.
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateReviewInput, CreateDisputeInput, ResolveDisputeInput } from "@agroflow/validation";
import {
  disputeRepository,
  purchaseOrderRepository,
  reviewRepository,
  trustScoreRepository,
} from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

async function getOrderAndCounterpartyOrThrow(purchaseOrderId: string, userId: string) {
  const order = await purchaseOrderRepository.findPurchaseOrderById(purchaseOrderId);
  if (!order) throw AppError.notFound("Purchase order not found");

  const isBuyer = order.buyerId === userId;
  const isSeller = order.sellerId === userId;
  if (!isBuyer && !isSeller) throw AppError.forbidden("You are not part of this order");

  const counterpartyId = isBuyer ? order.sellerId : order.buyerId;
  return { order, counterpartyId };
}

export async function createReview(user: AuthenticatedUser, input: CreateReviewInput) {
  const { counterpartyId } = await getOrderAndCounterpartyOrThrow(input.purchaseOrderId, user.id);

  const existing = await reviewRepository.findReviewByOrderAndAuthor(input.purchaseOrderId, user.id);
  if (existing) throw AppError.conflict("You already reviewed this order");

  const review = await reviewRepository.createReview({
    purchaseOrderId: input.purchaseOrderId,
    authorId: user.id,
    subjectId: counterpartyId,
    rating: input.rating,
    comment: input.comment,
  });

  await trustScoreRepository.recordCompletedOrder(counterpartyId);
  return review;
}

export function listReviewsForUser(userId: string) {
  return reviewRepository.findReviewsForSubject(userId);
}

export async function createDispute(user: AuthenticatedUser, input: CreateDisputeInput) {
  const { order } = await getOrderAndCounterpartyOrThrow(input.purchaseOrderId, user.id);

  const dispute = await disputeRepository.createDispute({
    purchaseOrderId: input.purchaseOrderId,
    raisedById: user.id,
    reason: input.reason,
  });

  await purchaseOrderRepository.updateStatus(order.id, "DISPUTED");
  await trustScoreRepository.recordDisputeFiled(user.id);

  const against = order.buyerId === user.id ? order.sellerId : order.buyerId;
  await trustScoreRepository.recordDisputeAgainst(against);

  return dispute;
}

export function listMyDisputes(userId: string) {
  return disputeRepository.findDisputesRaisedBy(userId);
}

export function listOpenDisputes() {
  return disputeRepository.findOpenDisputes();
}

export async function resolveDispute(admin: AuthenticatedUser, disputeId: string, input: ResolveDisputeInput) {
  const dispute = await disputeRepository.findDisputeById(disputeId);
  if (!dispute) throw AppError.notFound("Dispute not found");
  if (dispute.status === "RESOLVED" || dispute.status === "DISMISSED") {
    throw AppError.conflict(`This dispute has already been ${dispute.status.toLowerCase()}`);
  }

  return disputeRepository.resolveDispute({
    id: disputeId,
    status: input.status,
    resolutionNotes: input.resolutionNotes,
    resolvedById: admin.id,
  });
}
