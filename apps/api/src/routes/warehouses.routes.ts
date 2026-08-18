// Warehouse routes -- mounted under /api/v1/warehouses.
import { Router } from "express";
import { warehousesController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createWarehouseSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const warehousesRouter : Router = Router();
warehousesRouter.use(requireAuth);

warehousesRouter.get("/", requireCapability("warehouse", "read"), asyncHandler(warehousesController.browse));
warehousesRouter.get("/mine", requireCapability("warehouse", "read"), asyncHandler(warehousesController.listMine));
warehousesRouter.post(
  "/",
  requireCapability("warehouse", "create"),
  validateBody(createWarehouseSchema),
  asyncHandler(warehousesController.create),
);
warehousesRouter.post(
  "/:id/utilization",
  requireCapability("warehouse", "update"),
  asyncHandler(warehousesController.updateUtilization),
);
