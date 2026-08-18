// Data-access for Payment (Finance domain).
import { prisma } from "../lib/prisma.js";

export function findPaymentByPurchaseOrder(purchaseOrderId: string) {
  return prisma.payment.findUnique({ where: { purchaseOrderId } });
}

export function findPaymentById(id: string) {
  return prisma.payment.findUnique({ where: { id } });
}

export function findPaymentsForPayer(payerId: string) {
  return prisma.payment.findMany({ where: { payerId }, orderBy: { createdAt: "desc" } });
}

export function createPayment(input: {
  purchaseOrderId: string;
  payerId: string;
  amount: number;
  currency: string;
  provider: string;
}) {
  return prisma.payment.create({ data: input });
}

export function markConfirmed(id: string, providerReference: string) {
  return prisma.payment.update({
    where: { id },
    data: { status: "CONFIRMED", providerReference, confirmedAt: new Date() },
  });
}

export function markFailed(id: string) {
  return prisma.payment.update({ where: { id }, data: { status: "FAILED" } });
}
