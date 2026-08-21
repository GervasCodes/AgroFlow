// Business logic for the "payments" domain. initiatePayment() now makes
// a real outbound call to the mobile-money gateway (see
// integrations/mobile-money) instead of only recording intent -- see
// that file for why AzamPay was chosen and its fallback-to-log behaviour
// when unconfigured. confirmPayment() (internal/manual) and
// confirmPaymentFromWebhook() (real gateway callback, signature-verified
// + idempotent) both end at the same PAID transition so the rest of the
// system doesn't care which path a given payment took.
import type { AuthenticatedUser } from "@agroflow/types";
import type { InitiatePaymentInput } from "@agroflow/validation";
import {
  paymentRepository,
  paymentTransactionRepository,
  purchaseOrderRepository,
  userRepository,
} from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";
import { notify } from "../notifications/index.js";
import { mobileMoneyGateway, type WebhookEvent } from "../../integrations/mobile-money/index.js";

export function listMyPayments(user: AuthenticatedUser) {
  return paymentRepository.findPaymentsForPayer(user.id);
}

export async function initiatePayment(user: AuthenticatedUser, input: InitiatePaymentInput) {
  const order = await purchaseOrderRepository.findPurchaseOrderById(input.purchaseOrderId);
  if (!order) throw AppError.notFound("Purchase order not found");
  if (order.buyerId !== user.id) throw AppError.forbidden("You can only pay for your own purchase orders");

  const existing = await paymentRepository.findPaymentByPurchaseOrder(input.purchaseOrderId);
  if (existing && existing.status !== "FAILED") {
    throw AppError.conflict(`This order already has a ${existing.status.toLowerCase()} payment`);
  }

  const payment = await paymentRepository.createPayment({
    purchaseOrderId: input.purchaseOrderId,
    payerId: user.id,
    amount: order.totalAmount,
    currency: order.currency,
    provider: input.provider,
  });

  // payment.id doubles as the idempotency key AzamPay is given
  // (externalId) -- a retried initiate() for the same Payment can never
  // create two charges on their side.
  const charge = await mobileMoneyGateway.initiateCharge({
    provider: input.provider,
    amount: payment.amount,
    currency: payment.currency,
    phoneNumber: user.phoneNumber,
    externalId: payment.id,
  });

  await paymentTransactionRepository.recordTransaction({
    paymentId: payment.id,
    type: "INITIATION",
    status: charge.status === "FAILED" ? "FAILED" : "PENDING",
    providerReference: charge.providerReference,
    rawPayload: charge.rawResponse,
  });

  if (charge.status === "FAILED") {
    const failed = await paymentRepository.markFailed(payment.id);
    return {
      payment: failed,
      instructions: "We couldn't start the payment with your provider. Please try again.",
    };
  }

  if (charge.providerReference) {
    await paymentRepository.setProviderReference(payment.id, charge.providerReference);
  }

  return {
    payment,
    // Mirrors the real STK-push UX (a prompt appears on the payer's
    // phone) -- honest whether the gateway is live or (in dev, when
    // AzamPay isn't configured) simulated.
    instructions: `Check your phone for a payment prompt from ${input.provider.replaceAll("_", " ")}, or dial the provider's USSD code to complete payment.`,
  };
}

async function applyConfirmation(paymentId: string, providerReference: string) {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) throw AppError.notFound("Payment not found");
  if (payment.status === "CONFIRMED") return payment; // idempotent

  const confirmed = await paymentRepository.markConfirmed(paymentId, providerReference);
  const order = await purchaseOrderRepository.updateStatus(payment.purchaseOrderId, "PAID");

  const seller = await userRepository.findUserById(order.sellerId);
  if (seller) {
    notify({
      phoneNumber: seller.phoneNumber,
      type: "payment_confirmed",
      data: { amount: payment.amount, currency: payment.currency },
    });
  }

  return confirmed;
}

/** Manual/internal confirmation path -- gated by requirePaymentWebhookSecret
 * (see routes/payments.routes.ts), used for testing or a gateway that
 * hasn't been given real signature verification yet. */
export async function confirmPayment(paymentId: string, providerReference: string) {
  return applyConfirmation(paymentId, providerReference);
}

export async function failPayment(paymentId: string) {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) throw AppError.notFound("Payment not found");
  return paymentRepository.markFailed(paymentId);
}

/** Real AzamPay webhook path -- signature already verified by
 * middleware/mobileMoneySignature.ts before this runs. Idempotent via
 * PaymentTransaction: a providerReference we've already recorded a
 * CALLBACK for is not reprocessed, so a retried/duplicated webhook
 * delivery (gateways retry aggressively) can never double-apply. */
export async function confirmPaymentFromWebhook(event: WebhookEvent) {
  const alreadyProcessed = await paymentTransactionRepository.findCallbackByProviderReference(
    event.providerReference,
  );
  if (alreadyProcessed) return { deduplicated: true };

  // externalId is the Payment.id we sent as AzamPay's externalId at
  // initiation time (see initiatePayment above).
  const payment = await paymentRepository.findPaymentById(event.externalId);
  if (!payment) throw AppError.notFound("Payment not found for this webhook's externalId");

  await paymentTransactionRepository.recordTransaction({
    paymentId: payment.id,
    type: "CALLBACK",
    status: event.status === "CONFIRMED" ? "CONFIRMED" : "FAILED",
    providerReference: event.providerReference,
    rawPayload: event.rawPayload,
  });

  if (event.status === "CONFIRMED") {
    return { deduplicated: false, payment: await applyConfirmation(payment.id, event.providerReference) };
  }

  return { deduplicated: false, payment: await paymentRepository.markFailed(payment.id) };
}
