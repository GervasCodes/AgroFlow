// Aggregation board -- an AGGREGATOR/WAREHOUSE_MANAGER's consolidated
// Inventory lots (see services/aggregation). Booking the warehouse
// space those lots sit in happens on the Logistics page.
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInventorySchema } from "@agroflow/validation";
import { CROPS, UNITS } from "@agroflow/config";
import { useAuth } from "@/app/providers";
import { Button, EmptyState, GlassCard, IconTile, Input, Select, StackIcon, type SelectOption } from "@/components/ui";
import { ApiClientError } from "@agroflow/api-client";

const cropOptions: SelectOption[] = CROPS.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }));
const unitOptions: SelectOption[] = UNITS.map((u) => ({ value: u, label: u.replaceAll("_", " ") }));

export function AggregationPage() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const inventoryQuery = useQuery({ queryKey: ["inventory", "mine"], queryFn: () => client.inventory.listMine() });

  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: client.inventory.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setShowForm(false);
      setCrop("");
      setQuantity("");
      setUnit("");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save inventory lot."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => client.inventory.updateQuantity(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = createInventorySchema.safeParse({
      crop: crop || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ crop: flat.crop?.[0] ?? "", quantity: flat.quantity?.[0] ?? "", unit: flat.unit?.[0] ?? "" });
      return;
    }
    setFieldErrors({});
    createMutation.mutate(parsed.data);
  }

  const lots = inventoryQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Aggregation</h1>
        <p className="text-sm text-leaf-900/60">Bulk inventory lots consolidated from produce listings.</p>
      </div>

      {inventoryQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : lots.length === 0 ? (
        <EmptyState icon={<StackIcon size={30} />} title="No inventory lots yet" description="Add your first consolidated lot below." />
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {lots.map((lot) => (
            <GlassCard key={lot.id} className="animate-rise-in">
              <div className="flex items-start gap-3">
                <IconTile size="sm">
                  <StackIcon size={16} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-leaf-950">
                    {lot.crop.name.charAt(0) + lot.crop.name.slice(1).toLowerCase()}
                  </h3>
                  <p className="text-sm text-leaf-900/60">{lot.warehouse?.name ?? "No warehouse assigned"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-28">
                      <Input
                        label="Quantity"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        defaultValue={lot.quantity}
                        onBlur={(e) => {
                          const next = Number(e.target.value);
                          if (Number.isFinite(next) && next > 0 && next !== lot.quantity) {
                            updateMutation.mutate({ id: lot.id, quantity: next });
                          }
                        }}
                        className="!h-9 text-sm"
                      />
                    </div>
                    <span className="self-end pb-2 text-xs text-leaf-900/50">{lot.unit.replaceAll("_", " ")}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showForm ? (
        <GlassCard strong className="p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Select label="Crop" placeholder="Select crop" options={cropOptions} value={crop} onChange={(e) => setCrop(e.target.value)} error={fieldErrors.crop} />
            <Input label="Quantity" type="number" inputMode="decimal" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={fieldErrors.quantity} />
            <Select label="Unit" placeholder="Select unit" options={unitOptions} value={unit} onChange={(e) => setUnit(e.target.value)} error={fieldErrors.unit} />
            {formError && <p className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{formError}</p>}
            <div className="mt-2 flex gap-3">
              <Button type="submit" isLoading={createMutation.isPending} className="flex-1">
                Save lot
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          + Add inventory lot
        </Button>
      )}
    </div>
  );
}
