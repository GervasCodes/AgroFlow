// Data-access for PaymentTransaction (Finance domain) -- the log of
// every gateway interaction (initiation + callback + reversal) under a
// Payment. findByProviderReference is what the webhook handler uses for
// idempotency: if a CALLBACK with this providerReference is already
// recorded, the webhook has already been processed and is safely
// skipped rather than re-applied.
import { prisma } from "../lib/prisma.js";
import type { PaymentTransactionType, PaymentStatus } from "@prisma/client";

export function recordTransaction(input: {
  paymentId: string;
  type: PaymentTransactionType;
  status: PaymentStatus;
  providerReference?: string;
  rawPayload?: unknown;
}) {
  return prisma.paymentTransaction.create({
    data: {
      paymentId: input.paymentId,
      type: input.type,
      status: input.status,
      providerReference: input.providerReference,
      rawPayload: input.rawPayload as never,
    },
  });
}

export function findCallbackByProviderReference(providerReference: string) {
  return prisma.paymentTransaction.findFirst({
    where: { providerReference, type: "CALLBACK" },
  });
}

export function findTransactionsForPayment(paymentId: string) {
  return prisma.paymentTransaction.findMany({
    where: { paymentId },
    orderBy: { createdAt: "desc" },
  });
}
