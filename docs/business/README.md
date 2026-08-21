# AgroFlow -- Business & Product Notes

## What AgroFlow is

A Tanzania-first agricultural supply chain platform connecting farmers,
buyers, aggregators, transporters, and warehouse operators across five
channels (App, Web, USSD, WhatsApp, Agent-assisted) on one shared
backend. The channel a person uses is a convenience choice, not a
different product -- a farmer without a smartphone reaches the same
marketplace, roles, and orders as a buyer on the web console.

## Roadmap status

The phased build (see `docs/BUILD_ORDER.md`) has shipped:

- **Identity & RBAC** -- registration, OTP + password login, an
  admin-reviewed role-request flow (no self-selected roles).
- **Agriculture & Marketplace** -- farms, produce listings, demand
  orders, matching, purchase orders.
- **Quality** -- inspection records against a standard grading scale.
- **Logistics & Storage** -- shipment lifecycle, dispatch board,
  warehouse directory, storage bookings.
- **Finance** -- provider-agnostic mobile-money payments (AzamPay
  adapter live), settlements, invoices, refunds.
- **Trust** -- post-order reviews, disputes with admin resolution, a
  rolling per-user trust score.
- **Aggregation** -- consolidated inventory lots for aggregators and
  warehouse managers.
- **Analytics & AI** -- channel-mix / price-trend / dispute-rate
  reporting; an explainable match-recommendation score for buyers.
- **Channels** -- USSD "Sell Produce" menu, SMS notifications
  (Africa's Talking), WhatsApp bot (Meta Cloud API).
- **Web** -- full desk-role console (farms through admin, plus a
  role-switcher for multi-role accounts).
- **Mobile** -- offline-first farmer flows, plus companion screens for
  buyer, aggregator, transporter, and warehouse manager.

**Not yet built**, in rough priority order: a full RFQ/negotiation flow
beyond direct matching (deliberately deferred, see docs/database);
mobile screens for PROCESSOR_EXPORTER and ADMIN (both are web-first
today); push notifications as a channel distinct from SMS; a
self-serve KYC/verification step for new accounts beyond phone OTP.

## Monetization directions

Nothing here is implemented as billing logic yet -- these are the
levers the current data model already supports, in order of how little
new schema they'd need:

1. **Transaction fee on Settlement.** Every completed `PurchaseOrder`
   already produces a `Settlement` (platform payout to the seller) --
   a percentage-based platform fee is a one-field addition to that
   model, not a new domain.
2. **Storage booking fee.** `StorageBooking` already has
   `quantityTonnes` and a date range; a per-tonne-day rate is a natural
   extension for warehouse partners on the platform.
3. **Premium listing placement.** `ProduceListing` and the AI
   recommendation scoring (`services/ai`) already rank candidates --
   a paid boost would be a scoring input, not new infrastructure.
4. **SMS/USSD cost pass-through.** `SMSMessage`/`WhatsAppMessage` are
   already logged per-dispatch; per-message cost accounting is a
   straightforward aggregate over an existing table.
5. **Aggregator/processor subscription tier** for higher `Inventory`
   lot limits or priority dispatch-board visibility.

## Risk register

| Risk | Notes |
|---|---|
| **Payment provider dependency** | The mobile-money integration is deliberately provider-agnostic in schema and service logic (`services/payments` never assumes AzamPay specifically) precisely so a provider outage or contract change doesn't require a data-model migration -- only a new adapter in `integrations/mobile-money`. |
| **Connectivity / offline data loss** | The mobile offline queue (`sync/offlineQueue.ts`) is scoped only to writes that plausibly happen at the edge of signal (listings, quality inspections, shipment status). A device lost or reset before a flush loses queued writes -- there's no server-side draft state to recover from. |
| **Trust & dispute abuse** | `TrustScore` and `Dispute` currently trust the two parties to a `PurchaseOrder` to raise disputes honestly; there's no fraud-detection layer yet, so a bad-faith dispute pattern would need to be caught by an admin reviewing the `/disputes` queue manually. |
| **Regulatory: mobile money** | AzamPay (or any aggregator swapped in later) operates under its own licensing; AgroFlow never touches raw mobile-money credentials or holds float directly -- confirm this stays true as Settlement/payout logic is built out. |
| **Regulatory: data residency / PostGIS location data** | Farm and warehouse location data is sensitive for smallholder farmers specifically (land tenure disputes, safety). No policy decision has been made yet on retention or third-party access to geo data. |
| **Seasonal demand concentration** | Agricultural marketplaces are inherently seasonal (harvest windows); infrastructure and support load will spike around specific crop calendars rather than being steady year-round -- not yet load-tested for that pattern. |
| **Channel parity drift** | Five channels (App/Web/USSD/WhatsApp/Agent) all need to stay behind the same RBAC and business logic. USSD/SMS/WhatsApp intentionally reuse the same `/channels/*` API surface rather than duplicating logic, but new features added to Web/Mobile first will lag on the other channels unless that's tracked deliberately. |

## Notes on this document

This reflects what's actually implemented as of the phased build
referenced above, plus product judgment grounded in that implementation
-- it does not track a separate external master specification. Update
it alongside the roadmap as new domains land, rather than letting it
drift into aspirational-but-unbuilt territory.
