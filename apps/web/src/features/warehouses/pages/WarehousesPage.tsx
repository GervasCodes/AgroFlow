// Directory of registered warehouses. WAREHOUSE_MANAGER sees a "Mine"
// tab with an add-warehouse form and a utilization slider-style input;
// everyone else with warehouse:read just browses the directory (e.g.
// to find storage capacity near a region).
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWarehouseSchema } from "@agroflow/validation";
import { REGIONS } from "@agroflow/config";
import { useAuth } from "@/app/providers";
import { useRole } from "@/hooks/useRole";
import {
  Button,
  EmptyState,
  GlassCard,
  IconTile,
  Input,
  Select,
  WarehouseIcon,
  type SelectOption,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { ApiClientError } from "@agroflow/api-client";

const regionOptions: SelectOption[] = REGIONS.map((r) => ({
  value: r,
  label: r.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export function WarehousesPage() {
  const { client } = useAuth();
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const canManage = hasPermission("warehouse:create");
  const [tab, setTab] = useState<"directory" | "mine">("directory");
  const [showForm, setShowForm] = useState(false);

  const directoryQuery = useQuery({
    queryKey: ["warehouses", "directory"],
    queryFn: () => client.warehouses.browse(),
    enabled: tab === "directory",
  });
  const mineQuery = useQuery({
    queryKey: ["warehouses", "mine"],
    queryFn: () => client.warehouses.listMine(),
    enabled: tab === "mine",
  });

  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [capacityTonnes, setCapacityTonnes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.warehouses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setShowForm(false);
      setName("");
      setRegionId("");
      setCapacityTonnes("");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save warehouse."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = createWarehouseSchema.safeParse({
      name,
      regionId: regionId || undefined,
      capacityTonnes: capacityTonnes ? Number(capacityTonnes) : undefined,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name?.[0] ?? "", regionId: flat.regionId?.[0] ?? "" });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  const activeQuery = tab === "directory" ? directoryQuery : mineQuery;
  const warehouses = activeQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Warehouses</h1>
        <p className="text-sm text-leaf-900/60">Storage facilities registered on AgroFlow.</p>
      </div>

      {canManage && (
        <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
          {(["directory", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab === t ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
              )}
            >
              {t === "directory" ? "Directory" : "Mine"}
            </button>
          ))}
        </div>
      )}

      {activeQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={<WarehouseIcon size={30} />}
          title="No warehouses yet"
          description={tab === "mine" ? "Register your storage facility below." : "None registered in this view yet."}
        />
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {warehouses.map((w) => (
            <GlassCard key={w.id} className="animate-rise-in">
              <div className="flex items-start gap-3">
                <IconTile size="sm">
                  <WarehouseIcon size={16} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-semibold text-leaf-950">{w.name}</h3>
                  <p className="text-sm text-leaf-900/60">
                    {[w.district, w.regionId.replaceAll("_", " ")].filter(Boolean).join(", ")}
                  </p>
                  {w.capacityTonnes && (
                    <p className="mt-1 text-xs text-leaf-900/50">
                      {(w.currentUtilization ?? 0).toLocaleString()} / {w.capacityTonnes.toLocaleString()} tonnes used
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "mine" && canManage && (
        showForm ? (
          <GlassCard strong className="p-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input label="Warehouse name" value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name} />
              <Select label="Region" placeholder="Select region" options={regionOptions} value={regionId} onChange={(e) => setRegionId(e.target.value)} error={fieldErrors.regionId} />
              <Input
                label="Capacity (tonnes)"
                type="number"
                inputMode="decimal"
                min="0"
                value={capacityTonnes}
                onChange={(e) => setCapacityTonnes(e.target.value)}
                hint="Optional."
              />
              {formError && <p className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{formError}</p>}
              <div className="mt-2 flex gap-3">
                <Button type="submit" isLoading={mutation.isPending} className="flex-1">
                  Save warehouse
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        ) : (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            + Add warehouse
          </Button>
        )
      )}
    </div>
  );
}
