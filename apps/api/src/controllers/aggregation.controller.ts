import type { Request, Response } from "express";
import * as aggregationService from "../services/aggregation/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function create(req: Request, res: Response) {
  ok(res, await aggregationService.createInventoryLot(req.user!, req.body), 201);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await aggregationService.listMyInventory(req.user!.id));
}

export async function updateQuantity(req: Request, res: Response) {
  ok(res, await aggregationService.updateInventoryQuantity(req.user!, req.params.id!, req.body));
}
