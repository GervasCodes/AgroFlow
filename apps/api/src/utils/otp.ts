// One-time-passcode generation/hashing for phone-based login (field
// roles via App/WhatsApp -- see Section 24). Delivery (SMS/WhatsApp
// gateway) is wired in the channels/ phase; for now requestOtp() logs
// the code server-side in development so the flow is testable end to end.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const OTP_SALT_ROUNDS = 8; // lighter than password hashing -- OTPs are short-lived
export const OTP_TTL_MINUTES = 5;

export function generateOtp(): string {
  // 6-digit numeric code, zero-padded.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_SALT_ROUNDS);
}

export function compareOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
