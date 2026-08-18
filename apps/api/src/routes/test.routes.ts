// Phase-3 verification routes only -- prove requireAuth + RBAC work
// end-to-end before building anything on top (per docs/BUILD_ORDER.md:
// "RBAC must work end-to-end (one user, two roles, one test endpoint)
// before moving on"). Mounted only outside production.
//
// Manual verification recipe:
//   1. Register a user with role FARMER, note the access token.
//   2. Call GET /api/v1/test/whoami -> 200, shows FARMER's permissions.
//   3. Call GET /api/v1/test/farm-write -> 200 (FARMER has farm:create).
//   4. Call GET /api/v1/test/user-admin -> 403 (FARMER lacks user:delete).
//   5. Manually add the ADMIN role to that same user (a second UserRole
//      row) and log in again -> GET /api/v1/test/user-admin now 200,
//      proving permission UNION across two roles on one user.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireCapability } from "../middleware/rbac.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { ApiSuccess } from "@agroflow/types";

export const testRouter = Router();

testRouter.get(
  "/whoami",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body: ApiSuccess<typeof req.user> = { success: true, data: req.user };
    res.json(body);
  }),
);

testRouter.get(
  "/farm-write",
  requireAuth,
  requireCapability("farm", "create"),
  asyncHandler(async (req, res) => {
    const body: ApiSuccess<{ message: string }> = {
      success: true,
      data: { message: `OK -- ${req.user!.fullName} may create farms.` },
    };
    res.json(body);
  }),
);

testRouter.get(
  "/user-admin",
  requireAuth,
  requireCapability("user", "delete"),
  asyncHandler(async (req, res) => {
    const body: ApiSuccess<{ message: string }> = {
      success: true,
      data: { message: `OK -- ${req.user!.fullName} may delete users.` },
    };
    res.json(body);
  }),
);
