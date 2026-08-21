import type { Request, Response } from "express";
import * as aiService from "../services/ai/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function recommendations(req: Request, res: Response) {
  ok(res, await aiService.recommendMatchesForDemandOrder(req.user!, req.params.demandOrderId!));
}
