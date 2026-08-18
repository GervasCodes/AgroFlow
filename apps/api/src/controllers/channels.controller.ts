// Controllers behind the trusted-channel gateway surface
// (middleware/channelAuth.ts). Every handler here delegates to the
// exact same services/* farms and buyers use -- USSD gets no special
// business logic, only a different way of authenticating the caller.
import type { Request, Response } from "express";
import type { ApiSuccess } from "@agroflow/types";
import type { ChannelSellInput } from "../validators/channels.js";
import * as farmsService from "../services/farms/index.js";
import * as produceService from "../services/produce/index.js";

function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

/** Minimal shape for a USSD numbered list -- id + name only. */
export async function listFarms(req: Request, res: Response) {
  const farms = await farmsService.listMyFarms(req.user!);
  ok(res, farms.map((f) => ({ id: f.id, name: f.name })));
}

/** Creates AND immediately publishes a listing -- USSD's "Sell Produce"
 * flow has no separate draft/publish step the way the web dashboard
 * does (Section 10's menu tree goes straight confirm -> live). Unit is
 * fixed to KG: the menu tree only ever prompts "quantity (kg)". */
export async function sell(req: Request, res: Response) {
  const { farmId, crop, quantity } = req.body as ChannelSellInput;

  const created = await produceService.createListing(req.user!, {
    farmId,
    crop,
    quantity,
    unit: "KG",
    availableFrom: new Date().toISOString(),
  });
  const published = await produceService.publishListing(req.user!, created.id);

  ok(res, { listingId: published.id, crop: published.crop.name, quantity: published.quantity }, 201);
}
