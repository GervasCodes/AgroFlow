# AgroFlow API Reference

Base path for everything below (except channel routes): `/api/v1`.
Source of truth is the route files themselves
(`apps/api/src/routes/*.ts`) -- this document is a map of what exists
and how it's protected, not a substitute for reading the code.

## Conventions

- **Auth**: unless noted, a route requires `requireAuth` (a valid access
  token) plus `requireCapability("<resource>", "<action>")`, which
  checks the caller's permissions (see `packages/config`'s
  `DEFAULT_ROLE_PERMISSIONS` for which roles get which permissions, and
  `apps/api/src/middleware/rbac.ts` for the enforcement itself). This is
  the single source of truth for authorization -- UI-side role checks
  (`apps/web/src/hooks/useRole.ts`, mobile's equivalent) are convenience
  only.
- **Responses**: every endpoint returns `{ success: true, data }` on
  success or `{ success: false, error }` on failure (see
  `packages/types`' `ApiSuccess`/`ApiError`).
- **Validation**: request bodies are validated with the Zod schemas in
  `packages/validation` before a controller ever sees them
  (`validateBody` middleware) -- a 400 with field-level errors is
  returned automatically on a bad payload.
- **IDs**: all resource IDs are UUIDs.

## Auth -- `/auth`

No auth required except `/me`.

| Method | Path | Notes |
|---|---|---|
| POST | `/register` | No `role` field (Phase 1) -- new accounts start with zero roles. See Role requests below. |
| POST | `/login` | Phone + password. |
| POST | `/otp/request` | Starts OTP login (primary path for field roles). |
| POST | `/otp/verify` | Completes OTP login, issues tokens. |
| POST | `/refresh` | Rotates the refresh token. |
| POST | `/logout` | Revokes the refresh token. |
| GET | `/me` | `requireAuth`. Current user + roles + permissions. |

## Role requests -- `/role-requests`

Replaces self-selected role at registration: a user requests a role,
an ADMIN (`role:approve`) reviews it. ADMIN itself can never be
self-requested through this flow.

| Method | Path | Auth |
|---|---|---|
| POST | `/` | any authenticated user |
| GET | `/mine` | any authenticated user |
| GET | `/` | `role:approve` -- pending requests |
| POST | `/:id/approve` | `role:approve` |
| POST | `/:id/reject` | `role:approve` |

## Users -- `/users`

| Method | Path | Auth |
|---|---|---|
| GET | `/` | `user:read` (Admin Console's user list) |

## Farms -- `/farms`

| Method | Path | Auth |
|---|---|---|
| GET | `/mine` | `farm:read` |
| POST | `/` | `farm:create` |
| GET | `/:id` | `farm:read` |

## Produce listings -- `/produce-listings`

| Method | Path | Auth |
|---|---|---|
| GET | `/` | `produce_listing:read` -- browse published listings (buyers/aggregators too, not just the owning farmer) |
| GET | `/mine` | `produce_listing:read` |
| POST | `/` | `produce_listing:create` |
| POST | `/:id/publish` | `produce_listing:update` |
| POST | `/:id/withdraw` | `produce_listing:update` |

## Demand orders -- `/demand-orders`

| Method | Path | Auth |
|---|---|---|
| GET | `/mine` | `demand_order:read` |
| POST | `/` | `demand_order:create` |
| GET | `/:id` | `demand_order:read` |

## Matches -- `/matches`

`/as-buyer` and `/as-seller` are separate list endpoints since the two
sides of a match are different query shapes (by demand order vs. by
listing ownership), even though both use `match:read`.

| Method | Path | Auth |
|---|---|---|
| GET | `/as-buyer` | `match:read` |
| GET | `/as-seller` | `match:read` |
| POST | `/` | `match:create` -- propose a match |
| POST | `/:id/approve` | `match:approve` |
| POST | `/:id/reject` | `match:approve` |

## Purchase orders -- `/purchase-orders`

Read-only -- a purchase order is created as a side effect of a match
being approved, not directly.

| Method | Path | Auth |
|---|---|---|
| GET | `/as-buyer` | `purchase_order:read` |
| GET | `/as-seller` | `purchase_order:read` |

## Quality inspections -- `/quality-inspections`

| Method | Path | Auth |
|---|---|---|
| GET | `/listing/:listingId` | `quality_inspection:read` |
| POST | `/` | `quality_inspection:create` |

## Shipments -- `/shipments`

| Method | Path | Auth |
|---|---|---|
| GET | `/available` | `shipment:read` -- unclaimed jobs |
| GET | `/as-buyer` | `shipment:read` |
| GET | `/as-transporter` | `shipment:read` |
| POST | `/` | `shipment:create` -- request a shipment for an order |
| POST | `/:id/claim` | `shipment:update` |
| POST | `/:id/status` | `shipment:update` -- advance the Shipment Lifecycle |

## Warehouses -- `/warehouses`

| Method | Path | Auth |
|---|---|---|
| GET | `/` | `warehouse:read` -- directory |
| GET | `/mine` | `warehouse:read` |
| POST | `/` | `warehouse:create` |
| POST | `/:id/utilization` | `warehouse:update` |

## Logistics -- `/logistics`

Shipment CRUD stays under `/shipments`; this covers the dispatch board
aggregate view and StorageBooking (deferred at schema-inception until
Logistics had something to book warehouse capacity against).

| Method | Path | Auth |
|---|---|---|
| GET | `/dispatch-board` | `shipment:read` -- unclaimed jobs, dispatcher view |
| POST | `/storage-bookings` | `storage_booking:create` |
| GET | `/storage-bookings/mine` | `storage_booking:read` |
| GET | `/storage-bookings/warehouse/:warehouseId` | `storage_booking:read` |

## Aggregation (inventory) -- `/inventory`

| Method | Path | Auth |
|---|---|---|
| POST | `/` | `inventory:create` |
| GET | `/mine` | `inventory:read` |
| PATCH | `/:id` | `inventory:update` |

## Payments -- `/payments`

Two *different* webhook routes with two *different* trust boundaries --
neither uses `requireAuth`, since a payment gateway isn't a logged-in
user:

| Method | Path | Auth |
|---|---|---|
| GET | `/mine` | `payment:read` |
| POST | `/` | `payment:create` -- initiates a real AzamPay charge |
| POST | `/webhook` | static shared secret (`requirePaymentWebhookSecret`) -- internal/manual testing only |
| POST | `/webhook/mobile-money` | HMAC signature (`requireMobileMoneySignature`) -- the real AzamPay callback target |

## Reviews / Disputes (Trust) -- `/reviews`, `/disputes`

| Method | Path | Auth |
|---|---|---|
| POST | `/reviews` | `review:create` |
| GET | `/reviews/user/:userId` | `review:read` |
| POST | `/disputes` | `dispute:create` |
| GET | `/disputes/mine` | `dispute:read` |
| GET | `/disputes` | `dispute:approve` -- open disputes, admin review queue |
| POST | `/disputes/:id/resolve` | `dispute:approve` |

## Analytics -- `/analytics`

Desk-role reporting (`DESK_ROLES` in `packages/config`: BUYER,
AGGREGATOR, TRANSPORTER, WAREHOUSE_MANAGER, PROCESSOR_EXPORTER, ADMIN),
not gated by a dedicated permission.

| Method | Path |
|---|---|
| GET | `/channel-mix` |
| GET | `/price-trends` |
| GET | `/dispute-rate` |

## AI -- `/ai`

Called only from the backend's own scoring logic, never an external
model -- see `services/ai`.

| Method | Path | Auth |
|---|---|---|
| GET | `/recommendations/:demandOrderId` | `demand_order:read` (+ ownership check in the service) |

## Notifications -- `/notifications`

Every authenticated user manages their own.

| Method | Path |
|---|---|
| GET | `/preferences` |
| PATCH | `/preferences` |
| GET | `/history` |

## Channels -- `/channels`

Not user-facing. Every route requires the `X-Channel-Secret` header
(`requireChannelSecret`) and resolves the acting user by phone number
instead of a JWT (`resolveChannelUser`) -- this is how USSD/SMS/WhatsApp
act on a user's behalf without them ever logging in through those
channels. Currently backs USSD's "Sell Produce" menu; SMS/WhatsApp bots
reuse the same surface.

| Method | Path |
|---|---|
| GET | `/farms` |
| POST | `/produce-listings` |

## Test-only routes -- `/test`

Mounted only when `NODE_ENV !== "production"` (see `routes/index.ts`) --
verification helpers for the RBAC gate. Never reachable in production
regardless of secrets or headers.
