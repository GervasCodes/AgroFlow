// Segmented control letting a multi-role user (e.g. an AGGREGATOR who
// is also a WAREHOUSE_MANAGER) declare which role they're acting as
// right now -- see useActiveRole for what this does and doesn't affect.
// Renders nothing for a single-role user; there's nothing to switch.
import { ROLE_LABELS } from "@agroflow/config";
import { useActiveRole } from "@/hooks/useActiveRole";
import { cn } from "@/lib/cn";

export function RoleSwitcher({ className }: { className?: string }) {
  const { activeRole, setActiveRole, roles } = useActiveRole();

  if (roles.length < 2) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {roles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => setActiveRole(role)}
          aria-pressed={activeRole === role}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition",
            activeRole === role
              ? "bg-leaf-700 text-white shadow-glass-sm"
              : "bg-leaf-900/5 text-leaf-900/60 hover:bg-leaf-900/10",
          )}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
