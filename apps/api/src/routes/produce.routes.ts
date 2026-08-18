// Produce listing routes -- mounted under /api/v1/produce-listings.
// GET / (browse published listings) is open to any authenticated user
// with produce_listing:read (buyers/aggregators as well as farmers).
import { Router } from "express";
import { produceController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createProduceListingSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const produceRouter = Router();

produceRouter.use(requireAuth);

produceRouter.get("/", requireCapability("produce_listing", "read"), asyncHandler(produceController.browse));
produceRouter.get(
  "/mine",
  requireCapability("produce_listing", "read"),
  asyncHandler(produceController.listMine),
);
produceRouter.post(
  "/",
  requireCapability("produce_listing", "create"),
  validateBody(createProduceListingSchema),
  asyncHandler(produceController.create),
);
produceRouter.post(
  "/:id/publish",
  requireCapability("produce_listing", "update"),
  asyncHandler(produceController.publish),
);
produceRouter.post(
  "/:id/withdraw",
  requireCapability("produce_listing", "update"),
  asyncHandler(produceController.withdraw),
);
