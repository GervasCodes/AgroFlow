// Demand order routes -- mounted under /api/v1/demand-orders.
import { Router } from "express";
import { demandController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createDemandOrderSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const demandRouter = Router();
demandRouter.use(requireAuth);

demandRouter.get("/mine", requireCapability("demand_order", "read"), asyncHandler(demandController.listMine));
demandRouter.post(
  "/",
  requireCapability("demand_order", "create"),
  validateBody(createDemandOrderSchema),
  asyncHandler(demandController.create),
);
demandRouter.get("/:id", requireCapability("demand_order", "read"), asyncHandler(demandController.getOne));
