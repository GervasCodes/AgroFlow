// Reads the current user's active role(s) for UI purposes ONLY
// (e.g. which sidebar items and dashboard widgets to show).
// This is convenience, not security -- the real check is
// apps/api/src/middleware/rbac.ts. Never gate a sensitive action on
// this hook alone; the API must enforce it independently.
import type { RoleName } from "@agroflow/types";
import { useAuth } from "@/app/providers";

export function useRole() {
  const { user } = useAuth();
  const roles: RoleName[] = user?.roles ?? [];

  return {
    roles,
    hasRole: (role: RoleName) => roles.includes(role),
    hasAnyRole: (...check: RoleName[]) => check.some((r) => roles.includes(r)),
    /** UI-only convenience check -- mirrors requireCapability on the API,
     * but is NOT a substitute for it. */
    hasPermission: (key: string) => user?.permissions.includes(key) ?? false,
  };
}
