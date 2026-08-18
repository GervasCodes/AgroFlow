import type { Request, Response } from "express";
import * as matchesService from "../services/matches/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listAsBuyer(req: Request, res: Response) {
  ok(res, await matchesService.listMatchesAsBuyer(req.user!));
}

export async function listAsSeller(req: Request, res: Response) {
  ok(res, await matchesService.listMatchesAsSeller(req.user!));
}

export async function propose(req: Request, res: Response) {
  ok(res, await matchesService.proposeMatch(req.user!, req.body), 201);
}

export async function approve(req: Request, res: Response) {
  ok(res, await matchesService.approveMatch(req.user!, req.params.id!));
}

export async function reject(req: Request, res: Response) {
  ok(res, await matchesService.rejectMatch(req.user!, req.params.id!));
}
