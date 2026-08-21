// Payment routes -- mounted under /api/v1/payments. Two DIFFERENT
// webhook routes, two DIFFERENT trust boundaries:
//   - POST /webhook: static shared secret (requirePaymentWebhookSecret),
//     kept for internal/manual testing.
//   - POST /webhook/mobile-money: the REAL AzamPay callback target,
//     authenticated by HMAC signature verification
//     (requireMobileMoneySignature) over the raw request body -- see
//     middleware/mobileMoneySignature.ts and integrations/mobile-money.
// Neither uses requireAuth -- a payment gateway isn't a logged-in user.
import { Router } from "express";
import { paymentsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { requirePaymentWebhookSecret } from "../middleware/paymentWebhookAuth.js";
import { requireMobileMoneySignature } from "../middleware/mobileMoneySignature.js";
import { validateBody, initiatePaymentSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const paymentsRouter : Router = Router();

paymentsRouter.get(
  "/mine",
  requireAuth,
  requireCapability("payment", "read"),
  asyncHandler(paymentsController.listMine),
);
paymentsRouter.post(
  "/",
  requireAuth,
  requireCapability("payment", "create"),
  validateBody(initiatePaymentSchema),
  asyncHandler(paymentsController.initiate),
);
paymentsRouter.post("/webhook", requirePaymentWebhookSecret, asyncHandler(paymentsController.webhook));
paymentsRouter.post(
  "/webhook/mobile-money",
  requireMobileMoneySignature,
  asyncHandler(paymentsController.webhookFromGateway),
);
