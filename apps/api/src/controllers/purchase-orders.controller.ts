import type { Request, Response } from "express";
import * as purchaseOrdersService from "../services/purchase-orders/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listAsBuyer(req: Request, res: Response) {
  ok(res, await purchaseOrdersService.listAsBuyer(req.user!));
}

export async function listAsSeller(req: Request, res: Response) {
  ok(res, await purchaseOrdersService.listAsSeller(req.user!));
}
