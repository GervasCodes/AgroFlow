// Talks to apps/api's trusted-channel surface (/api/v1/channels/*).
// Deliberately NOT @agroflow/api-client -- that client authenticates
// with a Bearer JWT for end-user-facing apps; this service authenticates
// with the shared X-Channel-Secret header instead (see apps/api's
// middleware/channelAuth.ts). Small enough to hand-roll rather than
// force api-client to support two different auth models.
import type { ApiResponse } from "@agroflow/types";

const API_BASE_URL = process.env.AGROFLOW_API_URL ?? "http://localhost:4000/api/v1";
const CHANNEL_SECRET = process.env.USSD_GATEWAY_API_KEY ?? "";

export class ChannelApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ChannelApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Channel-Secret": CHANNEL_SECRET,
      ...init?.headers,
    },
  });

  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) throw new ChannelApiError(body.error.code, body.error.message);
  return body.data;
}

export interface ChannelFarm {
  id: string;
  name: string;
}

export interface ChannelSellResult {
  listingId: string;
  crop: string;
  quantity: number;
}

export const channelApi = {
  listFarms: (phoneNumber: string) =>
    request<ChannelFarm[]>(`/channels/farms?phoneNumber=${encodeURIComponent(phoneNumber)}`),
  sell: (input: { phoneNumber: string; farmId: string; crop: string; quantity: number }) =>
    request<ChannelSellResult>("/channels/produce-listings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
