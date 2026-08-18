// Quality inspection routes -- mounted under /api/v1/quality-inspections.
import { Router } from "express";
import { qualityController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createQualityInspectionSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const qualityRouter = Router();
qualityRouter.use(requireAuth);

qualityRouter.get(
  "/listing/:listingId",
  requireCapability("quality_inspection", "read"),
  asyncHandler(qualityController.listForListing),
);
qualityRouter.post(
  "/",
  requireCapability("quality_inspection", "create"),
  validateBody(createQualityInspectionSchema),
  asyncHandler(qualityController.create),
);
