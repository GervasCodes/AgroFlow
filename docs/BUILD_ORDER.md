# AgroFlow -- Recommended Build Order

1. Root workspace config (package.json, pnpm-workspace.yaml) -- DONE by this scaffold.
2. packages/types and packages/validation -- define Role/Permission enums ONCE here.
3. database/prisma/schema.prisma -- start with the Identity domain only
   (User, Role, Permission, UserRole), then Agriculture (Farm, Crop, ProduceListing).
4. apps/api -- build auth/, users/, and middleware/rbac.ts before anything else.
   RBAC must work end-to-end (one user, two roles, one test endpoint) before
   moving on.
5. Expand schema.prisma with Marketplace domain, then build
   apps/api/services/{farms,produce,demand,matching,orders}.
6. apps/web -- auth + farms + demand + orders features, reusing
   packages/types and packages/validation.
7. apps/mobile -- auth + farmer home + sell-produce flow (offline-first).
8. channels/ussd -- stub first (even one menu: Sell Produce) calling the
   existing API. Do this in Phase 0/1, not Phase 6.
9. Continue with Quality -> Logistics -> Payments following the phased
   roadmap (Section 26 of the Master Project Documentation v4.0).

Notes:
- apps/api/src/middleware/rbac.ts is the single source of truth for
  permissions. UI-side role checks (apps/web/src/hooks/useRole.ts,
  equivalent in mobile) are convenience only, never security.
- Farmers are expected to reach AgroFlow primarily through App, USSD,
  WhatsApp and Agent-assisted channels. The web app remains reachable to
  every role (same account, same backend) but is only actively designed
  for desk-based roles: buyers, aggregators, warehouse managers,
  transporter dispatch and admins.
