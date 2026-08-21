// Trust boundary for the REAL mobile-money gateway webhook (as opposed
// to routes/payments.routes.ts's older POST /payments/webhook, which
// uses a static shared secret for manual/internal testing). AzamPay
// calls this endpoint directly from the internet, so it's authenticated
// by verifying their HMAC signature over the exact raw request bytes --
// see app.ts's express.json({ verify }) for how req.rawBody is
// populated, and integrations/mobile-money's verifyWebhookSignature for
// the HMAC check itself.
import type { NextFunction, Request, Response } from "express";
import { mobileMoneyGateway } from "../integrations/mobile-money/index.js";
import { AppError } from "../utils/AppError.js";

export function requireMobileMoneySignature(req: Request, _res: Response, next: NextFunction) {
  const signature = req.headers["x-azampay-signature"];
  const rawBody = req.rawBody;

  if (!rawBody) {
    return next(AppError.internal("Raw request body was not captured for signature verification"));
  }
  if (typeof signature !== "string") {
    return next(AppError.unauthorized("Missing webhook signature"));
  }
  if (!mobileMoneyGateway.verifyWebhookSignature(rawBody, signature)) {
    return next(AppError.unauthorized("Invalid webhook signature"));
  }

  next();
}
