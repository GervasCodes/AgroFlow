// Business logic for the "payments" domain. Provider-agnostic by
// design (see database/prisma/schema.prisma's FINANCE section): NO live
// AzamPay/Selcom/MalipoPay API call happens in initiatePayment() --  it
// only records intent and returns instructions for the buyer to
// complete the mobile money prompt on their phone, matching how STK-push
// mobile money flows actually feel to the end user in Tanzania. Real
// integration later means adding one outbound API call here per
// provider; confirmWebhook() and the schema don't need to change.
import type { AuthenticatedUser } from "@agroflow/types";
import type { InitiatePaymentInput } from "@agroflow/validation";
import { paymentRepository, purchaseOrderRepository, userRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";
import { notify } from "../notifications/index.js";

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

  return {
    payment,
    // No live gateway call is made -- this instruction mirrors the
    // real STK-push UX (a prompt appears on the payer's phone) so the
    // web/mobile UI has something honest to show while a real provider
    // integration isn't wired up yet.
    instructions: `Check your phone for a payment prompt from ${input.provider.replaceAll("_", " ")}, or dial the provider's USSD code to complete payment.`,
  };
}

/** Called by the generic webhook receiver (requirePaymentWebhookSecret
 * gates the route) once a real gateway is wired up to POST here on
 * payment confirmation. Marks the payment CONFIRMED and the linked
 * PurchaseOrder PAID. */
export async function confirmPayment(paymentId: string, providerReference: string) {
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

export async function failPayment(paymentId: string) {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) throw AppError.notFound("Payment not found");
  return paymentRepository.markFailed(paymentId);
}
