# AgroFlow Data Model

Source of truth for the schema itself is `database/prisma/schema.prisma`
-- this document explains the domain groupings and the decisions behind
them, without duplicating field-by-field detail that goes stale the
moment the schema changes.

Postgres + PostGIS via Prisma. Every table uses a UUID primary key and
`snake_case` columns (`@map`), matching the identifier style used
everywhere else in this monorepo.

## Domains, in the order they were built

### IDENTITY
`User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `OtpCode`,
`RefreshToken`, `RoleRequest`.

A user is **not** given a role at registration (Phase 1 hardening) --
`UserRole` starts empty. `RoleRequest` is how a role is obtained
afterwards: a user requests one, an ADMIN approves or rejects it, and
approval is what writes the `UserRole` row. `RoleRequest.reviewedByUserId`
+ `reviewedAt` is the durable approval/rejection log for that specific
flow.

`Permission` rows are seeded (`database/prisma/seed.ts`) as the full
cross-product of `RESOURCES` x `ACTIONS` from `packages/config` -- the
schema itself has no opinion on which permissions exist; that's config,
not data.

### AGRICULTURE
`Farm`, `Crop`, `FarmCrop`, `ProduceListing`.

`ProduceListing.createdByChannel` records which of App/Web/USSD/
WhatsApp/SMS/Agent-assisted a listing came from -- this is what Analytics'
channel-mix report reads.

### MARKETPLACE
`DemandOrder`, `Match`, `PurchaseOrder`, `OrderItem`.

`SupplyOffer`/`Negotiation` (a fuller RFQ-style negotiation flow) were
considered and deliberately deferred -- `Match` (propose/approve/reject)
covers the matching workflow AgroFlow actually needs today.

### QUALITY
`QualityInspection` -- one inspection record per (listing, inspector),
grading against `QUALITY_GRADES`.

### LOGISTICS
`Shipment`.

### STORAGE
`Warehouse`, `StorageBooking`.

`StorageBooking` was deferred at schema-inception until Logistics and
Finance had something to integrate it with -- it landed once
`services/logistics` needed a way to book warehouse capacity against a
`PurchaseOrder`.

### FINANCE
`Payment`, `PaymentTransaction`, `Settlement`, `Invoice`, `Refund`.

`Payment` is the user-facing record (one per purchase order);
`PaymentTransaction` is the granular log underneath it -- every gateway
interaction (initiation, callback, reversal) gets a row, and it's what
makes the AzamPay webhook handler idempotent (a callback whose
`providerReference` already has a recorded `PaymentTransaction` is not
reprocessed). `Settlement` is the platform's payout to the seller once
a `Payment` is `CONFIRMED`. Deliberately provider-agnostic: nothing in
this domain assumes AzamPay specifically, so swapping the concrete
mobile-money adapter (`apps/api/src/integrations/mobile-money`) never
touches the schema.

### TRUST
`Review`, `Dispute`, `TrustScore`.

`Dispute.status` mirrors `PurchaseOrderStatus`'s existing `DISPUTED`
value -- filing a dispute moves the order into that state. `TrustScore`
is a rolling per-user aggregate (completed orders, disputes filed
against, disputes filed by), created lazily on first read/adjustment
rather than at registration. `services/ai` reads it when ranking match
recommendations; `services/analytics` reads `Dispute` for the
dispute-rate report.

### CHANNEL / COMMUNICATION
`USSDSession`, `SMSMessage`, `WhatsAppMessage`, `AgentAssistedAction`.

`USSDSession`/`SMSMessage`/`WhatsAppMessage` are keyed by **phone
number**, not a `User` relation -- a field-role person can interact
over USSD/SMS before (or without ever) completing registration, and
these tables need to represent that. `SMSMessage`/`WhatsAppMessage` are
also the delivery log `services/notifications` writes to on every
dispatch, and what Phase 4's real gateway integrations
(`channels/sms`, `channels/whatsapp`) update from `QUEUED` through
`SENT`/`DELIVERED`/`FAILED`.

### ADMIN
`AuditLog` -- a general-purpose action trail for admin-sensitive
operations. `RoleRequest`'s own `reviewedByUserId`/`reviewedAt` remains
the durable record for that specific flow; `AuditLog` is what other
admin actions (e.g. dispute resolution) write to.

### AGGREGATION
`Inventory` -- the bulk lots an AGGREGATOR or WAREHOUSE_MANAGER holds
after consolidating produce from multiple listings, optionally held at
a `Warehouse` they don't necessarily own.

## Entity relationship overview

```
User ──< UserRole >── Role ──< RolePermission >── Permission
User ──< RoleRequest (reviewed by another User)
User ──< Farm ──< FarmCrop >── Crop
Farm ──< ProduceListing >── Crop
ProduceListing ──< Match >── DemandOrder ──(buyer)── User
Match ──> PurchaseOrder ──< OrderItem
PurchaseOrder ──< Shipment (1:1)
PurchaseOrder ──< Payment (1:1) ──< PaymentTransaction
PurchaseOrder ──< Settlement (1:1), Invoice (1:1)
PurchaseOrder ──< Review, Dispute
PurchaseOrder ──< StorageBooking >── Warehouse
User ──< TrustScore (1:1)
User ──< Inventory >── Crop, (optional) Warehouse
User (as owner) ──< Warehouse ──< StorageBooking, Inventory
```

## Conventions worth knowing before touching the schema

- Every foreign key gets an `@@index` unless it's already covered by a
  `@@unique`/compound key that starts with it.
- Enums are named `<Model>Status` (or similar) and kept in the same
  file, immediately above the model that uses them.
- A relation that could point back to the same model twice (e.g.
  `Dispute.raisedBy` / `Dispute.resolvedBy`, both `User`) always uses a
  named relation (`@relation("DisputeRaisedBy")`) to disambiguate.
- Migrations are hand-authored to match `prisma migrate dev`'s own
  output style (see any file under `database/prisma/migrations/`) in
  environments where the Prisma engine binaries aren't reachable
  (network-restricted sandboxes) -- always verify with
  `prisma migrate diff` / `prisma validate` against a real database
  before applying to production.
