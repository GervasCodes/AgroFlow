# AgroFlow

Agricultural Supply Chain Infrastructure -- Tanzania-first, connectivity-realistic, Africa-ready.

This is a structural scaffold only (folders + placeholder files with short purpose
comments). No business logic has been implemented. Follow the build order in
/docs/BUILD_ORDER.md.

See /docs/architecture/ for the system architecture and role/permission model,
and /database/prisma/schema.prisma for the data model starting point.



# AgroFlow — Master Implementation Guide & Roadmap

**Agricultural Supply Chain Infrastructure — Tanzania-first, Connectivity-realistic, Africa-ready**
Version 1.0 · Implementation edition — consolidates the Master Project Documentation v4.0, the UI/UX design direction, the architecture Q&A, and the project scaffold into one build reference.

Status: planning document — no implementation performed as part of producing this guide.

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [Product Overview](#2-product-overview)
3. [Market Context — Why Tanzania-First](#3-market-context--why-tanzania-first)
4. [Competitive Landscape & Whitespace](#4-competitive-landscape--whitespace)
5. [Design Principles](#5-design-principles)
6. [Core Architecture Decisions]   (#6-core-architecture-decisions)
7. [UI/UX Design Direction]   (#7-uiux-design-direction)
8. [Technology Stack]     (#8-technology-stack)
9. [Data Model Overview]   ( #9-data-model-overview)
10. [Project Structure]  (#10-project-structure)
11. [Implementation Roadmap]  (#11-implementation-roadmap)
12. [MVP Definition of Done]  (#12-mvp-definition-of-done)
13. [Key Risks & Mitigations]  (#13-key-risks--mitigations)
14. [Success Metrics / KPIs]  (#14-success-metrics--kpis)
15. [Next Steps]  ( #15-next-steps)

---

## 1. Vision & Mission

### Vision
A single digital layer that connects every actor in Tanzania's agricultural supply chain — farmers, buyers, aggregators, transporters, warehouses, processors and exporters — regardless of what device or connectivity they have access to, so that a smallholder farmer with a feature phone has the same access to fair markets, verified buyers and reliable payment as a business with a laptop and broadband.

### Mission
Build and prove one core loop — **farmer lists produce → buyer matches → quality is verified → produce moves → payment settles to mobile money** — in one region and one or two crops, end-to-end, before expanding scope. Every design and technical decision is filtered through one constraint: most first users will access AgroFlow on a feature phone, over 2G/3G, with low airtime budget and low formal digital literacy.

### What success looks like
- A farmer can sell produce and get paid without ever touching a smartphone app, using USSD or an agent.
- A buyer can source verified supply, track an order end-to-end, and pay without leaving the platform.
- No single channel outage (no app, no data, no smartphone) blocks a transaction from happening.
- The platform earns trust in one region/crop before asking to be trusted everywhere.

---

## 2. Product Overview

AgroFlow is a Tanzania-first agricultural supply-chain infrastructure platform. It coordinates production, supply, demand matching, quality, aggregation, storage, logistics, payments, analytics and AI — not just a crop listing board.

**Personas:** Farmer, Buyer, Aggregator, Transporter, Warehouse manager, Processor/Exporter (future), Admin, Village Agent (assists other roles).

**Core judgment call:** AgroFlow's hardest constraint is not the software — it is device, connectivity and literacy access. Every downstream decision (channel strategy, payments, UI, roadmap sequencing) is filtered through that constraint.

---

## 3. Market Context — Why Tanzania-First

### 3.1 Connectivity reality
- ~112 million mobile subscriptions vs. ~71 million population as of Q1 2026 (multi-SIM ownership, not universal individual access) — TCRA Q1 2026.
- Smartphone penetration only ~42.5% of connections (up from ~35% a year earlier) — feature phones remain the majority access mode.
- 4G population coverage ~94% — network reach is not the bottleneck; device affordability and literacy are.
- 61% rural vs. 39% urban population; rural areas lag further on 3G/4G quality even where nominal coverage exists.
- Gender gap in phone ownership: ~71% of men vs. ~62% of women own a mobile phone — relevant since women do a large share of on-farm labour.
- Mobile money accounts (~81 million active) significantly outnumber smartphone owners — mobile money is reachable via USSD on any handset and is already the de facto financial rail in rural Tanzania.

### 3.2 What this means for AgroFlow specifically
- Fewer than 15% of African smallholder farmers currently receive digital payment for produce (FAO) — cash still dominates farm-gate transactions. Digitising payment is itself a core product goal, not a solved problem.
- Post-harvest loss and weak aggregation infrastructure are recurring constraints in Tanzanian agriculture.
- The UNCDF/DMA Kigoma pilot proves the pattern to copy: agent/phone-based registration, USSD-driven transactions, physical fulfilment at a local agent.
- Mobile money usage is high generally (~80%+ in proxy markets) but usage *for agricultural transactions specifically* is much lower (~15%) — trust and habit must be built deliberately, not assumed.

### 3.3 Payments infrastructure
| Rail | Operator | Integration note |
|---|---|---|
| M-Pesa | Vodacom | STK push / API + USSD fallback — largest network |
| Mixx by Yas (Tigo Pesa) | Yas (Tigo) | API + USSD fallback — strong rural reach |
| Airtel Money | Airtel | API + USSD fallback — wide rural agent network |
| HaloPesa | Halotel | USSD-first, smaller but locally relevant |
| Bank rails (e.g. NMB) | NMB and others | Best for aggregator/warehouse settlement and larger B2B payments |

**Design implication:** a mobile-money aggregator/gateway federating all four wallets behind one API, not a single-provider integration. Card payments are optional, exporter/processor-only.

---

## 4. Competitive Landscape & Whitespace

| Player | Strength | Structural weakness |
|---|---|---|
| HortiMarket (TAHA/TARIC) | 500,000+ smallholders, live on web/app/WhatsApp/USSD | Horticulture-only; payment, traceability and AI are roadmap items, not shipped; quality runs through paid human facilitators |
| MkulimaHub | Deep input-supplier/donor backing | Input access focus, no produce-sale demand-matching or logistics |
| NINAYO | Free marketplace since 2015, WhatsApp-based | No logistics, quality workflow, or payment automation |
| Tanzania Pulse Crops Network | Freshly launched, buyer verification | Single crop family, single region |
| DMA / Digital Mobile Africa (Kigoma) | Proven USSD + agent + savings pattern | Input-purchase focus, not produce sales; one region only |
| Apollo Agriculture / Pula | Input credit / insurance | Not marketplaces — future integration partners, not competitors |
| Twiga Foods (Kenya, cautionary) | Raised $180M+ for tech-enabled distribution | Forced pivot away from owning logistics/inventory — physical infrastructure economics broke the model, not the software thesis |

### Where the whitespace is
1. **End-to-end transaction, not just discovery** — every reviewed competitor is strong at listing/price transparency and weak at structured negotiation, auditable order lifecycle, and in-platform settlement.
2. **Quality verification as a recorded, software-backed trust signal** — competitors use paid human intermediaries, not a photo/GPS/timestamp-backed trust score.
3. **Logistics and warehousing as bookable operations**, not just informational.
4. **Cross-crop, cross-region continuity** — every incumbent is siloed by crop or region; AgroFlow's unified schema is a structural advantage if Phase 1 stays disciplined.
5. **Mobile-money-native payment collection integrated into the transaction** — the single highest-leverage gap; no reviewed competitor has shipped this.

**Implication for crop/region selection:** pick a region/crop with no entrenched incumbent trust and commission-based facilitators. Win the underserved transaction-and-payment layer first, then expand.

---

## 5. Design Principles

1. **Channel parity, not app-only.** Anything a farmer can do in the app must also work over USSD.
2. **Mobile-money-native payments.** Wallet linkage and STK-push/USSD collection are core MVP, not later add-ons. Cash-at-agent is a first-class fallback, not an error state.
3. **Offline-first, sync-tolerant.** The mobile app must be fully usable offline for core farmer actions, queuing writes for background sync.
4. **Swahili-first, low-literacy UI.** Kiswahili default across every surface; icons, photos and voice notes over dense text.
5. **Agent-assisted onboarding.** A village-agent path for farmers who cannot self-onboard on a smartphone.
6. **Trust before software.** The schema records trust signals (photos, GPS, timestamps, agent identity) generated by a real operational layer — it doesn't manufacture trust, it supports it.
7. **Narrow first, wide later.** Prove the core loop in one region/crop before expanding to the full persona/crop/region matrix.

---

## 6. Core Architecture Decisions

*(This section captures the architecture Q&A conducted during planning — the reasoning is preserved here so future contributors understand **why**, not just what.)*

### 6.1 One app with role-based access, not separate apps per role

**Decision: one mobile app + one web app, both role-based (RBAC), not separate apps for Farmer/Buyer/Aggregator/Transporter/etc.**

Reasoning:
- A single person can hold multiple roles (e.g. an aggregator who is occasionally a buyer). Separate apps would force separate accounts for the same real-world identity.
- One codebase, one design system, one place to fix a bug — critical for a small team building an MVP.
- One login, one backend — no cross-app data reconciliation risk.
- Role-specific UX needs (a transporter's live map vs. a farmer's six big tiles) are handled by loading a **different home screen after login based on active role**, while every role shares the same underlying component library (colors, buttons, cards, glass panels).

Implementation: a `UserRole` join table allows one user to hold multiple roles; a role switcher (like a buyer org with multiple seats) lets multi-role users change context without logging out.

### 6.2 Farmers should have multiple access options, on one account

**Decision: yes — App, USSD, WhatsApp, and Agent-assisted, all resolving to the same AgroFlow account and backend.** This is not optional given Section 3's connectivity data; it is core MVP surface (Phase 1, not Phase 6).

Reasoning:
- **Identity = phone number**, not email — the one identifier available across every channel.
- Authentication differs per channel but converges on the same `User`: OTP (App/WhatsApp), PIN (USSD, rate-limited at the gateway), agent-assisted login (agent identity + farmer phone, both logged).
- `USSDSession`, `SMSMessage`, `WhatsAppMessage`, `AgentAssistedAction` all link back to the same `User`, so channel-mix analytics and a unified activity history come for free — no extra reconciliation logic needed.
- **Critical control:** agent-assisted actions must always be logged against *both* the agent's and the farmer's identity, and the farmer must be able to review what an agent did on their behalf (via SMS or next login). This is the single most important security control on this design — treat it as non-negotiable, not a nice-to-have.

**Web access for farmers:** technically possible (same account, same backend) but not a primary investment. A farmer who opens the web app should see a minimal, mobile-style read-only view (their listings, orders, payments) — not the dense Ops Dashboard built for desk-based buyers/aggregators/admins. Investment for farmer reach goes into App, USSD, WhatsApp and Agent-assisted, not a farmer-tuned web UI.

| Role | Primary channel(s) | Web access |
|---|---|---|
| Farmer | App, USSD, WhatsApp, Agent | Allowed, minimal read-only view — not a design priority |
| Buyer / Aggregator / Warehouse / Transporter dispatch / Admin | Web (primary) + lighter mobile companion | Full Ops Console — primary surface |

### 6.3 Database: keep PostgreSQL + PostGIS, but change *how* it's accessed

**Decision: PostgreSQL + PostGIS remains the database — but accessed only through Prisma ORM, hosted on a managed platform (Supabase or Neon) that removes most of the "I'm not experienced with SQL" friction.**

| | Postgres + PostGIS | MySQL/MariaDB | MongoDB | Firebase/Firestore |
|---|---|---|---|---|
| Geospatial (farm↔buyer↔warehouse↔transporter matching) | ✅ Best-in-class (PostGIS is the industry standard) | ⚠️ Weak for radius/polygon queries | ⚠️ Adequate (2dsphere) but not as precise | ⚠️ Weak |
| Financial/transactional integrity (orders, payments, settlement, reconciliation) | ✅ Relational, foreign keys, ACID transactions | ✅ Good | ⚠️ Possible but not the natural fit — reconciliation risk | ⚠️ Higher risk |
| Ease for a non-SQL-experienced builder | ✅ Via Prisma ORM + Supabase GUI (spreadsheet-like table editor) | ✅ Good | ✅✅ Easiest to start (JSON-native) | ✅✅ Easiest to start |
| Cost (MVP / free tier) | ✅ Supabase/Neon free tier | ✅ PlanetScale/Aiven free tier | ✅ Atlas free tier | ✅ Generous free tier |
| Fit with existing stack (Node + Express + Prisma) | ✅ Prisma's primary/default target | ✅ Supported | ⚠️ Supported but not Prisma's strength | ❌ Not Prisma-compatible |
| Long-term scalability | ✅ Proven at scale | ✅ Proven | ✅ Proven | ⚠️ Vendor lock-in |

**Why not switch to Mongo/MySQL/Firebase:** AgroFlow has two requirements that are hard to compromise on — precise geospatial matching and strict transactional integrity for money movement (14-step order lifecycle, idempotent payment webhooks, reconciliation). Switching database engines sacrifices both without actually solving the real problem, which is tooling, not the engine. Prisma (schema defined in a friendly DSL, migrations auto-generated, no hand-written SQL) plus Supabase (GUI table editor, PostGIS pre-installed, built-in auth, automatic backups) solves the ease-of-use concern directly.

### 6.4 Recommended system architecture

```
1. USERS  (one identity, possibly multiple roles)
   Farmer · Buyer · Aggregator · Transporter · Warehouse · Agent/Admin
                              |
2. CHANNELS  (one AgroFlow app, several front doors)
   Mobile App · Web Console · USSD · WhatsApp · Agent-assisted
                              |
   ── ROLES & PERMISSIONS ENFORCED HERE ──
   Every request carries a signed JWT (phone-number identity + role
   claims). Auth & RBAC middleware checks role + permission + data
   ownership BEFORE any controller runs. Hiding a UI tile is
   convenience only — this is the real security boundary.
   Agent-assisted actions carry both the agent's and the farmer's
   identity and are logged as such.
                              |
3. API / BACKEND  (Node.js + Express — one service, shared by every channel)
   Auth Gateway · Business Services (farms, matching, orders, quality,
   logistics) · Channel Services (USSD session, SMS, WhatsApp bot) ·
   Realtime (Socket.IO)
                              |
4. DATABASE  (PostgreSQL + PostGIS, accessed only through Prisma ORM)
   Managed Postgres (Supabase/Neon) · Redis (sessions, USSD state,
   queues) · Object Storage (produce & inspection photos)
   Domains: Identity · Agriculture · Marketplace · Quality · Logistics
            · Storage · Finance · Channel · Trust · Analytics/Audit
                              |
5. EXTERNAL SERVICES  (called only from the backend, never directly
   from a channel)
   Mobile Money: M-Pesa · Mixx by Yas · Airtel Money · HaloPesa
   AI Service: Kiswahili price guidance — recommends, never
   auto-executes a payment
```

*(A full-color version of this diagram, matching the brand palette, is available as `docs/architecture/assets/agroflow-architecture-diagram.png` in the project scaffold.)*

---

## 7. UI/UX Design Direction

**Brand palette** (sampled from the AgroFlow logo): leaf teal `#0DB394`, dark teal `#00645E`/`#013F39`, warm gold accent `#C99530`, pale backgrounds `#EAFBF6`. Glassmorphism panels (translucent white, blurred backdrop, soft shadow) throughout, on a light-green field. Typography: Sora for headings, Inter for body.

### Web (desktop) — for desk-based roles
- Persistent left sidebar grouped by **workflow stage**, not database entity: Overview → Demand & Supply → Matching → Orders → Quality → Logistics → Warehousing → Payments → Reports → Admin.
- Key screens: Ops Dashboard (map + live action list), Demand Board (kanban), Match Review (side-by-side comparison cards), Order Tracker (stepper), Quality Inspection (photo-first form), Payments & Settlement (provider-tagged transaction table), Analytics (channel-mix and price-trend charts), Admin Console.
- Data-dense but never cramped: generous row height, sticky headers, colour+icon status chips (not colour alone, for accessibility).

### Mobile — primary surface for farmers, and lighter companion for other field roles
- Splash: logo only, one line of positioning.
- Home: **not a dashboard** — 6 large icon tiles (My Farm, Sell Produce, My Orders, Prices Near Me, Payments, Help), Kiswahili-first labels, optional voice playback, wallet balance always visible at the top.
- Sell Produce: 3 taps — photo → crop/quantity picker (large buttons, no free text) → confirm. Fully offline-capable with a visible "will send when connected" badge.
- Offer notifications: one photo, one price, one quantity, two big buttons (Accept / Not now) — no negotiation jargon on first view.
- Payment status: plain language and the real wallet name ("Paid to your M-Pesa — TSh 84,000"), never a transaction ID.
- USSD parity screen: every core farmer action available via `*150#`-style menu for feature phones.

*(Full interactive HTML mockups for both web and mobile, and a branded PDF walkthrough, were produced during design planning and are available as prior deliverables: `agroflow_web_ui.html`, `agroflow_mobile_ui.html`, `AgroFlow_UIUX_Design.pdf`.)*

---

## 8. Technology Stack

| Layer | Choices |
|---|---|
| Web | React, Vite, TypeScript, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Recharts, Leaflet/MapLibre |
| Mobile | React Native, Expo, TypeScript, Expo Router, TanStack Query, Zustand, SQLite (offline store) |
| Channels | USSD/SMS gateway aggregator (e.g. Africa's Talking), WhatsApp Business API |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL + PostGIS, Redis, BullMQ, Socket.IO, JWT, Zod |
| Database hosting | Supabase or Neon (managed Postgres + PostGIS, GUI table editor, auto backups) |
| Payments | Mobile-money aggregator federating M-Pesa, Mixx by Yas, Airtel Money, HaloPesa; optional card processor for B2B |
| AI | Provider-agnostic (OpenAI/Anthropic/etc.); Kiswahili-capable speech-to-text for voice-note intake |
| Storage | S3-compatible object storage |
| Testing | Vitest, React Testing Library, Playwright, backend integration tests |

---

## 9. Data Model Overview

All models live in one Prisma schema, grouped by domain (build in this order):

| Order | Domain | Key entities |
|---|---|---|
| 1 | Identity | User · Role · Permission · UserRole |
| 2 | Agriculture | Farm (PostGIS location) · Crop · CropVariety · FarmCrop · Production · Harvest · ProduceListing · ProduceImage |
| 3 | Marketplace | DemandOrder · SupplyOffer · Match · Negotiation · PurchaseOrder · OrderItem |
| 4 | Quality | QualityInspection · QualityGrade · InspectionImage · QualityCertificate |
| 5 | Logistics | Transporter · Vehicle · Shipment · ShipmentTracking · Delivery · DeliveryProof · Route |
| 6 | Storage | Warehouse · WarehouseSection · StorageBooking · Inventory · InventoryMovement |
| 7 | Finance | Payment · PaymentTransaction · Settlement · Invoice · Fee · Refund · MobileMoneyAccount |
| 8 | Channel | USSDSession · SMSMessage · WhatsAppMessage · AgentAssistedAction |
| 9 | Communication | Notification · Conversation · Message |
| 10 | Trust | Review · Rating · Dispute · Report · TrustScore |
| 11 | AI | AIConversation · AIMessage · AIRecommendation · Forecast |
| 12 | Analytics/Audit | MarketPrice · MarketTrend · SupplyMetric · DemandMetric · AuditLog · SystemEvent |

`Farm.location` and warehouse/transporter/buyer coordinates use PostGIS geography types for proximity matching. `MobileMoneyAccount` links a `User` to multiple wallet identities across providers.

---

## 10. Project Structure

```
AGROFLOW/
├── package.json / pnpm-workspace.yaml / .env.example / turbo.json
├── apps/
│   ├── web/        # React + Vite — Ops Console for desk-based roles
│   ├── mobile/      # React Native + Expo — primary farmer surface, offline-first
│   └── api/         # Node.js + Express — single backend for every channel
│       └── src/middleware/rbac.ts   # <<< single source of truth for permissions
├── packages/
│   ├── types/        # Role/Permission enums defined ONCE here
│   ├── validation/    # Zod schemas shared by API and frontends
│   ├── api-client/    # shared API wrapper (web + mobile)
│   ├── config/        # shared constants
│   └── utils/
├── database/
│   └── prisma/
│       ├── schema.prisma   # PostgreSQL + PostGIS, all domains
│       ├── migrations/
│       └── seed.ts
├── channels/
│   ├── ussd/         # *150# menu tree, session-driven service
│   ├── sms/           # notification dispatch + inbound shortcode
│   └── whatsapp/      # bot, numbered replies, voice-note price guidance
├── infrastructure/
│   ├── docker/
│   └── deployment/
└── docs/
    ├── BUILD_ORDER.md
    ├── architecture/   # includes brand logo + architecture diagram assets
    ├── api/
    ├── database/
    └── business/
```

*(The fully scaffolded folder/file structure — 255 files, every module stubbed with a purpose comment — was generated as a prior deliverable: `AgroFlow_Project_Structure.zip`.)*

---

## 11. Implementation Roadmap

### Phase 0 — Foundation (6–8 weeks)
**Goal:** a working monorepo, not features.
- Set up workspace (`pnpm`, root config), `packages/types` and `packages/validation` with Role/Permission enums defined once.
- `database/prisma/schema.prisma` — Identity domain only.
- `apps/api` — auth (OTP + PIN), users, and `middleware/rbac.ts` working end-to-end (one user, two roles, one protected test endpoint).
- Stand up `channels/ussd` and `channels/sms` as thin stubs — even a single hard-coded menu — so API contracts account for non-app clients from day one.
- CI/CD pipeline, design system tokens (colors, Sora/Inter type, glass panel component) built once in `packages`/`apps/web/src/components/ui`.

**Exit criteria:** a user can register, log in via OTP or USSD PIN, and the API correctly allows/denies a request based on role — nothing else needs to work yet.

### Phase 1 — Single-region, single-crop MVP (10–12 weeks)
**Goal:** prove the core loop — list → match → order — in one region, one or two crops, avoiding direct overlap with entrenched incumbents (Section 4).
- Agriculture + Marketplace domains in the schema.
- `apps/api/services`: farms, crops, produce, demand, matching, orders, admin.
- `apps/web`: auth, farms, demand board, match review, order tracker (for buyer/admin).
- `apps/mobile`: auth, farmer home, 3-tap Sell Produce flow, offer notifications, offline queue.
- `channels/ussd`: Sell Produce and Check Matches menus live, hitting the same services as the app.
- **USSD and mobile-money payment collection ship in this phase, not later** — they are core loop, not enhancement.

**Exit criteria:** a real farmer can list produce (app or USSD), a real buyer can discover and match it, and an order can be created — in the pilot region only.

### Phase 2 — Transactions & trust (8–10 weeks)
**Goal:** make a matched order actually completable and trustworthy.
- Quality domain: photo-first inspection component shared by web and mobile.
- Payments settlement: mobile-money adapters (M-Pesa first, then Mixx/Airtel/HaloPesa), idempotency keys, webhook signature verification.
- Reviews, disputes, notifications — SMS elevated to co-primary channel alongside push.
- Trust domain: TrustScore updates from inspection history.

**Exit criteria:** a farmer can be paid to a real mobile money wallet with SMS confirmation; a buyer can raise and resolve a dispute.

### Phase 3 — Logistics (6–8 weeks)
**Goal:** produce actually moves, trackably.
- Logistics domain: transporters, vehicles, shipments, tracking, delivery proof-of-photo.
- Transporter mobile app screens (single active-job view, status stepper).
- Logistics Board on web for dispatch/admin.

**Exit criteria:** an order can be picked up, tracked in transit, and delivered with photo proof, end-to-end.

### Phase 4 — Aggregation & warehousing + agent tooling (8 weeks)
**Goal:** support farmers who can't self-onboard, and produce that needs consolidation/storage.
- Aggregation flows: collection points, consolidated supply, per-farmer contribution records, aggregator settlement.
- Warehouse domain: booking, inventory, movement tracking.
- Agent-assisted registration/listing tooling and cash-at-agent reconciliation — with mandatory dual-identity logging (agent + farmer).

**Exit criteria:** a farmer who has never touched the app can be onboarded and paid entirely through a village agent.

### Phase 5 — Regional expansion (ongoing)
**Goal:** replicate the validated loop, not reinvent it.
- Use Phase 2 analytics (channel mix, on-time delivery, dispute rate) to decide sequencing of new regions/crops — not a fixed calendar.
- No new architecture; scale what's proven.

### Phase 6 — AI, market intelligence, forecasting (ongoing, once Phase 2 data exists)
**Goal:** AI augments, never replaces, human decision-making.
- Kiswahili voice-note price guidance over WhatsApp as the first AI feature.
- Forecasting and recommendations once enough transaction history exists to make them meaningful.
- AI never directly executes a financial action — it recommends; the backend validates and the user confirms.

### Phase 7 — Processors, exporters, finance partnerships (future)
**Goal:** extend the network, not the core product.
- Processor/exporter personas.
- Agri-finance partnerships (à la the IFC/GAFP-backed NMB program) using AgroFlow's transaction history as an informal creditworthiness signal.
- Apollo Agriculture / Pula-style integrations as credit/insurance partners, not competitors to out-build.

---

## 12. MVP Definition of Done

- A farmer can register (app, USSD, or agent-assisted), create a farm, add crops and list produce.
- A buyer can register, create demand and discover relevant supply.
- The system can generate matches.
- Users can negotiate and create orders.
- A farmer can receive payment via at least one mobile money provider, with SMS confirmation.
- Admin can verify users and monitor activity, including which channel (app/USSD/WhatsApp/agent) each user is transacting through.
- Critical workflows are authenticated and authorized (RBAC enforced server-side).
- Database migrations and seed data are reproducible.
- Automated tests cover critical workflows.
- Web and backend can deploy independently.
- Core farmer actions (list produce, view matches, check order/payment status) work over USSD with no smartphone or data connection required.

---

## 13. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Farmers can't/won't use a smartphone app | USSD and agent-assisted flows are core MVP surface, not later additions |
| Digital payment adoption for produce is low sector-wide (<15% across Africa) | Cash-at-agent is a first-class, reconciled fallback; payment UX uses plain wallet-name language |
| Trust/quality verification depends on a physical step software can't replace | Schema records trust signals generated by a real operational layer of agents/aggregators — supports the process, doesn't automate it away |
| Connectivity varies sharply by region/season | Offline-first mobile app, cached prices/order status, channel parity across app/USSD/SMS/WhatsApp |
| Gender gap in phone ownership could bias who benefits | Agent-assisted registration and USSD (usable on a shared household phone) reduce smartphone-ownership dependency |
| Regulatory: mobile money and agricultural trade rules | Payment integrations through licensed Tanzania-registered gateway partners; legal review required before Phase 1 payment collection goes live |
| Scope creep back to full 7-persona, all-crop vision before the core loop is proven | Phase 1 explicitly narrowed to one region/one or two crops; expansion gated on analytics, not a calendar date |
| RBAC bypass / role confusion in a single shared app | `middleware/rbac.ts` is the single enforced source of truth; UI-side role checks are convenience only and never trusted |
| Agent-assisted fraud (agent acting without real farmer consent) | Every agent action double-logged (agent + farmer identity); farmer can review agent actions via SMS or next login |

---

## 14. Success Metrics / KPIs

Track these from Phase 1 onward so Phase 5 expansion decisions are evidence-based, not guesses:

- **Adoption:** registered farmers/buyers in the pilot region, % active monthly.
- **Channel mix:** % of transactions via app vs. USSD vs. WhatsApp vs. agent-assisted (informs where to invest next).
- **Transaction completion:** % of matches that become confirmed orders; % of orders that reach "paid & settled".
- **Payment digitisation rate:** % of farmer payouts via mobile money vs. cash-at-agent (the core problem AgroFlow exists to solve — track against the <15% African baseline).
- **Trust:** average TrustScore trend, dispute rate, % of quality inspections completed with photo/GPS/timestamp.
- **Logistics reliability:** on-time delivery rate, average time from order confirmation to delivery.
- **Retention:** % of farmers/buyers who transact again within 60 days.

---

## 15. Next Steps

1. Confirm the **pilot region and crop(s)** for Phase 1 (Section 4.3 — pick where no incumbent has entrenched trust and commission-based facilitators).
2. Set up the Supabase (or Neon) project and confirm PostGIS is enabled.
3. Unzip the project scaffold, run `pnpm install`, and start filling in `packages/types` (Role/Permission enums) — this unblocks both `apps/api/src/middleware/rbac.ts` and every frontend role check.
4. Build `database/prisma/schema.prisma` for the Identity domain, run the first migration, and seed base roles.
5. Build `apps/api` auth + RBAC middleware and prove it end-to-end before writing a single business feature.
6. Follow `docs/BUILD_ORDER.md` from there through Phase 1.

---

*This guide is a planning and specification artifact only — no code was written or scaffolded as part of producing it, beyond the structural (empty) project scaffold referenced in Section 10.*
