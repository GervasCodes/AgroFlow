// Two tabs: "My listings" (the signed-in farmer's own listings, any
// status) and "Browse" (published listings from everyone -- what a
// buyer/aggregator sees). Both reuse the same card since the shape is
// identical; only the status badge and CTA differ.
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProduceListingStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { useRole } from "@/hooks/useRole";
import { Badge, Button, GlassCard, EmptyState, LinkButton, IconTile, LeafIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<ProduceListingStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  MATCHED: "info",
  SOLD: "success",
  EXPIRED: "danger",
  WITHDRAWN: "neutral",
};

export function ProduceListingsPage() {
  const { client } = useAuth();
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const canCreate = hasPermission("produce_listing:create");
  const [tab, setTab] = useState<"mine" | "browse">(canCreate ? "mine" : "browse");

  const mineQuery = useQuery({
    queryKey: ["produce-listings", "mine"],
    queryFn: () => client.produceListings.listMine(),
    enabled: tab === "mine",
  });
  const browseQuery = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => client.produceListings.browse(),
    enabled: tab === "browse",
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => client.produceListings.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produce-listings"] }),
  });
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => client.produceListings.withdraw(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produce-listings"] }),
  });

  const activeQuery = tab === "mine" ? mineQuery : browseQuery;
  const listings = activeQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Produce listings</h1>
          <p className="text-sm text-leaf-900/60">
            {tab === "mine" ? "What you have listed for sale." : "Published listings across AgroFlow."}
          </p>
        </div>
        {canCreate && (
          <LinkButton to="/produce/new" className="hidden sm:inline-flex">
            New listing
          </LinkButton>
        )}
      </div>

      {canCreate && (
        <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
          {(["mine", "browse"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab === t ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
              )}
            >
              {t === "mine" ? "My listings" : "Browse"}
            </button>
          ))}
        </div>
      )}

      {activeQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<LeafIcon size={30} />}
          title={tab === "mine" ? "No listings yet" : "Nothing published yet"}
          description={
            tab === "mine"
              ? "List your available produce so buyers can find it."
              : "Check back soon, or switch regions/crops once filters are added."
          }
          action={
            canCreate && tab === "mine" ? (
              <LinkButton to="/produce/new" className="mt-2">
                Create a listing
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <GlassCard key={listing.id} className="animate-rise-in">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <LeafIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      {listing.crop.name.charAt(0) + listing.crop.name.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      {listing.quantity} {listing.unit.replaceAll("_", " ").toLowerCase()}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[listing.status]}>{listing.status.replaceAll("_", " ")}</Badge>
              </div>

              {listing.pricePerUnit && (
                <p className="mb-1 font-mono text-sm text-leaf-900/70">
                  {listing.currency} {listing.pricePerUnit.toLocaleString()} / unit
                </p>
              )}
              {listing.qualityGrade && (
                <Badge tone={listing.qualityGrade === "REJECTED" ? "danger" : "info"} className="mb-3">
                  {listing.qualityGrade.replaceAll("_", " ")}
                </Badge>
              )}

              {tab === "mine" && (
                <div className="flex gap-2">
                  {listing.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(listing.id)}
                    >
                      Publish
                    </Button>
                  )}
                  {listing.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate(listing.id)}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              )}

              {tab === "browse" && (
                <div className="flex flex-wrap gap-2">
                  {hasPermission("match:create") && (
                    <LinkButton to={`/matches/propose/${listing.id}`} size="sm" variant="secondary">
                      Propose match
                    </LinkButton>
                  )}
                  {hasPermission("quality_inspection:create") && (
                    <LinkButton to={`/quality/inspect/${listing.id}`} size="sm" variant="ghost">
                      Inspect
                    </LinkButton>
                  )}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {canCreate && (
        <a
          href="/produce/new"
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-leaf-600 to-leaf-700 text-2xl font-semibold text-white shadow-glass-lg sm:hidden"
          aria-label="New listing"
        >
          +
        </a>
      )}
    </div>
  );
}
