// Match routes -- mounted under /api/v1/matches. "As buyer" and "as
// seller" are separate list endpoints since the same match:read
// permission covers both, but the two sides of a match are different
// query shapes (by demand order vs. by listing ownership).
import { Router } from "express";
import { matchesController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, proposeMatchSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const matchesRouter : Router = Router();
matchesRouter.use(requireAuth);

matchesRouter.get("/as-buyer", requireCapability("match", "read"), asyncHandler(matchesController.listAsBuyer));
matchesRouter.get("/as-seller", requireCapability("match", "read"), asyncHandler(matchesController.listAsSeller));
matchesRouter.post(
  "/",
  requireCapability("match", "create"),
  validateBody(proposeMatchSchema),
  asyncHandler(matchesController.propose),
);
matchesRouter.post("/:id/approve", requireCapability("match", "approve"), asyncHandler(matchesController.approve));
matchesRouter.post("/:id/reject", requireCapability("match", "approve"), asyncHandler(matchesController.reject));
