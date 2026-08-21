// Role-request routes -- mounted under /api/v1/role-requests. Replaces
// self-selected role at registration: a user requests a role, an ADMIN
// (role:approve) approves or rejects it.
import { Router } from "express";
import { roleRequestsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody, requestRoleSchema, rejectRoleRequestSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const roleRequestsRouter: Router = Router();
roleRequestsRouter.use(requireAuth);

roleRequestsRouter.post(
  "/",
  validateBody(requestRoleSchema),
  asyncHandler(roleRequestsController.requestRole),
);
roleRequestsRouter.get("/mine", asyncHandler(roleRequestsController.listMine));

// Admin-only: reviewing pending requests.
roleRequestsRouter.get(
  "/",
  requireCapability("role", "approve"),
  asyncHandler(roleRequestsController.listPending),
);
roleRequestsRouter.post(
  "/:id/approve",
  requireCapability("role", "approve"),
  asyncHandler(roleRequestsController.approve),
);
roleRequestsRouter.post(
  "/:id/reject",
  requireCapability("role", "approve"),
  validateBody(rejectRoleRequestSchema),
  asyncHandler(roleRequestsController.reject),
);
