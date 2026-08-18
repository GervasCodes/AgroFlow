// Controllers translate HTTP requests into service calls. Keep them
// thin -- validation happens in validators/, business logic in services/.
import type { Request, Response } from "express";
import * as authService from "../services/auth/index.js";
import { getUserOrThrow, toAuthenticatedUser } from "../services/users/index.js";
import { AppError } from "../utils/AppError.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  ok(res, result, 201);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  ok(res, result);
}

export async function requestOtp(req: Request, res: Response) {
  const result = await authService.requestOtp(req.body.phoneNumber);
  ok(res, result);
}

export async function verifyOtp(req: Request, res: Response) {
  const result = await authService.verifyOtp(req.body.phoneNumber, req.body.code);
  ok(res, result);
}

export async function refresh(req: Request, res: Response) {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) throw AppError.badRequest("refreshToken is required");
  const result = await authService.refresh(token);
  ok(res, result);
}

export async function logout(req: Request, res: Response) {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) throw AppError.badRequest("refreshToken is required");
  await authService.logout(token);
  ok(res, { loggedOut: true });
}

export async function me(req: Request, res: Response) {
  // req.user is guaranteed by requireAuth on this route.
  const user = await getUserOrThrow(req.user!.id);
  ok(res, toAuthenticatedUser(user));
}
