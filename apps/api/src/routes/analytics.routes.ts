// Analytics routes -- mounted under /api/v1/analytics. Reporting for
// desk roles (see DESK_ROLES in @agroflow/config); read-only aggregates,
// no dedicated "analytics" resource in the permission matrix.
import { Router } from "express";
import { analyticsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { DESK_ROLES } from "@agroflow/config";
import { asyncHandler } from "../utils/asyncHandler.js";

export const analyticsRouter: Router = Router();
analyticsRouter.use(requireAuth, requireRole(...DESK_ROLES));

analyticsRouter.get("/channel-mix", asyncHandler(analyticsController.channelMix));
analyticsRouter.get("/price-trends", asyncHandler(analyticsController.priceTrends));
analyticsRouter.get("/dispute-rate", asyncHandler(analyticsController.disputeRate));
