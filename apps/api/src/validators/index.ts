// Request validation -- re-exports schemas from packages/validation so
// rules stay identical between the API and frontends, plus one Express
// middleware factory that runs any of those schemas against req.body.
export * from "@agroflow/validation";

import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError.js";

/** Validates req.body against `schema`, replaces req.body with the parsed
 * (and transformed, e.g. phone-number normalisation) result, or forwards
 * a 400 AppError with field-level details. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(AppError.badRequest("Invalid request body", result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}
