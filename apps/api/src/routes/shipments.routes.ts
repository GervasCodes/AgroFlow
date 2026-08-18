// Shipment routes -- mounted under /api/v1/shipments.
import { Router } from "express";
import { shipmentsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, requestShipmentSchema, updateShipmentStatusSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const shipmentsRouter = Router();
shipmentsRouter.use(requireAuth);

shipmentsRouter.get("/available", requireCapability("shipment", "read"), asyncHandler(shipmentsController.listAvailable));
shipmentsRouter.get("/as-buyer", requireCapability("shipment", "read"), asyncHandler(shipmentsController.listAsBuyer));
shipmentsRouter.get(
  "/as-transporter",
  requireCapability("shipment", "read"),
  asyncHandler(shipmentsController.listAsTransporter),
);
shipmentsRouter.post(
  "/",
  requireCapability("shipment", "create"),
  validateBody(requestShipmentSchema),
  asyncHandler(shipmentsController.request),
);
shipmentsRouter.post("/:id/claim", requireCapability("shipment", "update"), asyncHandler(shipmentsController.claim));
shipmentsRouter.post(
  "/:id/status",
  requireCapability("shipment", "update"),
  validateBody(updateShipmentStatusSchema),
  asyncHandler(shipmentsController.updateStatus),
);
