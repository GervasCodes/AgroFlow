// Notifications routes -- mounted under /api/v1/notifications. Every
// authenticated user manages their own preferences/history; no separate
// "notification" resource in the permission matrix needed for that.
import { Router } from "express";
import { notificationsController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, updateNotificationPreferencesSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const notificationsRouter: Router = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/preferences", asyncHandler(notificationsController.getPreferences));
notificationsRouter.patch(
  "/preferences",
  validateBody(updateNotificationPreferencesSchema),
  asyncHandler(notificationsController.updatePreferences),
);
notificationsRouter.get("/history", asyncHandler(notificationsController.history));
