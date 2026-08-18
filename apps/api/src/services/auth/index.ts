// Business logic for the "auth" domain. Controllers call into this
// service layer; the service layer calls repositories/ for data access.
// Keep business rules here, not in controllers or on the frontend.
//
// Supports the auth patterns from Section 24:
//  - password login (desk roles: buyer, aggregator, warehouse, admin, ...)
//  - OTP login (field roles: farmer, village agent -- via app/WhatsApp)
// Agent-assisted login and USSD PIN auth are wired in the channels/
// phase on top of these same primitives.
import crypto from "node:crypto";
import type { RegisterInput, LoginInput } from "@agroflow/validation";
import type { AuthenticatedUser } from "@agroflow/types";
import { otpRepository, refreshTokenRepository, roleRepository, userRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateOtp, hashOtp, compareOtp, OTP_TTL_MINUTES } from "../../utils/otp.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from "../../utils/jwt.js";
import { toAuthenticatedUser } from "../users/index.js";

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(userId: string, authUser: AuthenticatedUser): Promise<AuthResult> {
  const accessToken = signAccessToken(authUser);

  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(userId, jti);
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await refreshTokenRepository.storeRefreshToken(
    userId,
    tokenHash,
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  );

  return { user: authUser, accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await userRepository.findUserByPhone(input.phoneNumber);
  if (existing) throw AppError.conflict("An account with this phone number already exists");

  const role = await roleRepository.findRoleByName(input.role);
  if (!role) throw AppError.badRequest(`Unknown role: ${input.role}`);

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  const user = await userRepository.createUser({
    phoneNumber: input.phoneNumber,
    fullName: input.fullName,
    passwordHash,
    preferredLanguage: input.preferredLanguage,
    regionId: input.regionId,
    roleId: role.id,
  });

  return issueTokens(user.id, toAuthenticatedUser(user));
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findUserByPhone(input.phoneNumber);
  if (!user || !user.passwordHash) {
    throw AppError.unauthorized("Invalid phone number or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) throw AppError.unauthorized("Invalid phone number or password");
  if (!user.isActive) throw AppError.forbidden("This account has been deactivated");

  return issueTokens(user.id, toAuthenticatedUser(user));
}

export async function requestOtp(phoneNumber: string): Promise<{ expiresInMinutes: number }> {
  const user = await userRepository.findUserByPhone(phoneNumber);
  if (!user) throw AppError.notFound("No account found for this phone number");

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await otpRepository.createOtp(user.id, codeHash, expiresAt);

  // TODO(channels phase): send `code` via SMS/WhatsApp gateway instead of
  // logging it. Logging is intentional for local/dev testing only.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev-only] OTP for ${phoneNumber}: ${code}`);
  }

  return { expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<AuthResult> {
  const user = await userRepository.findUserByPhone(phoneNumber);
  if (!user) throw AppError.notFound("No account found for this phone number");

  const otp = await otpRepository.findLatestActiveOtp(user.id);
  if (!otp) throw AppError.unauthorized("No active code -- request a new one");

  const matches = await compareOtp(code, otp.codeHash);
  if (!matches) throw AppError.unauthorized("Incorrect code");

  await otpRepository.consumeOtp(otp.id);
  if (!user.isVerified) {
    await userRepository.markUserVerified(user.id);
  }

  return issueTokens(user.id, toAuthenticatedUser(user));
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let claims;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const stored = await refreshTokenRepository.findActiveRefreshToken(tokenHash);
  if (!stored) throw AppError.unauthorized("Refresh token has been revoked or expired");

  // Rotate: revoke the used token, issue a fresh pair.
  await refreshTokenRepository.revokeRefreshToken(stored.id);

  const user = await userRepository.findUserById(claims.sub);
  if (!user || !user.isActive) throw AppError.unauthorized("Account is no longer active");

  return issueTokens(user.id, toAuthenticatedUser(user));
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const stored = await refreshTokenRepository.findActiveRefreshToken(tokenHash);
  if (stored) await refreshTokenRepository.revokeRefreshToken(stored.id);
}
