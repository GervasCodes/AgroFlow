# AgroFlow Architecture

## Layers

```
Users
  |
Channels: App (web+mobile) / USSD / SMS / WhatsApp / Agent-assisted
  |
API / Backend  (roles & permissions enforced HERE, and only here)
  |
Database: Postgres + PostGIS, via Prisma
  |
Payments / AI  (called only from the backend -- never client-side)
```

`apps/api/src/middleware/rbac.ts` is the single point of authorization
enforcement. Every other role check in the codebase (`apps/web/src/hooks/useRole.ts`,
mobile's equivalent, nav-item visibility) is UI convenience -- hiding a
button is not a security boundary, the API call behind it is what's
actually protected.

## Monorepo layout

pnpm workspaces: `apps/*`, `packages/*`, `channels/*`, `database`.

- **`apps/api`** -- Express + Prisma. `routes/` -> `controllers/` (thin,
  HTTP-shape only) -> `services/` (business logic) -> `repositories/`
  (Prisma queries only, no business logic). `middleware/` holds the
  cross-cutting concerns: `auth.ts` (JWT), `rbac.ts` (permissions),
  `channelAuth.ts` (shared-secret auth for USSD/SMS/WhatsApp),
  `paymentWebhookAuth.ts` / `mobileMoneySignature.ts` (two different
  webhook trust boundaries -- see docs/api).
- **`apps/web`** -- React + Vite + TanStack Query + React Router.
  Glassmorphism design system in `components/ui`. One feature module per
  domain under `features/<domain>/pages`, each with a barrel `index.ts`.
  Actively designed for desk-based roles (buyer, aggregator, warehouse
  manager, transporter dispatch, admin) but reachable by every role on
  the same account/backend.
- **`apps/mobile`** -- Expo Router. `app/(tabs)` is the shared shell;
  `app/(auth)` is the login/OTP/register flow; `app/farmer`,
  `app/buyer`, `app/aggregator`, `app/transporter`, `app/warehouse` are
  per-role screens, shown based on which roles the signed-in user holds
  (a user with multiple roles sees multiple tile sets on Home). Actively
  designed for field roles (farmer, village agent) with an
  offline-first Sell Produce flow; buyer/aggregator/transporter/
  warehouse screens are companion views to the web app, not full
  replacements for it.
- **`channels/ussd`**, **`channels/sms`**, **`channels/whatsapp`** --
  standalone services, each calling `apps/api`'s `/channels/*` surface
  (shared-secret auth, phone-number-resolved identity, no JWT -- see
  `middleware/channelAuth.ts`) rather than embedding business logic
  themselves. `channels/sms`'s gateway also serves as the outbound
  notification path other services call into (`services/notifications`).
- **`database`** -- the Prisma schema and migrations (see
  docs/database/README.md), shared by `apps/api` only. No other
  package talks to Postgres directly.
- **`packages/config`** -- single source of truth for roles, permission
  resource/action names, crops, regions, mobile money providers, units,
  quality grades, channel names. Every app imports these rather than
  redefining them.
- **`packages/types`** -- shared TypeScript interfaces mirroring the
  Prisma models, for the frontend/API-client boundary.
- **`packages/validation`** -- Zod schemas, shared between
  `apps/api` (request validation) and the frontends (client-side
  validation before a request is even sent).
- **`packages/api-client`** -- typed fetch wrapper around `/api/v1`,
  used by both `apps/web` and `apps/mobile` so the two don't drift.

## Cross-cutting patterns

- **Offline-first mobile writes**: `apps/mobile/src/sync/offlineQueue.ts`
  is a typed, multi-entry AsyncStorage queue (produce listings, quality
  inspections, shipment status updates) that auto-flushes on
  reconnection (`NetInfo`). It's deliberately scoped to writes that
  plausibly happen at the edge of signal -- desk-context actions
  (buyer approvals, warehouse bookings) are built online-first instead,
  since silently queuing something time-sensitive that other parties
  are waiting on can look like it succeeded when it hasn't.
- **Channel identity**: USSD/SMS/WhatsApp never see a JWT. They
  authenticate to the API with a shared secret header
  (`X-Channel-Secret`) and the API resolves "who is this" from the
  phone number in the request (`resolveChannelUser`). This is why
  `USSDSession`/`SMSMessage`/`WhatsAppMessage` are keyed by phone
  number rather than a `User` foreign key -- a field-role person can be
  mid-conversation with a channel before they've ever completed
  registration.
- **Payment idempotency**: mobile-money integration
  (`apps/api/src/integrations/mobile-money`) is provider-agnostic by
  design -- `services/payments` and the `Payment`/`PaymentTransaction`
  schema never assume AzamPay specifically, so swapping the concrete
  adapter never touches business logic or the schema. Every gateway
  interaction is logged to `PaymentTransaction`, which is also the
  idempotency check: a webhook callback whose `providerReference` is
  already recorded is not reprocessed, even if the gateway retries
  delivery.
- **Analytics/AI are read-only over existing tables.** Neither has its
  own datastore -- `services/analytics` aggregates
  `ProduceListing`/`PurchaseOrder`/`Dispute` on demand, and
  `services/ai`'s match-recommendation scoring is a transparent,
  explainable function (crop match, price fit, quality grade,
  `TrustScore`) rather than an external model call.
