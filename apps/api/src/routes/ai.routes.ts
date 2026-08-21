// AI routes -- mounted under /api/v1/ai. Ownership of the demand order
// is checked in services/ai; no dedicated "ai" resource in the
// permission matrix (demand_order:read is the relevant capability).
import { Router } from "express";
import { aiController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const aiRouter: Router = Router();
aiRouter.use(requireAuth);

aiRouter.get(
  "/recommendations/:demandOrderId",
  requireCapability("demand_order", "read"),
  asyncHandler(aiController.recommendations),
);
