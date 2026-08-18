import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDemandOrderSchema } from "@agroflow/validation";
import { CROPS, UNITS, QUALITY_GRADES, REGIONS } from "@agroflow/config";
import { Button, GlassCard, Input, Select, IconTile, HandshakeIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

const cropOptions = CROPS.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }));
const unitOptions = UNITS.map((u) => ({ value: u, label: u.replaceAll("_", " ").toLowerCase() }));
const qualityOptions = QUALITY_GRADES.map((q) => ({ value: q, label: q.replaceAll("_", " ") }));
const regionOptions = REGIONS.map((r) => ({
  value: r,
  label: r.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export function CreateDemandOrderPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [qualityGrade, setQualityGrade] = useState("");
  const [maxPricePerUnit, setMaxPricePerUnit] = useState("");
  const [regionId, setRegionId] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.demandOrders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demand-orders"] });
      navigate("/demand");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save demand order."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createDemandOrderSchema.safeParse({
      crop: crop || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      qualityGrade: qualityGrade || undefined,
      maxPricePerUnit: maxPricePerUnit ? Number(maxPricePerUnit) : undefined,
      regionId: regionId || undefined,
      neededBy: neededBy || undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        crop: flat.crop?.[0] ?? "",
        quantity: flat.quantity?.[0] ?? "",
        unit: flat.unit?.[0] ?? "",
        neededBy: flat.neededBy?.[0] ?? "",
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
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Post demand</h1>
          <p className="text-sm text-leaf-900/60">Tell AgroFlow what you're looking to buy.</p>
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Select label="Crop" placeholder="Select crop" options={cropOptions} value={crop} onChange={(e) => setCrop(e.target.value)} error={fieldErrors.crop} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={fieldErrors.quantity}
            />
            <Select label="Unit" placeholder="Select unit" options={unitOptions} value={unit} onChange={(e) => setUnit(e.target.value)} error={fieldErrors.unit} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Quality grade" placeholder="Any" options={qualityOptions} value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} />
            <Input
              label="Max price per unit (TZS)"
              type="number"
              inputMode="decimal"
              min="0"
              value={maxPricePerUnit}
              onChange={(e) => setMaxPricePerUnit(e.target.value)}
              hint="Optional."
            />
          </div>
          <Select label="Delivery region" placeholder="Any region" options={regionOptions} value={regionId} onChange={(e) => setRegionId(e.target.value)} />
          <Input
            label="Needed by"
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            error={fieldErrors.neededBy}
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Post demand
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/demand")}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
