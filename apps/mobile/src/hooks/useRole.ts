// Mirrors apps/web/src/hooks/useRole.ts -- UI convenience only, not a
// security boundary. Same rule applies: the API enforces access.
import type { RoleName } from "@agroflow/types";
import { useSessionStore } from "@/store/session";

export function useRole() {
  const user = useSessionStore((s) => s.user);
  const roles: RoleName[] = user?.roles ?? [];

  return {
    roles,
    hasRole: (role: RoleName) => roles.includes(role),
    hasAnyRole: (...check: RoleName[]) => check.some((r) => roles.includes(r)),
    hasPermission: (key: string) => user?.permissions.includes(key) ?? false,
  };
}
