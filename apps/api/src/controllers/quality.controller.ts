import type { Request, Response } from "express";
import * as qualityService from "../services/quality/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listForListing(req: Request, res: Response) {
  ok(res, await qualityService.listInspectionsForListing(req.params.listingId!));
}

export async function create(req: Request, res: Response) {
  ok(res, await qualityService.recordInspection(req.user!, req.body), 201);
}
