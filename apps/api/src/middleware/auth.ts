// Reads and verifies the JWT (phone-number identity + role claims).
// Supports the three auth patterns from Section 24: OTP (app/WhatsApp),
// PIN (USSD, rate-limited at the gateway), and agent-assisted login
// (logs both the agent's and the farmer's identity). All three ultimately
// go through services/auth and end up as the same access-token shape --
// this middleware only cares about verifying that token.
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "@agroflow/types";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Raw request body bytes, captured by app.ts's express.json({ verify })
       * for routes that need to verify a webhook signature over the exact
       * bytes received (see middleware/mobileMoneySignature.ts). */
      rawBody?: Buffer;
    }
  }
}

/** Populates req.user if a valid access token is present; throws 401 if not. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const claims = verifyAccessToken(token);
    req.user = {
      id: claims.id,
      phoneNumber: claims.phoneNumber,
      fullName: claims.fullName,
      roles: claims.roles,
      permissions: claims.permissions,
    };
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired access token"));
  }
}

/** Populates req.user if a token is present, but never throws -- for
 * routes that behave differently for anonymous vs. authenticated callers. */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const claims = verifyAccessToken(header.slice("Bearer ".length));
    req.user = {
      id: claims.id,
      phoneNumber: claims.phoneNumber,
      fullName: claims.fullName,
      roles: claims.roles,
      permissions: claims.permissions,
    };
  } catch {
    // Invalid token on an optional-auth route -- treat as anonymous rather
    // than failing the request.
  }
  next();
}
