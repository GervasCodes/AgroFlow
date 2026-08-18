// Three views: "Available" (unclaimed jobs any transporter can claim),
// "As buyer" (shipments you've requested), "As transporter" (jobs
// you've claimed, with status controls). Which tabs show depends on
// permission -- a buyer with no shipment:update never sees Available.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ShipmentStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { useRole } from "@/hooks/useRole";
import { Badge, Button, EmptyState, GlassCard, IconTile, TruckIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<ShipmentStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING_PICKUP: "warning",
  ASSIGNED: "info",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

type Tab = "available" | "buyer" | "transporter";

export function ShipmentsPage() {
  const { client } = useAuth();
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const canClaim = hasPermission("shipment:update");
  const [tab, setTab] = useState<Tab>(canClaim ? "available" : "buyer");

  const availableQuery = useQuery({
    queryKey: ["shipments", "available"],
    queryFn: () => client.shipments.listAvailable(),
    enabled: tab === "available",
  });
  const buyerQuery = useQuery({
    queryKey: ["shipments", "as-buyer"],
    queryFn: () => client.shipments.listAsBuyer(),
    enabled: tab === "buyer",
  });
  const transporterQuery = useQuery({
    queryKey: ["shipments", "as-transporter"],
    queryFn: () => client.shipments.listAsTransporter(),
    enabled: tab === "transporter",
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => client.shipments.claim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "IN_TRANSIT" | "DELIVERED" }) =>
      client.shipments.updateStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });

  const activeQuery = tab === "available" ? availableQuery : tab === "buyer" ? buyerQuery : transporterQuery;
  const shipments = activeQuery.data ?? [];

  const tabs: { key: Tab; label: string }[] = [
    ...(canClaim ? [{ key: "available" as const, label: "Available" }] : []),
    { key: "buyer", label: "As buyer" },
    ...(canClaim ? [{ key: "transporter" as const, label: "As transporter" }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Shipments</h1>
        <p className="text-sm text-leaf-900/60">Delivery jobs linked to your purchase orders.</p>
      </div>

      {tabs.length > 1 && (
        <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab === t.key ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activeQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={<TruckIcon size={30} />}
          title="No shipments here"
          description={
            tab === "available"
              ? "No unclaimed jobs right now -- check back soon."
              : "Shipments linked to your purchase orders will show up here."
          }
        />
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <GlassCard key={shipment.id} className="animate-rise-in">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <TruckIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      To {shipment.deliveryLocation}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      Order total: {shipment.purchaseOrder.currency} {shipment.purchaseOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[shipment.status]}>{shipment.status.replaceAll("_", " ")}</Badge>
              </div>

              {tab === "available" && (
                <Button size="sm" isLoading={claimMutation.isPending} onClick={() => claimMutation.mutate(shipment.id)}>
                  Claim this job
                </Button>
              )}

              {tab === "transporter" && shipment.status === "ASSIGNED" && (
                <Button
                  size="sm"
                  isLoading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: shipment.id, status: "IN_TRANSIT" })}
                >
                  Mark picked up
                </Button>
              )}
              {tab === "transporter" && shipment.status === "IN_TRANSIT" && (
                <Button
                  size="sm"
                  isLoading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: shipment.id, status: "DELIVERED" })}
                >
                  Mark delivered
                </Button>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
