// Transporter home -- two lists (Available jobs to claim, My active
// jobs) plus a big "Update status" action per active job that cycles
// the Shipment Lifecycle. Status updates are offline-queued (see
// offlineQueue.ts) since a transporter is exactly the person most
// likely to be mid-delivery with no signal when they need to mark a
// shipment IN_TRANSIT or DELIVERED.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { ShipmentStatus, ShipmentWithRelations } from "@agroflow/types";
import { Button, GlassCard, IconTile, TruckIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { enqueueShipmentStatusUpdate } from "@/sync/offlineQueue";
import { fonts, colors } from "@/theme";

const NEXT_STATUS: Partial<Record<ShipmentStatus, "IN_TRANSIT" | "DELIVERED">> = {
  ASSIGNED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};
const NEXT_LABEL: Record<string, string> = { IN_TRANSIT: "Mark in transit", DELIVERED: "Mark delivered" };

export default function TransporterHomeScreen() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  const availableQuery = useQuery({ queryKey: ["shipments", "available"], queryFn: () => apiClient.shipments.listAvailable() });
  const mineQuery = useQuery({ queryKey: ["shipments", "as-transporter"], queryFn: () => apiClient.shipments.listAsTransporter() });

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.shipments.claim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });

  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());

  async function handleAdvance(shipment: ShipmentWithRelations) {
    const next = NEXT_STATUS[shipment.status];
    if (!next) return;

    if (isOnline) {
      try {
        await apiClient.shipments.updateStatus(shipment.id, { status: next });
        queryClient.invalidateQueries({ queryKey: ["shipments"] });
        return;
      } catch {
        // fall through to offline queue below -- e.g. a flaky connection
        // NetInfo reported as online
      }
    }
    await enqueueShipmentStatusUpdate(shipment.id, { status: next });
    setQueuedIds((prev) => new Set(prev).add(shipment.id));
  }

  const activeJobs = (mineQuery.data ?? []).filter((s) => s.status === "ASSIGNED" || s.status === "IN_TRANSIT");
  const availableJobs = availableQuery.data ?? [];

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <IconTile size="md">
          <TruckIcon size={22} />
        </IconTile>
        <View>
          <Text style={styles.title}>Mizigo</Text>
          <Text style={styles.subtitle}>Your active deliveries and jobs you can claim.</Text>
        </View>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You're offline. Status updates will be saved and sent automatically once you're back online.
          </Text>
        </View>
      )}

      <FlatList
        data={[
          { key: "active-header", type: "header" as const, label: "My active jobs" },
          ...activeJobs.map((s) => ({ key: s.id, type: "active" as const, shipment: s })),
          { key: "available-header", type: "header" as const, label: "Available jobs" },
          ...availableJobs.map((s) => ({ key: s.id, type: "available" as const, shipment: s })),
        ]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <Text style={styles.sectionLabel}>{item.label}</Text>;
          }
          const s = item.shipment;
          const next = item.type === "active" ? NEXT_STATUS[s.status] : undefined;
          const isQueued = queuedIds.has(s.id);
          return (
            <GlassCard style={styles.card}>
              <Text style={styles.location}>{s.deliveryLocation}</Text>
              <Text style={styles.meta}>
                Order {s.purchaseOrder.totalAmount.toLocaleString()} {s.purchaseOrder.currency} &middot;{" "}
                {s.status.replaceAll("_", " ")}
                {isQueued ? " (update queued)" : ""}
              </Text>
              <View style={{ height: 12 }} />
              {item.type === "available" ? (
                <Button
                  title="Claim job"
                  onPress={() => claimMutation.mutate(s.id)}
                  isLoading={claimMutation.isPending && claimMutation.variables === s.id}
                />
              ) : next ? (
                <Button title={NEXT_LABEL[next]} onPress={() => handleAdvance(s)} />
              ) : null}
            </GlassCard>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No jobs right now.</Text>}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", maxWidth: 260 },
  offlineBanner: { backgroundColor: colors.harvest[100], borderRadius: 16, padding: 12, marginHorizontal: 20 },
  offlineText: { fontFamily: fonts.sans, fontSize: 13, color: colors.harvest[800] },
  list: { padding: 20, gap: 10, paddingBottom: 100 },
  sectionLabel: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.leaf[900] + "80", marginTop: 8, marginBottom: 2 },
  card: {},
  location: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", padding: 20 },
});
