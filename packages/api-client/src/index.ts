// Thin wrapper around fetch for calling the AgroFlow API (base: /api/v1
// -- see Section 22). Centralises auth-header attachment, base URL
// config and error handling here so web and mobile do not each
// reinvent it. Only the auth/ endpoints are wired up in Phase 4; add a
// method here per endpoint as each domain's routes are built, mirroring
// the request/response shapes in @agroflow/types and @agroflow/validation.
import type {
  ApiResponse,
  AuthenticatedUser,
  Farm,
  ProduceListingWithRelations,
  DemandOrderWithRelations,
  MatchWithRelations,
  PurchaseOrder,
  QualityInspectionWithRelations,
  ShipmentWithRelations,
  Warehouse,
  Payment,
  User,
  RoleRequest,
  RoleRequestWithUser,
  DisputeWithRelations,
  InventoryWithRelations,
  StorageBookingWithRelations,
  ChannelMixEntry,
  PriceTrendEntry,
  DisputeRateSummary,
} from "@agroflow/types";
import type {
  RegisterInput,
  LoginInput,
  RequestOtpInput,
  VerifyOtpInput,
  CreateFarmInput,
  CreateProduceListingInput,
  CreateDemandOrderInput,
  ProposeMatchInput,
  CreateQualityInspectionInput,
  RequestShipmentInput,
  UpdateShipmentStatusInput,
  CreateWarehouseInput,
  InitiatePaymentInput,
  RequestRoleInput,
  RejectRoleRequestInput,
  CreateDisputeInput,
  ResolveDisputeInput,
  CreateInventoryInput,
  UpdateInventoryInput,
  CreateStorageBookingInput,
} from "@agroflow/validation";

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Called on every request to attach the current access token, if any. */
  getAccessToken?: () => string | null;
}

