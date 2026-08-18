// Trust boundary for channel gateways (USSD today; SMS/WhatsApp reuse
// this same pattern once they're built). These callers are NOT end
// users with a JWT -- they're a telco/webhook gateway acting on behalf
// of a phone number it has already authenticated at the network level
// (SIM-based for USSD). Trust is a shared secret in a header, not a
// bearer token, and the "session" is the gateway's, not ours.
//
// requireChannelSecret gates the route; resolveChannelUser then looks
// the caller's target phoneNumber up and attaches req.user in the exact
// same AuthenticatedUser shape requireAuth (middleware/auth.ts) uses --
// so every downstream service (farmsService, produceService, ...) runs
// completely unchanged regardless of which channel called it.
import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { tanzaniaPhoneSchema } from "@agroflow/validation";
import { getEnv } from "../config/index.js";
import { userRepository } from "../repositories/index.js";
import { toAuthenticatedUser } from "../services/users/index.js";
import { AppError } from "../utils/AppError.js";

export function requireChannelSecret(req: Request, _res: Response, next: NextFunction) {
  const env = getEnv();
  if (!env.USSD_GATEWAY_API_KEY) {
    return next(AppError.internal("Channel gateway is not configured on this environment"));
  }

  const provided = req.headers["x-channel-secret"];
  if (typeof provided !== "string") return next(AppError.unauthorized("Missing channel secret"));

  const expected = Buffer.from(env.USSD_GATEWAY_API_KEY);
  const actual = Buffer.from(provided);
  const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!matches) return next(AppError.unauthorized("Invalid channel secret"));

  next();
}

/** Resolves the phoneNumber the gateway is acting on behalf of (body or
 * query, wherever the route puts it) and attaches req.user. 404s with a
 * message safe to render directly on a USSD/SMS screen if no account
 * exists yet -- registration itself stays a web/mobile/agent-assisted
 * flow, not something we build inside a USSD session. */
export async function resolveChannelUser(req: Request, _res: Response, next: NextFunction) {
  const raw = (req.body?.phoneNumber ?? req.query.phoneNumber) as string | undefined;
  if (!raw) return next(AppError.badRequest("phoneNumber is required"));

  const parsed = tanzaniaPhoneSchema.safeParse(raw);
  if (!parsed.success) return next(AppError.badRequest("Invalid phone number"));
  const phoneNumber = parsed.data;

  const user = await userRepository.findUserByPhone(phoneNumber);
  if (!user) {
    return next(
      AppError.notFound("No AgroFlow account for this number yet -- register via the app or a village agent"),
    );
  }
  if (!user.isActive) return next(AppError.forbidden("This account has been deactivated"));

  req.user = toAuthenticatedUser(user);
  next();
}
