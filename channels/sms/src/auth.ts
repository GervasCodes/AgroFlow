// Trust boundary for the /notify endpoint -- called by apps/api
// server-to-server (fire-and-forget) after events like a match being
// approved or a payment confirming. Same shared-secret pattern as
// apps/api's middleware/channelAuth.ts and paymentWebhookAuth.ts, using
// its own secret (INTERNAL_SERVICE_SECRET) since this is yet another
// distinct trust domain -- apps/api calling OUT to this service, rather
// than a gateway calling IN to apps/api.
import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requireInternalServiceSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret) {
    res.status(500).json({ error: "INTERNAL_SERVICE_SECRET is not configured" });
    return;
  }

  const provided = req.headers["x-internal-service-secret"];
  if (typeof provided !== "string") {
    res.status(401).json({ error: "Missing internal service secret" });
    return;
  }

  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!matches) {
    res.status(401).json({ error: "Invalid internal service secret" });
    return;
  }

  next();
}
