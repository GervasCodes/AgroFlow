// Authenticated app shell: a glass sidebar on desktop/tablet, a glass
// bottom tab bar on mobile -- same nav model, two layouts, so the app
// feels native at every width instead of a squeezed desktop UI.
// Nav is grouped by workflow stage, not database entity (Section 7.1);
// Phase 4 ships only "Overview", the rest light up as their domains do.
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconTile, LeafIcon, ChartIcon, UserIcon, FarmIcon, HandshakeIcon, TruckIcon, WarehouseIcon, CoinIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: ChartIcon, permission: null },
  { to: "/farms", label: "Farms", icon: FarmIcon, permission: "farm:read" },
  { to: "/produce", label: "Produce", icon: LeafIcon, permission: "produce_listing:read" },
  { to: "/demand", label: "Demand", icon: HandshakeIcon, permission: "demand_order:read" },
  { to: "/matches", label: "Matches", icon: HandshakeIcon, permission: "match:read" },
  { to: "/orders", label: "Orders", icon: HandshakeIcon, permission: "purchase_order:read" },
  { to: "/shipments", label: "Shipments", icon: TruckIcon, permission: "shipment:read" },
  { to: "/warehouses", label: "Warehouses", icon: WarehouseIcon, permission: "warehouse:read" },
  { to: "/payments", label: "Payments", icon: CoinIcon, permission: "payment:read" },
  { to: "/profile", label: "Profile", icon: UserIcon, permission: null },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { hasPermission } = useRole();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <div className="min-h-dvh w-full lg:flex">
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 flex-col justify-between p-5 lg:flex">
        <div className="glass-panel flex h-full flex-col p-5">
          <span className="glass-edge-highlight" aria-hidden="true" />
          <div className="mb-8 flex items-center gap-3">
            <IconTile size="sm">
              <LeafIcon size={16} />
            </IconTile>
            <span className="font-display text-lg font-semibold text-leaf-900">AgroFlow</span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {visibleItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition",
                    active ? "bg-leaf-600/10 text-leaf-800" : "text-leaf-900/60 hover:bg-leaf-900/5",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center gap-3 border-t border-leaf-900/10 pt-4">
            <IconTile size="sm">
              <UserIcon size={16} />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-leaf-900">{user?.fullName}</p>
              <button
                onClick={() => logout()}
                className="text-xs font-medium text-leaf-900/50 hover:text-rust-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-dvh flex-1 px-4 pb-24 pt-6 sm:px-8 sm:pt-10 lg:pb-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="glass-panel-strong fixed inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-3xl px-2 py-2 lg:hidden">
        {visibleItems.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition",
                active ? "text-leaf-800" : "text-leaf-900/50",
              )}
            >
              <IconTile size="sm" className={active ? "" : "opacity-60"}>
                <Icon size={16} />
              </IconTile>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
