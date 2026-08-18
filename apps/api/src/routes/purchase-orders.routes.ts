// Purchase order routes -- mounted under /api/v1/purchase-orders.
// Read-only this phase (see services/purchase-orders).
import { Router } from "express";
import { purchaseOrdersController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const purchaseOrdersRouter = Router();
purchaseOrdersRouter.use(requireAuth);

purchaseOrdersRouter.get(
  "/as-buyer",
  requireCapability("purchase_order", "read"),
  asyncHandler(purchaseOrdersController.listAsBuyer),
);
purchaseOrdersRouter.get(
  "/as-seller",
  requireCapability("purchase_order", "read"),
  asyncHandler(purchaseOrdersController.listAsSeller),
);
