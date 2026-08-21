# AgroFlow deploy fix — changed files

## 1. `.gitignore`
Added `*.tsbuildinfo` — these cache files were committed to git, which made
`tsc -b` on Render think shared packages (types/config/validation) were
already built when their `dist/` output didn't actually exist (dist/ is
correctly gitignored). This caused the TS6305 build failures on Render.

**You also need to untrack the already-committed files** (adding them to
.gitignore alone won't remove files git is already tracking):
```
git rm --cached apps/api/tsconfig.tsbuildinfo
git rm --cached database/tsconfig.tsbuildinfo
git rm --cached packages/config/tsconfig.tsbuildinfo
git rm --cached packages/types/tsconfig.tsbuildinfo
git rm --cached packages/validation/tsconfig.tsbuildinfo
```

## 2. `apps/api/src/repositories/role-request.repository.ts`
Replaced the `userRole.upsert` (which used the compound unique key
`userId_roleId_scopeId`) with an explicit `findFirst` + `create`.
`scopeId` is nullable, and Prisma's generated type for a compound unique
key requires a non-null string in that position — NULL never equals NULL
in SQL, so a nullable field can't reliably be used as part of a unique-key
lookup. This was causing the TS2322 build failure.

## To apply
Copy these two files into your project at the same paths (overwrite the
existing ones), then:
```
git add -A
git commit -m "Fix tsbuildinfo tracking and role-request scopeId upsert"
git push
```
On Render, use "Manual Deploy > Clear build cache & deploy" for agroflow-api
so it doesn't reuse the previously cached broken build.
