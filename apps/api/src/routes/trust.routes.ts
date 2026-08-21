// Trust routes -- mounted under /api/v1/reviews and /api/v1/disputes.
import { Router } from "express";
import { trustController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createReviewSchema, createDisputeSchema, resolveDisputeSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reviewsRouter: Router = Router();
reviewsRouter.use(requireAuth);

reviewsRouter.post(
  "/",
  requireCapability("review", "create"),
  validateBody(createReviewSchema),
  asyncHandler(trustController.createReview),
);
reviewsRouter.get(
  "/user/:userId",
  requireCapability("review", "read"),
  asyncHandler(trustController.listReviewsForUser),
);

export const disputesRouter: Router = Router();
disputesRouter.use(requireAuth);

disputesRouter.post(
  "/",
  requireCapability("dispute", "create"),
  validateBody(createDisputeSchema),
  asyncHandler(trustController.createDispute),
);
disputesRouter.get("/mine", requireCapability("dispute", "read"), asyncHandler(trustController.listMine));
// Admin-only: reviewing open disputes.
disputesRouter.get("/", requireCapability("dispute", "approve"), asyncHandler(trustController.listOpen));
disputesRouter.post(
  "/:id/resolve",
  requireCapability("dispute", "approve"),
  validateBody(resolveDisputeSchema),
  asyncHandler(trustController.resolve),
);
