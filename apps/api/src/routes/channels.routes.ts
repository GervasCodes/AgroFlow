// Trusted-channel routes -- mounted under /api/v1/channels. Every route
// here requires the X-Channel-Secret header (requireChannelSecret) and
// resolves the acting user by phone number instead of a JWT
// (resolveChannelUser). See middleware/channelAuth.ts for the full
// rationale. Currently backs USSD's "Sell Produce" menu
// (channels/ussd); SMS/WhatsApp reuse this same surface once built.
import { Router } from "express";
import { channelsController } from "../controllers/index.js";
import { requireChannelSecret, resolveChannelUser } from "../middleware/channelAuth.js";
import { requireCapability } from "../middleware/rbac.js";
import { validateBody } from "../validators/index.js";
import { channelSellSchema } from "../validators/channels.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const channelsRouter = Router();

channelsRouter.use(requireChannelSecret);

channelsRouter.get(
  "/farms",
  asyncHandler(resolveChannelUser),
  requireCapability("farm", "read"),
  asyncHandler(channelsController.listFarms),
);

channelsRouter.post(
  "/produce-listings",
  validateBody(channelSellSchema),
  asyncHandler(resolveChannelUser),
  requireCapability("produce_listing", "create"),
  asyncHandler(channelsController.sell),
);
