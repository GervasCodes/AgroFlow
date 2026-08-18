// Signs and verifies the two JWTs used across the platform:
//  - access token: short-lived, carries the AuthenticatedUser claims
//    (roles + flattened permissions) so rbac.ts never has to hit the DB
//    per request.
//  - refresh token: long-lived, opaque-ish, only used to mint a new
//    access token via POST /api/v1/auth/refresh. Its hash is stored in
//    RefreshToken so it can be revoked (logout, password change).
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "@agroflow/types";
import { getEnv } from "../config/index.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AccessTokenClaims = AuthenticatedUser & { type: "access" };
export type RefreshTokenClaims = { sub: string; type: "refresh"; jti: string };

export function signAccessToken(user: AuthenticatedUser): string {
  const env = getEnv();
  const claims: AccessTokenClaims = { ...user, type: "access" };
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims;
}

export function signRefreshToken(userId: string, jti: string): string {
  const env = getEnv();
  const claims: RefreshTokenClaims = { sub: userId, type: "refresh", jti };
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const env = getEnv();
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenClaims;
}
