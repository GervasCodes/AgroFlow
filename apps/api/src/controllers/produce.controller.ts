import type { Request, Response } from "express";
import * as produceService from "../services/produce/index.js";
import type { ApiSuccess } from "@agroflow/types";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export async function listMine(req: Request, res: Response) {
  const listings = await produceService.listMyListings(req.user!);
  ok(res, listings);
}

export async function browse(req: Request, res: Response) {
  const crop = typeof req.query.crop === "string" ? req.query.crop : undefined;
  const regionId = typeof req.query.regionId === "string" ? req.query.regionId : undefined;
  const listings = await produceService.browsePublishedListings({ crop, regionId });
  ok(res, listings);
}

export async function create(req: Request, res: Response) {
  const listing = await produceService.createListing(req.user!, req.body);
  ok(res, listing, 201);
}

export async function publish(req: Request, res: Response) {
  const listing = await produceService.publishListing(req.user!, req.params.id!);
  ok(res, listing);
}

export async function withdraw(req: Request, res: Response) {
  const listing = await produceService.withdrawListing(req.user!, req.params.id!);
  ok(res, listing);
}
