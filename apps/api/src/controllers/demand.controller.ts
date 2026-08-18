import type { Request, Response } from "express";
import * as demandService from "../services/demand/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await demandService.listMyDemandOrders(req.user!));
}

export async function create(req: Request, res: Response) {
  ok(res, await demandService.createDemandOrder(req.user!, req.body), 201);
}

export async function getOne(req: Request, res: Response) {
  ok(res, await demandService.getDemandOrderOrThrow(req.user!, req.params.id!));
}
