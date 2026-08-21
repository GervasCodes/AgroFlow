import type { Request, Response } from "express";
import * as paymentsService from "../services/payments/index.js";
import { mobileMoneyGateway } from "../integrations/mobile-money/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await paymentsService.listMyPayments(req.user!));
}

export async function initiate(req: Request, res: Response) {
  ok(res, await paymentsService.initiatePayment(req.user!, req.body), 201);
}

/** Legacy/manual webhook target -- authenticated by
 * requirePaymentWebhookSecret, NOT requireAuth, so there is no req.user
 * here (see routes/payments.routes.ts). Kept for internal testing; the
 * real AzamPay callback lands on `webhookFromGateway` below instead. */
export async function webhook(req: Request, res: Response) {
  const { paymentId, status, providerReference } = req.body as {
    paymentId: string;
    status: "CONFIRMED" | "FAILED";
    providerReference?: string;
  };

  if (status === "CONFIRMED") {
    ok(res, await paymentsService.confirmPayment(paymentId, providerReference ?? ""));
  } else {
    ok(res, await paymentsService.failPayment(paymentId));
  }
}

/** Real AzamPay webhook target -- authenticated by
 * requireMobileMoneySignature (HMAC over the raw body), NOT requireAuth
 * or the static shared secret above. */
export async function webhookFromGateway(req: Request, res: Response) {
  const event = mobileMoneyGateway.parseWebhookPayload(req.body as Record<string, unknown>);
  ok(res, await paymentsService.confirmPaymentFromWebhook(event));
}
