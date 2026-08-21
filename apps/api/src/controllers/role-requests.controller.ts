// Controllers translate HTTP requests into service calls. Keep them
// thin -- validation happens in validators/, business logic in services/.
import type { Request, Response } from "express";
import * as roleRequestsService from "../services/role-requests/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function requestRole(req: Request, res: Response) {
  const request = await roleRequestsService.requestRole(req.user!.id, req.body);
  ok(res, request, 201);
}

export async function listMine(req: Request, res: Response) {
  const requests = await roleRequestsService.listMyRoleRequests(req.user!.id);
  ok(res, requests);
}

export async function listPending(_req: Request, res: Response) {
  const requests = await roleRequestsService.listPendingRoleRequests();
  ok(res, requests);
}

export async function approve(req: Request, res: Response) {
  const request = await roleRequestsService.approveRoleRequest(req.user!.id, req.params.id!);
  ok(res, request);
}

export async function reject(req: Request, res: Response) {
  const request = await roleRequestsService.rejectRoleRequest(req.user!.id, req.params.id!, req.body.reason);
  ok(res, request);
}
