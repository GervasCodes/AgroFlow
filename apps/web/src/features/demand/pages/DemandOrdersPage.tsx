// Buyer's demand orders -- what they need to buy. Each open order can
// be matched against a published ProduceListing from the Produce
// browse tab (see ProduceListingsPage -> "Propose match").
import { useQuery } from "@tanstack/react-query";
import type { DemandOrderStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { Badge, EmptyState, GlassCard, IconTile, LinkButton, HandshakeIcon } from "@/components/ui";

const STATUS_TONE: Record<DemandOrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "info",
  MATCHED: "success",
  FULFILLED: "success",
  CANCELLED: "neutral",
  EXPIRED: "danger",
};

export function DemandOrdersPage() {
  const { client } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["demand-orders", "mine"],
    queryFn: () => client.demandOrders.listMine(),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Demand orders</h1>
          <p className="text-sm text-leaf-900/60">What you're looking to buy.</p>
        </div>
        <LinkButton to="/demand/new" className="hidden sm:inline-flex">
          Post demand
        </LinkButton>
      </div>

      {isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon size={30} />}
          title="No demand posted yet"
          description="Tell AgroFlow what you're looking to buy so matching listings can find you."
          action={
            <LinkButton to="/demand/new" className="mt-2">
              Post your first demand
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <GlassCard key={order.id} className="animate-rise-in">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <HandshakeIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      {order.crop.name.charAt(0) + order.crop.name.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      {order.quantity} {order.unit.replaceAll("_", " ").toLowerCase()}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              </div>
              {order.maxPricePerUnit && (
                <p className="font-mono text-sm text-leaf-900/70">
                  up to {order.currency} {order.maxPricePerUnit.toLocaleString()} / unit
                </p>
              )}
              <p className="mt-1 text-xs text-leaf-900/50">
                Needed by {new Date(order.neededBy).toLocaleDateString()}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <a
        href="/demand/new"
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-leaf-600 to-leaf-700 text-2xl font-semibold text-white shadow-glass-lg sm:hidden"
        aria-label="Post demand"
      >
        +
      </a>
    </div>
  );
}
