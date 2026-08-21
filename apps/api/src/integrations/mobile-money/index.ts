// Mobile money provider adapter -- AzamPay (chosen as the concrete
// provider: it's a licensed Tanzanian payment aggregator that itself
// routes to M-Pesa/Mixx by Yas/Airtel Money/HaloPesa behind one
// integration, matching MOBILE_MONEY_PROVIDERS in @agroflow/config
// one-for-one). Every adapter for a different aggregator would
// implement this same MobileMoneyGateway interface -- initiate,
// verify-webhook, reconcile -- so swapping providers later means adding
// a new file here, not touching services/payments.
//
// Credentials are optional env vars (AZAMPAY_*, same pattern as every
// other integration in this codebase): unset in an environment, this
// adapter logs instead of calling out, so local dev / CI never needs
// real AzamPay credentials to run.
//
// IMPORTANT: AzamPay's exact endpoint paths, request/response field
// names, and webhook signing scheme should be confirmed against their
// current developer docs before pointing this at production -- this
// implementation follows their publicly documented checkout + token
// flow as of this integration, but payment provider APIs change.
import crypto from "node:crypto";
import type { MobileMoneyProvider } from "@agroflow/config";

const AUTH_URL = process.env.AZAMPAY_AUTH_URL ?? "https://authenticator-sandbox.azampay.co.tz";
const CHECKOUT_URL = process.env.AZAMPAY_CHECKOUT_URL ?? "https://sandbox.azampay.co.tz";
const APP_NAME = process.env.AZAMPAY_APP_NAME;
const CLIENT_ID = process.env.AZAMPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.AZAMPAY_CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.AZAMPAY_WEBHOOK_SECRET;

function isConfigured(): boolean {
  return Boolean(APP_NAME && CLIENT_ID && CLIENT_SECRET);
}

// AzamPay identifies the underlying network by name in the checkout
// request -- map our config's provider enum to theirs.
const PROVIDER_MAP: Record<MobileMoneyProvider, string> = {
  MPESA: "Mpesa",
  MIXX_BY_YAS: "Tigo", // AzamPay still refers to the Tigo Pesa network as "Tigo"
  AIRTEL_MONEY: "Airtel",
  HALOPESA: "Halopesa",
};

interface CachedToken {
  token: string;
  expiresAt: number;
}
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${AUTH_URL}/AppRegistrationService/GenerateToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appName: APP_NAME, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });

  if (!res.ok) {
    throw new Error(`AzamPay token request failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { data: { accessToken: string; expire: string } };
  const token = body.data.accessToken;
  // `expire` is an ISO timestamp per AzamPay's docs; fall back to a
  // conservative 55-minute cache if the shape ever changes.
  const expiresAt = Date.parse(body.data.expire) || Date.now() + 55 * 60_000;
  cachedToken = { token, expiresAt };
  return token;
}

export interface InitiateChargeInput {
  provider: MobileMoneyProvider;
  amount: number;
  currency: string;
  phoneNumber: string;
  /** Our Payment.id, sent as AzamPay's externalId -- the idempotency
   * key that stops a retried initiate() from creating a second charge
   * for the same Payment on AzamPay's side. */
  externalId: string;
}

export interface InitiateChargeResult {
  status: "PENDING" | "FAILED";
  providerReference?: string;
  rawResponse: unknown;
}

export async function initiateCharge(input: InitiateChargeInput): Promise<InitiateChargeResult> {
  if (!isConfigured()) {
    console.log(
      `[dev-only, AzamPay not configured] would charge ${input.phoneNumber} ${input.amount} ${input.currency} via ${input.provider} (externalId=${input.externalId})`,
    );
    return { status: "PENDING", providerReference: `DEV-${input.externalId}`, rawResponse: null };
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${CHECKOUT_URL}/azampay/mno/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountNumber: input.phoneNumber,
        amount: String(input.amount),
        currency: input.currency,
        externalId: input.externalId,
        provider: PROVIDER_MAP[input.provider],
      }),
    });

    const body = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      console.error("AzamPay checkout failed:", body);
      return { status: "FAILED", rawResponse: body };
    }

    return {
      status: "PENDING",
      providerReference: body?.transactionId ?? body?.data?.transactionId,
      rawResponse: body,
    };
  } catch (err) {
    console.error("AzamPay checkout error:", err);
    return { status: "FAILED", rawResponse: { error: String(err) } };
  }
}

/** Verifies an inbound webhook's HMAC-SHA256 signature against the raw
 * request body. Must be called with the RAW (unparsed) body bytes --
 * see apps/api/src/app.ts's express.json({ verify }) and
 * middleware/mobileMoneySignature.ts. */
export function verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return false; // never trust an unconfigured environment
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export interface WebhookEvent {
  providerReference: string;
  externalId: string;
  status: "CONFIRMED" | "FAILED";
  rawPayload: unknown;
}

/** Parses AzamPay's webhook callback body into our normalised shape.
 * AzamPay's callback posts a `utilityref`/`transactionstatus`-style
 * payload -- normalise defensively since this is exactly the kind of
 * field naming that varies between their sandbox and live docs. */
export function parseWebhookPayload(body: Record<string, unknown>): WebhookEvent {
  const status = String(body.transactionstatus ?? body.status ?? "").toUpperCase();
  return {
    providerReference: String(body.transactionId ?? body.msisdn ?? body.reference ?? ""),
    externalId: String(body.externalId ?? body.utilityref ?? ""),
    status: status === "SUCCESS" || status === "CONFIRMED" ? "CONFIRMED" : "FAILED",
    rawPayload: body,
  };
}

export const mobileMoneyGateway = {
  initiateCharge,
  verifyWebhookSignature,
  parseWebhookPayload,
  isConfigured,
};
