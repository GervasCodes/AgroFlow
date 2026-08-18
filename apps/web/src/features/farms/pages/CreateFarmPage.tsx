import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFarmSchema } from "@agroflow/validation";
import { REGIONS } from "@agroflow/config";
import { Button, GlassCard, Input, Select, IconTile, FarmIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

const regionOptions = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export function CreateFarmPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [village, setVillage] = useState("");
  const [sizeHectares, setSizeHectares] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.farms.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms", "mine"] });
      navigate("/farms");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save farm."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = createFarmSchema.safeParse({
      name,
      regionId: regionId || undefined,
      district: district || undefined,
      ward: ward || undefined,
      village: village || undefined,
      sizeHectares: sizeHectares ? Number(sizeHectares) : undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: flat.name?.[0] ?? "",
        regionId: flat.regionId?.[0] ?? "",
        sizeHectares: flat.sizeHectares?.[0] ?? "",
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
          <FarmIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Add a farm</h1>
          <p className="text-sm text-leaf-900/60">A few details so buyers know where produce comes from.</p>
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Farm name"
            name="name"
            placeholder="e.g. Mwakalinga Farm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Select
            label="Region"
            placeholder="Select region"
            options={regionOptions}
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            error={fieldErrors.regionId}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="District" name="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <Input label="Ward" name="ward" value={ward} onChange={(e) => setWard(e.target.value)} />
          </div>
          <Input label="Village" name="village" value={village} onChange={(e) => setVillage(e.target.value)} />
          <Input
            label="Size (hectares)"
            name="sizeHectares"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={sizeHectares}
            onChange={(e) => setSizeHectares(e.target.value)}
            error={fieldErrors.sizeHectares}
            hint="Optional -- leave blank if you're not sure."
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Save farm
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/farms")}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
