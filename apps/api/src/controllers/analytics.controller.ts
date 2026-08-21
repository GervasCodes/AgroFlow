import type { Request, Response } from "express";
import * as analyticsService from "../services/analytics/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function channelMix(_req: Request, res: Response) {
  ok(res, await analyticsService.getChannelMix());
}

export async function priceTrends(_req: Request, res: Response) {
  ok(res, await analyticsService.getPriceTrends());
}

export async function disputeRate(_req: Request, res: Response) {
  ok(res, await analyticsService.getDisputeRate());
}
