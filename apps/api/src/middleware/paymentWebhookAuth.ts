// Trust boundary for the mobile money webhook receiver -- same
// shared-secret pattern as middleware/channelAuth.ts (a real gateway
// isn't an end user with a JWT), but a SEPARATE secret
// (PAYMENT_GATEWAY_API_KEY) since a payment webhook and a USSD gateway
// are different trust domains with different blast radii if leaked.
import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getEnv } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

export function requirePaymentWebhookSecret(req: Request, _res: Response, next: NextFunction) {
  const env = getEnv();
  if (!env.PAYMENT_GATEWAY_API_KEY) {
    return next(AppError.internal("Payment webhook is not configured on this environment"));
  }

  const provided = req.headers["x-payment-webhook-secret"];
  if (typeof provided !== "string") return next(AppError.unauthorized("Missing webhook secret"));

  const expected = Buffer.from(env.PAYMENT_GATEWAY_API_KEY);
  const actual = Buffer.from(provided);
  const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!matches) return next(AppError.unauthorized("Invalid webhook secret"));

  next();
}
