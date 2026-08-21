// Shared Zod validation schemas. One schema per entity/action, imported by
// both apps/api/src/validators/ and frontend forms so validation rules
// never drift between client and server.

import { z } from "zod";
import { CROPS, REGIONS, UNITS, QUALITY_GRADES, MOBILE_MONEY_PROVIDERS, ROLES, CHANNELS } from "@agroflow/config";

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
export const channelSchema = z.enum(CHANNELS);

// --- Identity --------------------------------------------------------------

// `role` is intentionally NOT part of registration input -- a user can no
// longer self-select their role (security hardening). New accounts start
// with zero roles/permissions; see requestRoleSchema below for how a role
// is obtained afterwards (request -> admin approval).
export const registerSchema = z.object({
  phoneNumber: tanzaniaPhoneSchema,
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  password: passwordSchema.optional(), // optional: OTP-only signup for field roles
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
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

// --- Role requests -----------------------------------------------------------
// ADMIN can never be self-requested here -- granting the admin role is a
// manual, out-of-band operation (seed script / direct DB access), not
// something reachable through the public API surface.
export const requestRoleSchema = z.object({
  role: roleNameSchema.refine((role) => role !== "ADMIN", {
    message: "The ADMIN role cannot be requested through this flow",
  }),
  scopeId: z.string().trim().max(120).optional(),
});
export type RequestRoleInput = z.infer<typeof requestRoleSchema>;

export const rejectRoleRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type RejectRoleRequestInput = z.infer<typeof rejectRoleRequestSchema>;

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

// --- Trust (Review / Dispute) -------------------------------------------------

export const createReviewSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const createDisputeSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  reason: z.string().trim().min(5, "Describe the issue in a bit more detail").max(500),
});
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const resolveDisputeSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  resolutionNotes: z.string().trim().max(500).optional(),
});
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

// --- Aggregation (Inventory) ---------------------------------------------------

export const createInventorySchema = z.object({
  crop: cropSchema,
  quantity: z.number().positive(),
  unit: unitSchema,
  warehouseId: z.string().uuid().optional(),
});
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const updateInventorySchema = z.object({
  quantity: z.number().positive(),
});
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

// --- Logistics (Storage bookings) ----------------------------------------------

export const createStorageBookingSchema = z.object({
  warehouseId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional(),
  quantityTonnes: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});
export type CreateStorageBookingInput = z.infer<typeof createStorageBookingSchema>;

// --- Notifications ---------------------------------------------------------

export const updateNotificationPreferencesSchema = z.object({
  preferredChannel: channelSchema,
});
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

// --- Pagination / query helpers ----------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;
