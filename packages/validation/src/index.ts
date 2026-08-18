// Shared Zod validation schemas. One schema per entity/action, imported by
// both apps/api/src/validators/ and frontend forms so validation rules
// never drift between client and server.

import { z } from "zod";
import { CROPS, REGIONS, UNITS, QUALITY_GRADES, MOBILE_MONEY_PROVIDERS, ROLES } from "@agroflow/config";

// --- Shared primitives ---------------------------------------------------

// Tanzanian phone numbers: accepts +255XXXXXXXXX or 0XXXXXXXXX, normalises
// to +255 in the transform. This is the identity key for field-role users
// (USSD/SMS/WhatsApp all key off phone number, not email).
export const tanzaniaPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+255|0)[67]\d{8}$/, "Enter a valid Tanzanian phone number (e.g. 0712345678)")
  .transform((val) => (val.startsWith("0") ? `+255${val.slice(1)}` : val));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const cropSchema = z.enum(CROPS);
export const regionSchema = z.enum(REGIONS);
export const unitSchema = z.enum(UNITS);
export const qualityGradeSchema = z.enum(QUALITY_GRADES);
export const mobileMoneyProviderSchema = z.enum(MOBILE_MONEY_PROVIDERS);
export const roleNameSchema = z.enum(ROLES);

// --- Identity --------------------------------------------------------------

export const registerSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  password: passwordSchema.optional(), // optional: OTP-only signup for field roles
  role: roleNameSchema,
  regionId: regionSchema.optional(),
  preferredLanguage: z.enum(["en", "sw"]).default("sw"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestOtpSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// --- Agriculture -------------------------------------------------------------

export const createFarmSchema = z.object({
  name: z.string().trim().min(2).max(120),
  regionId: regionSchema,
  district: z.string().trim().max(120).optional(),
  ward: z.string().trim().max(120).optional(),
  village: z.string().trim().max(120).optional(),
  location: z
    .object({
      latitude: z.number().min(-11.8).max(-0.9), // Tanzania mainland+islands bounding box
      longitude: z.number().min(29.3).max(40.5),
    })
    .optional(),
  sizeHectares: z.number().positive().max(100000).optional(),
});
export type CreateFarmInput = z.infer<typeof createFarmSchema>;

export const createProduceListingSchema = z.object({
  farmId: z.string().uuid(),
  crop: cropSchema,
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: unitSchema,
  qualityGrade: qualityGradeSchema.optional(),
  pricePerUnit: z.number().positive().optional(),
  availableFrom: z.string().datetime().or(z.string().date()),
  images: z.array(z.string().url()).max(6).optional(),
});
export type CreateProduceListingInput = z.infer<typeof createProduceListingSchema>;

// --- Marketplace ---------------------------------------------------------

export const createDemandOrderSchema = z.object({
  crop: cropSchema,
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: unitSchema,
  qualityGrade: qualityGradeSchema.optional(),
  maxPricePerUnit: z.number().positive().optional(),
  regionId: regionSchema.optional(),
  neededBy: z.string().datetime().or(z.string().date()),
});
export type CreateDemandOrderInput = z.infer<typeof createDemandOrderSchema>;

export const proposeMatchSchema = z.object({
  demandOrderId: z.string().uuid(),
  produceListingId: z.string().uuid(),
  matchedQuantity: z.number().positive("Quantity must be greater than 0"),
  proposedPricePerUnit: z.number().positive().optional(),
});
export type ProposeMatchInput = z.infer<typeof proposeMatchSchema>;

// --- Quality ---------------------------------------------------------------

export const createQualityInspectionSchema = z.object({
  produceListingId: z.string().uuid(),
  grade: qualityGradeSchema,
  notes: z.string().trim().max(1000).optional(),
  images: z.array(z.string().url()).max(6).optional(),
});
export type CreateQualityInspectionInput = z.infer<typeof createQualityInspectionSchema>;

// --- Logistics ---------------------------------------------------------------

export const requestShipmentSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  deliveryLocation: z.string().trim().min(2, "Enter a delivery location").max(240),
});
export type RequestShipmentInput = z.infer<typeof requestShipmentSchema>;

export const shipmentStatusSchema = z.enum(["IN_TRANSIT", "DELIVERED", "CANCELLED"]);
export const updateShipmentStatusSchema = z.object({ status: shipmentStatusSchema });
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;

// --- Storage -----------------------------------------------------------------

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  regionId: regionSchema,
  district: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  capacityTonnes: z.number().positive().optional(),
});
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

// --- Finance -------------------------------------------------------------

export const initiatePaymentSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  provider: mobileMoneyProviderSchema,
});
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// --- Pagination / query helpers ----------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;
