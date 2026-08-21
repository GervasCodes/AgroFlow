// Tracks which of a multi-role user's roles they're currently "acting
// as" for UI purposes (which dashboard/nav emphasis to show) -- purely
// a display preference, persisted per-browser. Like useRole, this is
// NOT a security boundary: permissions still come from the full union
// of every role the user actually holds (see middleware/rbac.ts on the
// API) -- switching the active role never grants or removes access to
// anything, it only changes what the UI foregrounds.
import { useCallback, useEffect, useState } from "react";
import type { RoleName } from "@agroflow/types";
import { useAuth } from "@/app/providers";

const STORAGE_KEY = "agroflow.activeRole";

export function useActiveRole() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const [activeRole, setActiveRoleState] = useState<RoleName | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as RoleName | null;
    return stored && roles.includes(stored) ? stored : (roles[0] ?? null);
  });

  useEffect(() => {
    if (activeRole && !roles.includes(activeRole)) {
      setActiveRoleState(roles[0] ?? null);
    } else if (!activeRole && roles.length > 0 && roles[0]) {
      setActiveRoleState(roles[0]);
    }
    // Only re-sync when the set of roles the user holds changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles.join(",")]);

  const setActiveRole = useCallback((role: RoleName) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEY, role);
  }, []);

  return { activeRole, setActiveRole, roles };
}
