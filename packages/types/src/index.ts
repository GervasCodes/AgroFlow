// Shared TypeScript types, used by apps/api, apps/web and apps/mobile.
// Role/Permission enums are defined ONCE in @agroflow/config (the const
// arrays) -- this package re-exports them as types and builds the actual
// domain shapes (User, Farm, Crop, ProduceListing, ...) on top.
//
// This is the single source of truth that RBAC (apps/api/src/middleware/
// rbac.ts) and every frontend role check ultimately import from.
//
// Build order (mirrors Section 9 of the master documentation and
// docs/BUILD_ORDER.md): Identity -> Agriculture -> Marketplace -> ...
// Only Identity + Agriculture are defined here in Phase 1/2; the rest are
// added domain-by-domain as each phase is reached.

import type {
  RoleName,
  Resource,
  Action,
  CropName,
  RegionName,
  MobileMoneyProvider,
  UnitName,
  QualityGradeName,
  ChannelName,
} from "@agroflow/config";

export type {
  RoleName,
  Resource,
  Action,
  CropName,
  RegionName,
  MobileMoneyProvider,
  UnitName,
  QualityGradeName,
  ChannelName,
} from "@agroflow/config";

// ============================================================================
// IDENTITY
// ============================================================================

export interface Permission {
  id: string;
  /** "<resource>:<action>", e.g. "farm:create". Built with permissionKey(). */
  key: string;
  resource: Resource;
  action: Action;
  description?: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description?: string;
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  /** Optional scoping, e.g. a warehouse manager's assigned warehouse. */
  scopeId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  /** Optional -- many field-role users authenticate by phone + OTP only. */
  email?: string;
  passwordHash?: string;
  preferredLanguage: "en" | "sw";
  preferredChannel: ChannelName;
  regionId?: RegionName;
  isVerified: boolean;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

/** Shape of the authenticated user attached to a request after auth middleware runs. */
export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  roles: RoleName[];
  permissions: string[];
}

// ============================================================================
// AGRICULTURE
// ============================================================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  regionId: RegionName;
  district?: string;
  ward?: string;
  village?: string;
  location?: GeoPoint;
  sizeHectares?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  name: CropName;
  varietyName?: string;
  defaultUnit: UnitName;
}

export interface FarmCrop {
  id: string;
  farmId: string;
  cropId: string;
  plantedAreaHectares?: number;
  expectedHarvestDate?: string;
}

export type ProduceListingStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "MATCHED"
  | "SOLD"
  | "EXPIRED"
  | "WITHDRAWN";

export interface ProduceListing {
  id: string;
  farmId: string;
  cropId: string;
  quantity: number;
  unit: UnitName;
  qualityGrade?: QualityGradeName;
  pricePerUnit?: number;
  currency: "TZS";
  status: ProduceListingStatus;
  availableFrom: string;
  images: string[];
  createdByChannel: ChannelName;
  createdAt: string;
  updatedAt: string;
}

/** Shape actually returned by GET /produce-listings and /produce-listings/mine
 * -- the API includes the related Crop and a slice of the Farm alongside
 * the base ProduceListing fields (see apps/api's produce-listing.repository). */
export interface ProduceListingWithRelations extends ProduceListing {
  crop: Crop;
  farm: Pick<Farm, "id" | "name" | "regionId" | "ownerId">;
}

// ============================================================================
// MARKETPLACE
// ============================================================================
// Phase 8 scope: DemandOrder, Match, PurchaseOrder, OrderItem -- see
// database/prisma/schema.prisma's MARKETPLACE section for the full
// rationale (SupplyOffer/Negotiation deferred).

export type DemandOrderStatus = "OPEN" | "MATCHED" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export interface DemandOrder {
  id: string;
  buyerId: string;
  cropId: string;
  quantity: number;
  unit: UnitName;
  qualityGrade?: QualityGradeName;
  maxPricePerUnit?: number;
  currency: "TZS";
  regionId?: RegionName;
  neededBy: string;
  status: DemandOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DemandOrderWithRelations extends DemandOrder {
  crop: Crop;
}

export type MatchStatus = "PROPOSED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface Match {
  id: string;
  demandOrderId: string;
  produceListingId: string;
  matchedQuantity: number;
  proposedPricePerUnit?: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MatchWithRelations extends Match {
  demandOrder: DemandOrderWithRelations;
  produceListing: ProduceListingWithRelations;
}

export type PurchaseOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_FULFILLMENT"
  | "DELIVERED"
  | "PAID"
  | "CANCELLED"
  | "DISPUTED";

export interface OrderItem {
  id: string;
  purchaseOrderId: string;
  produceListingId: string;
  quantity: number;
  unit: UnitName;
  pricePerUnit: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  matchId: string;
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  currency: "TZS";
  status: PurchaseOrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// QUALITY
// ============================================================================
// Phase 9 scope: QualityInspection only -- see database/prisma/schema.prisma's
// QUALITY section for the full rationale (QualityCertificate deferred).

export interface QualityInspection {
  id: string;
  produceListingId: string;
  inspectorId: string;
  grade: QualityGradeName;
  notes?: string;
  images: string[];
  inspectedAt: string;
  createdAt: string;
}

export interface QualityInspectionWithRelations extends QualityInspection {
  inspector: Pick<User, "id" | "fullName">;
}

// ============================================================================
// LOGISTICS
// ============================================================================
// Phase 10 scope: Shipment only -- see database/prisma/schema.prisma's
// LOGISTICS section for the full rationale.

export type ShipmentStatus = "PENDING_PICKUP" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Shipment {
  id: string;
  purchaseOrderId: string;
  transporterId?: string;
  deliveryLocation: string;
  status: ShipmentStatus;
  scheduledPickupAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentWithRelations extends Shipment {
  purchaseOrder: Pick<PurchaseOrder, "id" | "buyerId" | "sellerId" | "totalAmount" | "currency">;
  transporter?: Pick<User, "id" | "fullName" | "phoneNumber">;
}

// ============================================================================
// STORAGE
// ============================================================================
// Phase 11 scope: Warehouse only -- see database/prisma/schema.prisma's
// STORAGE section for the full rationale (StorageBooking deferred).

export interface Warehouse {
  id: string;
  ownerId: string;
  name: string;
  regionId: RegionName;
  district?: string;
  address?: string;
  capacityTonnes?: number;
  currentUtilization?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FINANCE
// ============================================================================
// Phase 12 scope: Payment only, provider-agnostic -- see
// database/prisma/schema.prisma's FINANCE section for the full rationale.

export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  purchaseOrderId: string;
  payerId: string;
  amount: number;
  currency: "TZS";
  provider: MobileMoneyProvider;
  providerReference?: string;
  status: PaymentStatus;
  initiatedAt: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API ENVELOPES
// ============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
