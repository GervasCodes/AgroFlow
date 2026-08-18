// Placeholder landing page after sign-in -- proves the authenticated
// shell + RBAC-aware UI work end to end. Real dashboard widgets
// (Section 7.1: Overview -> Demand & Supply -> Matching -> ...) are
// built in Phase 5 once the Marketplace domain exists.
import { GlassCard, Badge, IconTile, LeafIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ROLE_LABELS } from "@agroflow/config";

export function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl">
      <GlassCard className="animate-rise-in">
        <div className="flex items-start gap-4">
          <IconTile size="lg">
            <LeafIcon size={30} />
          </IconTile>
          <div>
            <h1 className="font-display text-2xl font-semibold text-leaf-950">
              Karibu, {user?.fullName?.split(" ")[0] ?? "there"}.
            </h1>
            <p className="mt-1 text-[15px] text-leaf-900/60">
              Your workspace is ready. Feature dashboards land in the next build phase.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.roles.map((role) => (
                <Badge key={role} tone="success">
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
