// Purchase orders are created automatically when a match is approved
// (see MatchesPage) -- this page is read-only plus one action: a buyer
// can request a shipment for an order that doesn't have one yet.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PurchaseOrderStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { Badge, EmptyState, GlassCard, HandshakeIcon, IconTile, LinkButton } from "@/components/ui";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<PurchaseOrderStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  IN_FULFILLMENT: "info",
  DELIVERED: "success",
  PAID: "success",
  CANCELLED: "neutral",
  DISPUTED: "danger",
};

export function PurchaseOrdersPage() {
  const { client } = useAuth();
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");

  const buyerQuery = useQuery({
    queryKey: ["purchase-orders", "as-buyer"],
    queryFn: () => client.purchaseOrders.listAsBuyer(),
    enabled: tab === "buyer",
  });
  const sellerQuery = useQuery({
    queryKey: ["purchase-orders", "as-seller"],
    queryFn: () => client.purchaseOrders.listAsSeller(),
    enabled: tab === "seller",
  });

  const activeQuery = tab === "buyer" ? buyerQuery : sellerQuery;
  const orders = activeQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Purchase orders</h1>
        <p className="text-sm text-leaf-900/60">Created automatically when a match is approved.</p>
      </div>

      <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
        {(["buyer", "seller"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
            )}
          >
            {t === "buyer" ? "As buyer" : "As seller"}
          </button>
        ))}
      </div>

      {activeQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon size={30} />}
          title="No purchase orders yet"
          description="Approving a match (Matches page) creates one automatically."
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <GlassCard key={order.id} className="animate-rise-in">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <HandshakeIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      {order.currency} {order.totalAmount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      {order.items.map((i) => `${i.quantity} ${i.unit.toLowerCase()}`).join(", ")}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[order.status]}>{order.status.replaceAll("_", " ")}</Badge>
              </div>

              {tab === "buyer" && (
                <div className="flex flex-wrap gap-2">
                  <LinkButton to={`/shipments/request/${order.id}`} size="sm" variant="secondary">
                    Request shipment
                  </LinkButton>
                  {order.status !== "PAID" && (
                    <LinkButton to={`/payments/pay/${order.id}`} size="sm" variant="secondary">
                      Pay
                    </LinkButton>
                  )}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
