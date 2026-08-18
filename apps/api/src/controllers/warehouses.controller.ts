import type { Request, Response } from "express";
import * as warehousesService from "../services/warehouses/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await warehousesService.listMyWarehouses(req.user!));
}

export async function browse(req: Request, res: Response) {
  const regionId = typeof req.query.regionId === "string" ? req.query.regionId : undefined;
  ok(res, await warehousesService.browseWarehouses({ regionId }));
}

export async function create(req: Request, res: Response) {
  ok(res, await warehousesService.createWarehouse(req.user!, req.body), 201);
}

export async function updateUtilization(req: Request, res: Response) {
  const currentUtilization = Number(req.body.currentUtilization);
  ok(res, await warehousesService.updateUtilization(req.user!, req.params.id!, currentUtilization));
}
