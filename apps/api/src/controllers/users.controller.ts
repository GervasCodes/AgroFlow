import type { Request, Response } from "express";
import * as usersService from "../services/users/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function list(_req: Request, res: Response) {
  ok(res, await usersService.listUsers());
}