export function createApiClient(options: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = options.getAccessToken?.();
    const res = await fetch(`${options.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const body = (await res.json()) as ApiResponse<T>;
    if (!body.success) {
      throw new ApiClientError(body.error.code, body.error.message, body.error.details);
    }
    return body.data;
  }

  return {
    auth: {
      register: (input: RegisterInput) =>
        request<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
      login: (input: LoginInput) =>
        request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
      requestOtp: (input: RequestOtpInput) =>
        request<{ expiresInMinutes: number }>("/auth/otp/request", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      verifyOtp: (input: VerifyOtpInput) =>
        request<AuthResult>("/auth/otp/verify", { method: "POST", body: JSON.stringify(input) }),
      refresh: (refreshToken: string) =>
        request<AuthResult>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
      logout: (refreshToken: string) =>
        request<{ loggedOut: boolean }>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }),
      me: () => request<AuthenticatedUser>("/auth/me"),
    },
    farms: {
      listMine: () => request<Farm[]>("/farms/mine"),
      create: (input: CreateFarmInput) =>
        request<Farm>("/farms", { method: "POST", body: JSON.stringify(input) }),
      getById: (id: string) => request<Farm>(`/farms/${id}`),
    },
    produceListings: {
      browse: (filters?: { crop?: string; regionId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.crop) params.set("crop", filters.crop);
        if (filters?.regionId) params.set("regionId", filters.regionId);
        const qs = params.toString();
        return request<ProduceListingWithRelations[]>(`/produce-listings${qs ? `?${qs}` : ""}`);
      },
      listMine: () => request<ProduceListingWithRelations[]>("/produce-listings/mine"),
      create: (input: CreateProduceListingInput) =>
        request<ProduceListingWithRelations>("/produce-listings", { method: "POST", body: JSON.stringify(input) }),
      publish: (id: string) => request<ProduceListingWithRelations>(`/produce-listings/${id}/publish`, { method: "POST" }),
      withdraw: (id: string) => request<ProduceListingWithRelations>(`/produce-listings/${id}/withdraw`, { method: "POST" }),
    },
    demandOrders: {
      listMine: () => request<DemandOrderWithRelations[]>("/demand-orders/mine"),
      create: (input: CreateDemandOrderInput) =>
        request<DemandOrderWithRelations>("/demand-orders", { method: "POST", body: JSON.stringify(input) }),
      getById: (id: string) => request<DemandOrderWithRelations>(`/demand-orders/${id}`),
    },
    matches: {
      listAsBuyer: () => request<MatchWithRelations[]>("/matches/as-buyer"),
      listAsSeller: () => request<MatchWithRelations[]>("/matches/as-seller"),
      propose: (input: ProposeMatchInput) =>
        request<MatchWithRelations>("/matches", { method: "POST", body: JSON.stringify(input) }),
      approve: (id: string) =>
        request<{ match: MatchWithRelations; purchaseOrder: PurchaseOrder }>(`/matches/${id}/approve`, {
          method: "POST",
        }),
      reject: (id: string) => request<MatchWithRelations>(`/matches/${id}/reject`, { method: "POST" }),
    },
    purchaseOrders: {
      listAsBuyer: () => request<PurchaseOrder[]>("/purchase-orders/as-buyer"),
      listAsSeller: () => request<PurchaseOrder[]>("/purchase-orders/as-seller"),
    },
    qualityInspections: {
      listForListing: (listingId: string) =>
        request<QualityInspectionWithRelations[]>(`/quality-inspections/listing/${listingId}`),
      create: (input: CreateQualityInspectionInput) =>
        request<QualityInspectionWithRelations>("/quality-inspections", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    shipments: {
      listAvailable: () => request<ShipmentWithRelations[]>("/shipments/available"),
      listAsBuyer: () => request<ShipmentWithRelations[]>("/shipments/as-buyer"),
      listAsTransporter: () => request<ShipmentWithRelations[]>("/shipments/as-transporter"),
      request: (input: RequestShipmentInput) =>
        request<ShipmentWithRelations>("/shipments", { method: "POST", body: JSON.stringify(input) }),
      claim: (id: string) => request<ShipmentWithRelations>(`/shipments/${id}/claim`, { method: "POST" }),
      updateStatus: (id: string, input: UpdateShipmentStatusInput) =>
        request<ShipmentWithRelations>(`/shipments/${id}/status`, { method: "POST", body: JSON.stringify(input) }),
    },
    warehouses: {
      browse: (regionId?: string) =>
        request<Warehouse[]>(`/warehouses${regionId ? `?regionId=${encodeURIComponent(regionId)}` : ""}`),
      listMine: () => request<Warehouse[]>("/warehouses/mine"),
      create: (input: CreateWarehouseInput) =>
        request<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(input) }),
      updateUtilization: (id: string, currentUtilization: number) =>
        request<Warehouse>(`/warehouses/${id}/utilization`, {
          method: "POST",
          body: JSON.stringify({ currentUtilization }),
        }),
    },
    payments: {
      listMine: () => request<Payment[]>("/payments/mine"),
      initiate: (input: InitiatePaymentInput) =>
        request<{ payment: Payment; instructions: string }>("/payments", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    },
    roleRequests: {
      request: (input: RequestRoleInput) =>
        request<RoleRequest>("/role-requests", { method: "POST", body: JSON.stringify(input) }),
      listMine: () => request<RoleRequest[]>("/role-requests/mine"),
      listPending: () => request<RoleRequestWithUser[]>("/role-requests"),
      approve: (id: string) => request<RoleRequest>(`/role-requests/${id}/approve`, { method: "POST" }),
      reject: (id: string, input?: RejectRoleRequestInput) =>
        request<RoleRequest>(`/role-requests/${id}/reject`, { method: "POST", body: JSON.stringify(input ?? {}) }),
    },
    users: {
      list: () => request<User[]>("/users"),
    },
    disputes: {
      create: (input: CreateDisputeInput) =>
        request<DisputeWithRelations>("/disputes", { method: "POST", body: JSON.stringify(input) }),
      listMine: () => request<DisputeWithRelations[]>("/disputes/mine"),
      listOpen: () => request<DisputeWithRelations[]>("/disputes"),
      resolve: (id: string, input: ResolveDisputeInput) =>
        request<DisputeWithRelations>(`/disputes/${id}/resolve`, { method: "POST", body: JSON.stringify(input) }),
    },
    logistics: {
      dispatchBoard: () => request<ShipmentWithRelations[]>("/logistics/dispatch-board"),
      createStorageBooking: (input: CreateStorageBookingInput) =>
        request<StorageBookingWithRelations>("/logistics/storage-bookings", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      listMyStorageBookings: () => request<StorageBookingWithRelations[]>("/logistics/storage-bookings/mine"),
      listWarehouseBookings: (warehouseId: string) =>
        request<StorageBookingWithRelations[]>(`/logistics/storage-bookings/warehouse/${warehouseId}`),
    },
    inventory: {
      create: (input: CreateInventoryInput) =>
        request<InventoryWithRelations>("/inventory", { method: "POST", body: JSON.stringify(input) }),
      listMine: () => request<InventoryWithRelations[]>("/inventory/mine"),
      updateQuantity: (id: string, input: UpdateInventoryInput) =>
        request<InventoryWithRelations>(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    },
    analytics: {
      channelMix: () => request<ChannelMixEntry[]>("/analytics/channel-mix"),
      priceTrends: () => request<PriceTrendEntry[]>("/analytics/price-trends"),
      disputeRate: () => request<DisputeRateSummary>("/analytics/dispute-rate"),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
