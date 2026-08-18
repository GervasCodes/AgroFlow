import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduceListingSchema } from "@agroflow/validation";
import { CROPS, UNITS, QUALITY_GRADES } from "@agroflow/config";
import { Button, GlassCard, Input, Select, IconTile, LeafIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

const cropOptions = CROPS.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }));
const unitOptions = UNITS.map((u) => ({ value: u, label: u.replaceAll("_", " ").toLowerCase() }));
const qualityOptions = QUALITY_GRADES.map((q) => ({ value: q, label: q.replaceAll("_", " ") }));

export function CreateListingPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: farms } = useQuery({ queryKey: ["farms", "mine"], queryFn: () => client.farms.listMine() });
  const farmOptions = (farms ?? []).map((f) => ({ value: f.id, label: f.name }));

  const [farmId, setFarmId] = useState("");
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [qualityGrade, setQualityGrade] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.produceListings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produce-listings"] });
      navigate("/produce");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save listing."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createProduceListingSchema.safeParse({
      farmId,
      crop: crop || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      qualityGrade: qualityGrade || undefined,
      pricePerUnit: pricePerUnit ? Number(pricePerUnit) : undefined,
      availableFrom: availableFrom || undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        farmId: flat.farmId?.[0] ?? "",
        crop: flat.crop?.[0] ?? "",
        quantity: flat.quantity?.[0] ?? "",
        unit: flat.unit?.[0] ?? "",
        availableFrom: flat.availableFrom?.[0] ?? "",
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
          <LeafIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">List produce</h1>
          <p className="text-sm text-leaf-900/60">Add what you have available so buyers can find it.</p>
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Select
            label="Farm"
            placeholder={farmOptions.length ? "Select farm" : "Add a farm first"}
            options={farmOptions}
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            error={fieldErrors.farmId}
            disabled={farmOptions.length === 0}
          />
          <Select
            label="Crop"
            placeholder="Select crop"
            options={cropOptions}
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            error={fieldErrors.crop}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={fieldErrors.quantity}
            />
            <Select
              label="Unit"
              placeholder="Select unit"
              options={unitOptions}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              error={fieldErrors.unit}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Quality grade"
              placeholder="Optional"
              options={qualityOptions}
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
            />
            <Input
              label="Price per unit (TZS)"
              name="pricePerUnit"
              type="number"
              inputMode="decimal"
              min="0"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              hint="Optional -- leave blank to negotiate."
            />
          </div>
          <Input
            label="Available from"
            name="availableFrom"
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            error={fieldErrors.availableFrom}
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Save listing
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/produce")}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
