// Express app assembly: mount middleware (auth, rbac, validation),
// mount routes/, central error handler. Import order matters: auth
// before rbac, rbac before any route handler -- both are applied
// per-route (see routes/*.routes.ts) rather than globally, since not
// every route requires authentication.
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { getEnv } from "./config/index.js";
import { apiRouter } from "./routes/index.js";
import { AppError } from "./utils/AppError.js";
import type { ApiError } from "@agroflow/types";

export function createApp(): Express {
  const env = getEnv();
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  // `verify` stashes the exact raw bytes received onto req.rawBody --
  // needed by middleware/mobileMoneySignature.ts, which must HMAC the
  // untouched body, not Express's re-serialized parsed copy of it
  // (whitespace/key-order differences would break the signature).
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1", apiRouter);

  // 404 for anything unmatched under /api/v1.
  app.use("/api/v1", (_req, res) => {
    const body: ApiError = {
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    };
    res.status(404).json(body);
  });

  // Central error handler -- must be registered last, and must have 4 args
  // for Express to recognise it as an error handler.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      const body: ApiError = {
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
      };
      return res.status(err.statusCode).json(body);
    }

    console.error(err);
    const body: ApiError = {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    };
    res.status(500).json(body);
  });

  return app;
}
