// Aggregation routes -- mounted under /api/v1/inventory.
import { Router } from "express";
import { aggregationController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createInventorySchema, updateInventorySchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const aggregationRouter: Router = Router();
aggregationRouter.use(requireAuth);

aggregationRouter.post(
  "/",
  requireCapability("inventory", "create"),
  validateBody(createInventorySchema),
  asyncHandler(aggregationController.create),
);
aggregationRouter.get("/mine", requireCapability("inventory", "read"), asyncHandler(aggregationController.listMine));
aggregationRouter.patch(
  "/:id",
  requireCapability("inventory", "update"),
  validateBody(updateInventorySchema),
  asyncHandler(aggregationController.updateQuantity),
);
