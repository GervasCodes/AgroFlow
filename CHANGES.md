# AgroFlow deployability fixes

This zip contains only the files that were added or changed. Extract it
over your existing project (it merges into the same folder structure)
and overwrite when prompted.

## Critical: packages/ folder was missing from your last upload

Your zip was missing the entire `packages/` folder (@agroflow/config,
@agroflow/types, @agroflow/validation, @agroflow/api-client,
@agroflow/utils) even though apps/api and other code still imports
from it. This was almost certainly an accident when the zip was
created — it's restored here from your original upload, unchanged.

## Fixes applied (in order of discovery)

1. **pnpm-workspace.yaml** — added `database` as a workspace package
   (it has its own package.json but wasn't listed, so pnpm couldn't
   find `@agroflow/database`).

2. **packages/config/tsconfig.json, packages/types/tsconfig.json,
   packages/validation/tsconfig.json, database/tsconfig.json** —
   added `"composite": true`. Required because apps/api/tsconfig.json
   references these projects; TypeScript project references require
   every referenced project to be composite.

3. **apps/api/package.json** — changed the `build` script from
   `tsc -p tsconfig.json` to `tsc -b tsconfig.json` (build mode).
   Build mode automatically builds referenced projects (config, types,
   validation, database) in the correct dependency order first. Plain
   `-p` does not, which caused "output file has not been built from
   source file" errors.

4. **apps/api/src/app.ts, apps/api/src/routes/*.ts (13 files)** —
   added explicit return/variable type annotations (`: Express`,
   `: Router`). Your tsconfig has `"declaration": true`, which requires
   every exported symbol's type to be explicitly nameable rather than
   inferred, when the inferred type reaches into a package's nested
   node_modules path.

5. **apps/api/src/repositories/{produce-listing,demand-order,match,
   purchase-order,shipment}.repository.ts** — the `status` parameter
   on each `update*Status` function was typed as plain `string`
   instead of the corresponding Prisma enum (`ProduceListingStatus`,
   `DemandOrderStatus`, `MatchStatus`, `PurchaseOrderStatus`,
   `ShipmentStatus`). This caused real type errors on the Prisma
   `.update()` calls, and in shipment.repository.ts specifically also
   caused TypeScript to lose track of the `include` relations,
   producing a confusing "Property 'purchaseOrder' does not exist"
   error downstream in services/shipments/index.ts. Fixed by importing
   and using the correct enum type from `@prisma/client` in each file.

6. **database/prisma/seed.ts** — the `resource`/`action` callback
   parameters in `RESOURCES.flatMap(...)` / `ACTIONS.map(...)` had
   implicit `any` types once the config package's types weren't
   resolving; added explicit `Resource`/`Action` type imports and
   annotations.

7. **.env.example** — also missing from your upload; restored
   unchanged from your original project (no secrets in this file).

## What this does NOT fix / cover

- `database/.env` was present in your last upload with real
  credentials (your Render Postgres password). It was **not** included
  in this deliverable. Since it was shared in a chat upload, consider
  rotating that database password from the Render dashboard.
- Mobile app (Expo) issues from earlier in the session (SDK 54 upgrade,
  the `import.meta`/Hermes web-bundling crash) are untouched — we'd
  agreed to skip mobile for now and focus on API + web deployability.

## Verification performed

- Fresh `pnpm install` against the restored workspace: succeeds,
  resolves all `@agroflow/*` packages correctly.
- `tsc -b` on packages/config, packages/types, packages/validation
  (the three that don't depend on the Prisma client): **0 errors**.
- Every repository file confirmed to have zero remaining
  `status: string` occurrences.
- Could not run `prisma generate` / the full `apps/api` build inside
  this sandbox — `binaries.prisma.sh` isn't reachable from here. This
  is a sandbox restriction, not a code issue: your own Render build
  log earlier in this session already showed `prisma generate`
  succeeding in the real deploy environment. Recommend re-running your
  Render deploy (or a local `pnpm --filter @agroflow/api build`) as
  the final check.
