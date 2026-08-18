import type { Request, Response } from "express";
import * as shipmentsService from "../services/shipments/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listAvailable(_req: Request, res: Response) {
  ok(res, await shipmentsService.listAvailable());
}

export async function listAsBuyer(req: Request, res: Response) {
  ok(res, await shipmentsService.listAsBuyer(req.user!));
}

export async function listAsTransporter(req: Request, res: Response) {
  ok(res, await shipmentsService.listAsTransporter(req.user!));
}

export async function request(req: Request, res: Response) {
  ok(res, await shipmentsService.requestShipment(req.user!, req.body), 201);
}

export async function claim(req: Request, res: Response) {
  ok(res, await shipmentsService.claimShipment(req.user!, req.params.id!));
}

export async function updateStatus(req: Request, res: Response) {
  ok(res, await shipmentsService.updateShipmentStatus(req.user!, req.params.id!, req.body));
}
