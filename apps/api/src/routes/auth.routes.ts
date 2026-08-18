// Auth routes -- register/login/OTP/refresh/logout/me. Mounted under
// /api/v1/auth by routes/index.ts.
import { Router } from "express";
import { authController } from "../controllers/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, registerSchema, loginSchema, requestOtpSchema, verifyOtpSchema } from "../validators/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", validateBody(loginSchema), asyncHandler(authController.login));
authRouter.post("/otp/request", validateBody(requestOtpSchema), asyncHandler(authController.requestOtp));
authRouter.post("/otp/verify", validateBody(verifyOtpSchema), asyncHandler(authController.verifyOtp));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
