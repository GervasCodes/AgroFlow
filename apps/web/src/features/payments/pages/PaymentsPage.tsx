// Payment history for the signed-in user (as payer). Status updates
// (PENDING -> CONFIRMED/FAILED) land via the webhook once a real
// gateway is wired up (see apps/api's services/payments) -- this page
// just reflects whatever's in the database.
import { useQuery } from "@tanstack/react-query";
import type { PaymentStatus } from "@agroflow/types";
import { MOBILE_MONEY_LABELS, type MobileMoneyProvider } from "@agroflow/config";
import { useAuth } from "@/app/providers";
import { Badge, CoinIcon, EmptyState, GlassCard, IconTile } from "@/components/ui";

const STATUS_TONE: Record<PaymentStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

export function PaymentsPage() {
  const { client } = useAuth();
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", "mine"],
    queryFn: () => client.payments.listMine(),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Payments</h1>
        <p className="text-sm text-leaf-900/60">Your mobile money payment history.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : !payments || payments.length === 0 ? (
        <EmptyState
          icon={<CoinIcon size={30} />}
          title="No payments yet"
          description="Pay for an order from the Orders page to see it here."
        />
      ) : (
        <div className="grid gap-4">
          {payments.map((p) => (
            <GlassCard key={p.id} className="animate-rise-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <IconTile size="sm">
                    <CoinIcon size={16} />
                  </IconTile>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-leaf-950">
                      {p.currency} {p.amount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-leaf-900/60">
                      {MOBILE_MONEY_LABELS[p.provider as MobileMoneyProvider] ?? p.provider}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
