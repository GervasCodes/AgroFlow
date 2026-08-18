// Farm routes -- mounted under /api/v1/farms.
import { Router } from "express";
import { farmsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, createFarmSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const farmsRouter = Router();

farmsRouter.use(requireAuth);

farmsRouter.get("/mine", requireCapability("farm", "read"), asyncHandler(farmsController.listMine));
farmsRouter.post(
  "/",
  requireCapability("farm", "create"),
  validateBody(createFarmSchema),
  asyncHandler(farmsController.create),
);
farmsRouter.get("/:id", requireCapability("farm", "read"), asyncHandler(farmsController.getOne));
