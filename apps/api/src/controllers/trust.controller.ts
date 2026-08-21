import type { Request, Response } from "express";
import * as trustService from "../services/trust/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function createReview(req: Request, res: Response) {
  ok(res, await trustService.createReview(req.user!, req.body), 201);
}

export async function listReviewsForUser(req: Request, res: Response) {
  ok(res, await trustService.listReviewsForUser(req.params.userId!));
}

export async function createDispute(req: Request, res: Response) {
  ok(res, await trustService.createDispute(req.user!, req.body), 201);
}

export async function listMine(req: Request, res: Response) {
  ok(res, await trustService.listMyDisputes(req.user!.id));
}

export async function listOpen(_req: Request, res: Response) {
  ok(res, await trustService.listOpenDisputes());
}

export async function resolve(req: Request, res: Response) {
  ok(res, await trustService.resolveDispute(req.user!, req.params.id!, req.body));
}
