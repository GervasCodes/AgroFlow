// Reached from a listing card in Produce > Browse ("Propose match").
// The buyer picks which of their OPEN demand orders (for the same crop)
// this listing should fulfil, sets the quantity/price they're offering,
// and sends it to the listing's owner to approve.
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposeMatchSchema } from "@agroflow/validation";
import { Button, GlassCard, Input, Select, IconTile, HandshakeIcon, type SelectOption } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

export function ProposeMatchPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => client.produceListings.browse(),
  });
  const listing = listings?.find((l) => l.id === listingId);

  const { data: demandOrders } = useQuery({
    queryKey: ["demand-orders", "mine"],
    queryFn: () => client.demandOrders.listMine(),
  });
  const eligibleOrders: SelectOption[] = (demandOrders ?? [])
    .filter((d) => d.status === "OPEN" && (!listing || d.cropId === listing.cropId))
    .map((d) => ({ value: d.id, label: `${d.quantity} ${d.unit.toLowerCase()} ${d.crop.name.toLowerCase()}` }));

  const [demandOrderId, setDemandOrderId] = useState("");
  const [matchedQuantity, setMatchedQuantity] = useState("");
  const [proposedPricePerUnit, setProposedPricePerUnit] = useState(
    listing?.pricePerUnit ? String(listing.pricePerUnit) : "",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.matches.propose,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      navigate("/matches");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not propose match."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!listingId) return;

    const parsed = proposeMatchSchema.safeParse({
      demandOrderId: demandOrderId || undefined,
      produceListingId: listingId,
      matchedQuantity: matchedQuantity ? Number(matchedQuantity) : undefined,
      proposedPricePerUnit: proposedPricePerUnit ? Number(proposedPricePerUnit) : undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        demandOrderId: flat.demandOrderId?.[0] ?? "",
        matchedQuantity: flat.matchedQuantity?.[0] ?? "",
      });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <IconTile size="md">
          <HandshakeIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Propose a match</h1>
          {listing && (
            <p className="text-sm text-leaf-900/60">
              {listing.quantity} {listing.unit.toLowerCase()} {listing.crop.name.toLowerCase()} from{" "}
              {listing.farm.name}
            </p>
          )}
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Select
            label="Which of your demand orders is this for?"
            placeholder={eligibleOrders.length ? "Select demand order" : "No open demand for this crop"}
            options={eligibleOrders}
            value={demandOrderId}
            onChange={(e) => setDemandOrderId(e.target.value)}
            error={fieldErrors.demandOrderId}
            disabled={eligibleOrders.length === 0}
          />
          <Input
            label="Quantity you want"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={matchedQuantity}
            onChange={(e) => setMatchedQuantity(e.target.value)}
            error={fieldErrors.matchedQuantity}
          />
          <Input
            label="Offered price per unit (TZS)"
            type="number"
            inputMode="decimal"
            min="0"
            value={proposedPricePerUnit}
            onChange={(e) => setProposedPricePerUnit(e.target.value)}
            hint="Defaults to the listing's asking price if left blank."
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Send proposal
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
