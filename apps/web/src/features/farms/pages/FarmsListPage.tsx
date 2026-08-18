// Lists the current user's farms. A FARMER typically has one or two; a
// VILLAGE_AGENT may register several on behalf of farmers they assist
// (that flow is added once agent-assisted auth lands in the channels
// phase -- for now this page shows whatever farms the signed-in user
// owns).
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/providers";
import { GlassCard, EmptyState, LinkButton, FarmIcon, IconTile } from "@/components/ui";

export function FarmsListPage() {
  const { client } = useAuth();
  const { data: farms, isLoading } = useQuery({
    queryKey: ["farms", "mine"],
    queryFn: () => client.farms.listMine(),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">My farms</h1>
          <p className="text-sm text-leaf-900/60">Manage the farms you've registered on AgroFlow.</p>
        </div>
        <LinkButton to="/farms/new" className="hidden sm:inline-flex">
          Add farm
        </LinkButton>
      </div>

      {isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : !farms || farms.length === 0 ? (
        <EmptyState
          icon={<FarmIcon size={30} />}
          title="No farms yet"
          description="Register your first farm to start listing produce for sale."
          action={
            <LinkButton to="/farms/new" className="mt-2">
              Add your first farm
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {farms.map((farm) => (
            <GlassCard key={farm.id} className="animate-rise-in">
              <div className="flex items-start gap-3">
                <IconTile size="sm">
                  <FarmIcon size={16} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-semibold text-leaf-950">{farm.name}</h3>
                  <p className="text-sm text-leaf-900/60">
                    {[farm.village, farm.ward, farm.district, farm.regionId.replaceAll("_", " ")]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {farm.sizeHectares && (
                    <p className="mt-1 text-xs text-leaf-900/50">{farm.sizeHectares} hectares</p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Mobile floating add button */}
      <Link
        to="/farms/new"
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-leaf-600 to-leaf-700 text-2xl font-semibold text-white shadow-glass-lg sm:hidden"
        aria-label="Add farm"
      >
        +
      </Link>
    </div>
  );
}
