// Reports dashboard -- channel-mix, price trends, dispute rate (see
// services/analytics). Plain CSS bar charts rather than pulling in a
// charting library for three simple aggregates -- keeps the bundle
// small and the visuals match the glassmorphism system exactly.
import { useQuery } from "@tanstack/react-query";
import { CHANNELS } from "@agroflow/config";
import { useAuth } from "@/app/providers";
import { GlassCard, ChartIcon, IconTile } from "@/components/ui";

function Bar({ label, value, max, formatValue }: { label: string; value: number; max: number; formatValue: (v: number) => string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-leaf-900/80">{label}</span>
        <span className="text-leaf-900/50">{formatValue(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-leaf-900/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-harvest-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { client } = useAuth();

  const channelMixQuery = useQuery({ queryKey: ["analytics", "channel-mix"], queryFn: () => client.analytics.channelMix() });
  const priceTrendsQuery = useQuery({ queryKey: ["analytics", "price-trends"], queryFn: () => client.analytics.priceTrends() });
  const disputeRateQuery = useQuery({ queryKey: ["analytics", "dispute-rate"], queryFn: () => client.analytics.disputeRate() });

  const channelMix = channelMixQuery.data ?? [];
  const priceTrends = priceTrendsQuery.data ?? [];
  const disputeRate = disputeRateQuery.data;

  const maxChannelCount = Math.max(1, ...channelMix.map((c) => c.listingCount));
  const maxPrice = Math.max(1, ...priceTrends.map((p) => p.averagePricePerUnit ?? 0));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Reports</h1>
        <p className="text-sm text-leaf-900/60">Channel mix, price trends, and dispute rate across the marketplace.</p>
      </div>

      <div className="grid gap-5">
        <GlassCard className="animate-rise-in">
          <div className="mb-4 flex items-center gap-3">
            <IconTile size="sm">
              <ChartIcon size={16} />
            </IconTile>
            <h2 className="font-display text-lg font-semibold text-leaf-950">Listings by channel</h2>
          </div>
          {channelMixQuery.isLoading ? (
            <p className="text-sm text-leaf-900/50">Loading...</p>
          ) : channelMix.length === 0 ? (
            <p className="text-sm text-leaf-900/50">No listings yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {CHANNELS.filter((c) => channelMix.some((row) => row.channel === c)).map((c) => {
                const row = channelMix.find((r) => r.channel === c)!;
                return (
                  <Bar key={c} label={c.replaceAll("_", " ")} value={row.listingCount} max={maxChannelCount} formatValue={(v) => `${v}`} />
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="animate-rise-in">
          <div className="mb-4 flex items-center gap-3">
            <IconTile size="sm">
              <ChartIcon size={16} />
            </IconTile>
            <h2 className="font-display text-lg font-semibold text-leaf-950">Average price per crop</h2>
          </div>
          {priceTrendsQuery.isLoading ? (
            <p className="text-sm text-leaf-900/50">Loading...</p>
          ) : priceTrends.length === 0 ? (
            <p className="text-sm text-leaf-900/50">No published listings with a price yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {priceTrends.map((p) => (
                <Bar
                  key={p.crop}
                  label={p.crop.charAt(0) + p.crop.slice(1).toLowerCase()}
                  value={p.averagePricePerUnit ?? 0}
                  max={maxPrice}
                  formatValue={(v) => `TZS ${Math.round(v).toLocaleString()}`}
                />
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="animate-rise-in">
          <div className="mb-4 flex items-center gap-3">
            <IconTile size="sm">
              <ChartIcon size={16} />
            </IconTile>
            <h2 className="font-display text-lg font-semibold text-leaf-950">Dispute rate</h2>
          </div>
          {disputeRateQuery.isLoading || !disputeRate ? (
            <p className="text-sm text-leaf-900/50">Loading...</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-leaf-950">
                {(disputeRate.disputeRate * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-leaf-900/50">
                {disputeRate.totalDisputes} of {disputeRate.totalOrders} orders disputed
              </span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
