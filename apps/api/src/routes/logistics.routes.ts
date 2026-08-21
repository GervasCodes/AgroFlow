// Logistics routes -- mounted under /api/v1/logistics. Shipment CRUD
// stays under /shipments (services/shipments); this covers the dispatch
// board aggregate view and StorageBooking.
import { Router } from "express";
import { logisticsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createStorageBookingSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const logisticsRouter: Router = Router();
logisticsRouter.use(requireAuth);

logisticsRouter.get(
  "/dispatch-board",
  requireCapability("shipment", "read"),
  asyncHandler(logisticsController.getDispatchBoard),
);

logisticsRouter.post(
  "/storage-bookings",
  requireCapability("storage_booking", "create"),
  validateBody(createStorageBookingSchema),
  asyncHandler(logisticsController.createStorageBooking),
);
logisticsRouter.get(
  "/storage-bookings/mine",
  requireCapability("storage_booking", "read"),
  asyncHandler(logisticsController.listMine),
);
logisticsRouter.get(
  "/storage-bookings/warehouse/:warehouseId",
  requireCapability("storage_booking", "read"),
  asyncHandler(logisticsController.listForWarehouse),
);
