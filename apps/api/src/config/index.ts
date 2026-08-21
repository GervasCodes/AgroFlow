// Environment/config loading -- reads and validates env vars listed in
// /.env.example at startup; fail fast if a required var is missing.
// Only variables actually consumed by Phase 3 (server + auth) are
// required here. Payment/AI/storage/channel vars stay optional until
// the phase that wires them in validates them too.
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().default("*"),
  // Shared secret trusted channel gateways (USSD today) present in an
  // X-Channel-Secret header -- see middleware/channelAuth.ts. Optional
  // here so the API still boots in environments that don't run a
  // channel gateway; routes behind requireChannelSecret 500 with a
  // clear message if it's missing rather than silently trusting nothing.
  USSD_GATEWAY_API_KEY: z.string().min(16).optional(),
  // Shared secret for the generic mobile money webhook receiver (see
  // services/payments and routes/payments.routes.ts) -- whichever real
  // provider (AzamPay/Selcom/MalipoPay) is integrated first points its
  // webhook here with this key. Same optional-but-gated pattern as
  // USSD_GATEWAY_API_KEY.
  PAYMENT_GATEWAY_API_KEY: z.string().min(16).optional(),
  // AzamPay mobile-money adapter (see integrations/mobile-money) --
  // all optional so the API still boots without real credentials;
  // initiateCharge() logs instead of calling out when unset.
  AZAMPAY_APP_NAME: z.string().optional(),
  AZAMPAY_CLIENT_ID: z.string().optional(),
  AZAMPAY_CLIENT_SECRET: z.string().optional(),
  AZAMPAY_AUTH_URL: z.string().url().optional(),
  AZAMPAY_CHECKOUT_URL: z.string().url().optional(),
  // Shared secret used to HMAC-verify AzamPay's webhook callback body
  // (middleware/mobileMoneySignature.ts) -- separate from
  // PAYMENT_GATEWAY_API_KEY, which guards the older static-secret route.
  AZAMPAY_WEBHOOK_SECRET: z.string().min(16).optional(),
  // Outbound email (services/email) -- provider is Brevo. BREVO_API_KEY
  // (Brevo's REST API, preferred) or the SMTP_* vars (Brevo's SMTP
  // relay, or any other SMTP-compatible provider) -- either is enough;
  // neither set and sendEmail() logs instead of sending.
  BREVO_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/** Lazily validates and caches process.env. Call once at startup (server.ts)
 * so a bad .env fails fast instead of surfacing as a confusing 500 later. */
export function getEnv(): Env {
  if (!cachedEnv) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid environment configuration:");
      console.error(parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment configuration -- see errors above.");
    }
    cachedEnv = parsed.data;
  }
  return cachedEnv;
}
