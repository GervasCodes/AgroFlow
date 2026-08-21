import type { Request, Response } from "express";
import * as logisticsService from "../services/logistics/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function getDispatchBoard(_req: Request, res: Response) {
  ok(res, await logisticsService.getDispatchBoard());
}

export async function createStorageBooking(req: Request, res: Response) {
  ok(res, await logisticsService.createStorageBooking(req.user!, req.body), 201);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await logisticsService.listMyStorageBookings(req.user!.id));
}

export async function listForWarehouse(req: Request, res: Response) {
  ok(res, await logisticsService.listWarehouseBookings(req.user!, req.params.warehouseId!));
}
