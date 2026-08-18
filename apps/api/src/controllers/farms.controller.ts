import type { Request, Response } from "express";
import * as farmsService from "../services/farms/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listMine(req: Request, res: Response) {
  const farms = await farmsService.listMyFarms(req.user!);
  ok(res, farms);
}

export async function create(req: Request, res: Response) {
  const farm = await farmsService.createFarm(req.user!, req.body);
  ok(res, farm, 201);
}

export async function getOne(req: Request, res: Response) {
  const farm = await farmsService.getFarmOrThrow(req.user!, req.params.id!);
  ok(res, farm);
}
