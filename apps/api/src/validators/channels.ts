// Validation for the trusted-channel surface (middleware/channelAuth.ts).
// Kept in apps/api rather than @agroflow/validation since these shapes
// are internal to the gateway<->API contract, not something an
// end-user-facing form in web/mobile ever builds directly.
import { z } from "zod";
import { tanzaniaPhoneSchema, cropSchema } from "@agroflow/validation";

export const channelFarmsQuerySchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
});

export const channelSellSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
  farmId: z.string().uuid(),
  crop: cropSchema,
  quantity: z.coerce.number().positive(),
});
export type ChannelSellInput = z.infer<typeof channelSellSchema>;
