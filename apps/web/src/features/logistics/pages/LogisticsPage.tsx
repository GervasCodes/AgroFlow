// Logistics -- two sections: Dispatch board (unclaimed shipment jobs;
// claiming itself still happens on the Shipments page, this is the
// overview a transporter dispatcher scans) and Storage bookings (book
// warehouse capacity, see services/logistics -- the StorageBooking
// model the Warehouse model's own comment had deferred until Logistics
// had something to book against).
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStorageBookingSchema } from "@agroflow/validation";
import { useAuth } from "@/app/providers";
import { useRole } from "@/hooks/useRole";
import { Badge, Button, EmptyState, GlassCard, IconTile, Input, Select, TruckIcon, WarehouseIcon, type SelectOption } from "@/components/ui";
import { ApiClientError } from "@agroflow/api-client";

export function LogisticsPage() {
  const { client } = useAuth();
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const canBook = hasPermission("storage_booking:create");
  const [showForm, setShowForm] = useState(false);

  const dispatchQuery = useQuery({ queryKey: ["logistics", "dispatch-board"], queryFn: () => client.logistics.dispatchBoard() });
  const bookingsQuery = useQuery({ queryKey: ["logistics", "storage-bookings", "mine"], queryFn: () => client.logistics.listMyStorageBookings() });
  const warehousesQuery = useQuery({ queryKey: ["warehouses", "directory"], queryFn: () => client.warehouses.browse(), enabled: canBook });

  const warehouseOptions: SelectOption[] = (warehousesQuery.data ?? []).map((w) => ({ value: w.id, label: w.name }));

  const [warehouseId, setWarehouseId] = useState("");
  const [quantityTonnes, setQuantityTonnes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const bookMutation = useMutation({
    mutationFn: client.logistics.createStorageBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics", "storage-bookings"] });
      setShowForm(false);
      setWarehouseId("");
      setQuantityTonnes("");
      setStartDate("");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not create booking."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = createStorageBookingSchema.safeParse({
      warehouseId,
      quantityTonnes: quantityTonnes ? Number(quantityTonnes) : undefined,
      startDate: startDate || undefined,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        warehouseId: flat.warehouseId?.[0] ?? "",
        quantityTonnes: flat.quantityTonnes?.[0] ?? "",
        startDate: flat.startDate?.[0] ?? "",
      });
      return;
    }
    setFieldErrors({});
    bookMutation.mutate(parsed.data);
  }

  const dispatchJobs = dispatchQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Logistics</h1>
        <p className="text-sm text-leaf-900/60">Dispatch board and warehouse storage bookings.</p>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-leaf-950">Dispatch board</h2>
      {dispatchQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : dispatchJobs.length === 0 ? (
        <EmptyState icon={<TruckIcon size={30} />} title="No unclaimed jobs" description="Unclaimed shipments will show up here." />
      ) : (
        <div className="mb-8 grid gap-3">
          {dispatchJobs.map((s) => (
            <GlassCard key={s.id} className="animate-rise-in">
              <div className="flex items-center gap-3">
                <IconTile size="sm">
                  <TruckIcon size={16} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-leaf-950">{s.deliveryLocation}</p>
                  <p className="text-sm text-leaf-900/60">
                    Order {s.purchaseOrder.totalAmount.toLocaleString()} {s.purchaseOrder.currency}
                  </p>
                </div>
                <Badge tone="warning">{s.status.replaceAll("_", " ")}</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-display text-lg font-semibold text-leaf-950">Storage bookings</h2>
      {bookingsQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : bookings.length === 0 ? (
        <EmptyState icon={<WarehouseIcon size={30} />} title="No storage bookings yet" description="Book warehouse capacity below." />
      ) : (
        <div className="mb-6 grid gap-3">
          {bookings.map((b) => (
            <GlassCard key={b.id} className="animate-rise-in">
              <div className="flex items-center gap-3">
                <IconTile size="sm">
                  <WarehouseIcon size={16} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-leaf-950">{b.warehouse.name}</p>
                  <p className="text-sm text-leaf-900/60">
                    {b.quantityTonnes.toLocaleString()} tonnes from {new Date(b.startDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge tone={b.status === "COMPLETED" ? "success" : b.status === "CANCELLED" ? "danger" : "info"}>
                  {b.status}
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {canBook &&
        (showForm ? (
          <GlassCard strong className="p-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Select
                label="Warehouse"
                placeholder="Select warehouse"
                options={warehouseOptions}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                error={fieldErrors.warehouseId}
              />
              <Input
                label="Quantity (tonnes)"
                type="number"
                inputMode="decimal"
                min="0"
                value={quantityTonnes}
                onChange={(e) => setQuantityTonnes(e.target.value)}
                error={fieldErrors.quantityTonnes}
              />
              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={fieldErrors.startDate}
              />
              {formError && <p className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{formError}</p>}
              <div className="mt-2 flex gap-3">
                <Button type="submit" isLoading={bookMutation.isPending} className="flex-1">
                  Book storage
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        ) : (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            + Book storage
          </Button>
        ))}
    </div>
  );
}
