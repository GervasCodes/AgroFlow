import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestShipmentSchema } from "@agroflow/validation";
import { Button, GlassCard, Input, IconTile, TruckIcon } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

export function RequestShipmentPage() {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.shipments.request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      navigate("/shipments");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not request shipment."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!purchaseOrderId) return;

    const parsed = requestShipmentSchema.safeParse({ purchaseOrderId, deliveryLocation });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.deliveryLocation?.[0]);
      return;
    }
    setFieldError(undefined);
    mutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <IconTile size="md">
          <TruckIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Request shipment</h1>
          <p className="text-sm text-leaf-900/60">Any transporter on AgroFlow can claim this job.</p>
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Delivery location"
            placeholder="e.g. Kariakoo Market, Dar es Salaam"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            error={fieldError}
          />

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Request shipment
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
