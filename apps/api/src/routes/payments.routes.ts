// Payment routes -- mounted under /api/v1/payments. The webhook route
// uses a SEPARATE trust boundary (requirePaymentWebhookSecret, not
// requireAuth) since it's called by a payment gateway, not a
// logged-in user -- see middleware/paymentWebhookAuth.ts.
import { Router } from "express";
import { paymentsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { requirePaymentWebhookSecret } from "../middleware/paymentWebhookAuth.js";
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
