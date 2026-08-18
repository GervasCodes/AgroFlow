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
