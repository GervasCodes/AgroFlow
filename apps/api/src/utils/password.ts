// Password hashing (bcrypt) -- used by services/auth for password-based
// login. OTP hashing lives in utils/otp.ts (separate: OTPs are short,
// numeric and short-lived, so they use a cheaper/faster hash).
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
