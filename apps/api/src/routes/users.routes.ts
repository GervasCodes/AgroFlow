// Users routes -- mounted under /api/v1/users. Admin-only listing for
// the Admin Console (verify users / monitor activity, Phase 5).
import { Router } from "express";
import { usersController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const usersRouter: Router = Router();
usersRouter.use(requireAuth);

usersRouter.get("/", requireCapability("user", "read"), asyncHandler(usersController.list));
