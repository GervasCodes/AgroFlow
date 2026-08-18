// *** Single source of truth for authorization. ***
// Every request must pass through here before reaching a controller.
// Checks: role and permission. Data-ownership checks (e.g. a Buyer may
// only read their own DemandOrders; Admin reads all) are layered on top
// per-resource once the Marketplace domain exists (Phase 5+) -- this
// file establishes the pattern those checks build on.
//
// UI-side role checks (apps/web/src/hooks/useRole.ts, equivalent in
// mobile) are convenience only -- this file is the real security
// boundary. requireAuth() (middleware/auth.ts) MUST run before these.
import type { NextFunction, Request, Response } from "express";
import type { RoleName } from "@agroflow/types";
import { permissionKey, type Action, type Resource } from "@agroflow/config";
import { AppError } from "../utils/AppError.js";

/** Requires the caller to hold ALL of the given permission keys
 * ("resource:action" strings, e.g. "farm:create"). */
export function requirePermission(...keys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());

    const missing = keys.filter((key) => !req.user!.permissions.includes(key));
    if (missing.length > 0) {
      return next(
        AppError.forbidden(`Missing required permission(s): ${missing.join(", ")}`),
      );
    }
    next();
  };
}

/** Convenience wrapper: requirePermission built from a (resource, action) pair
 * instead of a raw string, so callers get autocomplete + typo protection. */
export function requireCapability(resource: Resource, action: Action) {
  return requirePermission(permissionKey(resource, action));
}

/** Requires the caller to hold at least ONE of the given roles. Prefer
 * requirePermission/requireCapability for most routes -- role checks are
 * coarser and should mainly guard truly role-specific UI-adjacent
 * endpoints (e.g. admin-only management screens). */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      return next(AppError.forbidden(`Requires one of these roles: ${roles.join(", ")}`));
    }
    next();
  };
}
