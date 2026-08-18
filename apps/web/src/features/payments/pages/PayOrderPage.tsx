// Reached from Orders ("Pay"). No live mobile money gateway call is
// made here yet (see apps/api's services/payments) -- this records the
// payer's chosen provider and shows the same "check your phone"
// instruction a real STK-push flow would produce, so the UI is honest
// about what happens next rather than faking a completed payment.
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { initiatePaymentSchema } from "@agroflow/validation";
import { MOBILE_MONEY_PROVIDERS, MOBILE_MONEY_LABELS } from "@agroflow/config";
import { Button, GlassCard, Select, IconTile, CoinIcon, type SelectOption } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

const providerOptions: SelectOption[] = MOBILE_MONEY_PROVIDERS.map((p) => ({
  value: p,
  label: MOBILE_MONEY_LABELS[p],
}));

export function PayOrderPage() {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.payments.initiate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setInstructions(result.instructions);
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not start payment."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!purchaseOrderId) return;

    const parsed = initiatePaymentSchema.safeParse({ purchaseOrderId, provider: provider || undefined });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.provider?.[0]);
      return;
    }
    setFieldError(undefined);
    mutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <IconTile size="md">
          <CoinIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Pay for order</h1>
          <p className="text-sm text-leaf-900/60">Choose your mobile money provider.</p>
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        {instructions ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl bg-leaf-100 px-4 py-3 text-sm text-leaf-800">{instructions}</p>
            <Button onClick={() => navigate("/orders")}>Back to orders</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Select
              label="Mobile money provider"
              placeholder="Select provider"
              options={providerOptions}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              error={fieldError}
            />

            {formError && (
              <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
                {formError}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
                Continue
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
