// Two tabs: "As buyer" (matches you've proposed, pending the seller's
// response) and "As seller" (incoming interest on your listings, with
// Approve/Reject). Approving auto-creates a PurchaseOrder server-side
// (see apps/api's services/matches -- approveMatch).
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MatchStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { Badge, Button, EmptyState, GlassCard, HandshakeIcon, IconTile } from "@/components/ui";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<MatchStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PROPOSED: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

export function MatchesPage() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"buyer" | "seller">("seller");

  const buyerQuery = useQuery({
    queryKey: ["matches", "as-buyer"],
    queryFn: () => client.matches.listAsBuyer(),
    enabled: tab === "buyer",
  });
  const sellerQuery = useQuery({
    queryKey: ["matches", "as-seller"],
    queryFn: () => client.matches.listAsSeller(),
    enabled: tab === "seller",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => client.matches.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => client.matches.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  const activeQuery = tab === "buyer" ? buyerQuery : sellerQuery;
  const matches = activeQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Matches</h1>
        <p className="text-sm text-leaf-900/60">
          {tab === "seller" ? "Interest from buyers on your listings." : "Matches you've proposed."}
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
        {(["seller", "buyer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
            )}
          >
            {t === "seller" ? "Incoming (as seller)" : "Sent (as buyer)"}
          </button>
        ))}
      </div>

      {activeQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon size={30} />}
          title="No matches yet"
          description={
            tab === "seller"
              ? "When a buyer proposes to buy from one of your listings, it shows up here."
              : "Propose a match from a listing in Produce > Browse."
          }
        />
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <GlassCard key={match.id} className="animate-rise-in">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <HandshakeIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      {match.matchedQuantity} {match.produceListing.unit.replaceAll("_", " ").toLowerCase()}{" "}
                      {match.produceListing.crop.name.charAt(0) + match.produceListing.crop.name.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      {tab === "seller"
                        ? `From listing at ${match.produceListing.farm.name}`
                        : `Against your demand for ${match.demandOrder.crop.name.toLowerCase()}`}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[match.status]}>{match.status}</Badge>
              </div>

              {match.proposedPricePerUnit && (
                <p className="mb-3 font-mono text-sm text-leaf-900/70">
                  TZS {match.proposedPricePerUnit.toLocaleString()} / unit
                </p>
              )}

              {tab === "seller" && match.status === "PROPOSED" && (
                <div className="flex gap-2">
                  <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(match.id)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isLoading={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(match.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
