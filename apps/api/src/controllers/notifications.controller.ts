import type { Request, Response } from "express";
import * as notificationsService from "../services/notifications/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function getPreferences(req: Request, res: Response) {
  ok(res, await notificationsService.getPreferences(req.user!));
}

export async function updatePreferences(req: Request, res: Response) {
  ok(res, await notificationsService.updatePreferences(req.user!, req.body));
}

export async function history(req: Request, res: Response) {
  ok(res, await notificationsService.getHistory(req.user!));
}
