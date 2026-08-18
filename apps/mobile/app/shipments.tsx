// Transporter companion screen -- browse unclaimed shipment jobs, claim
// one, and progress a claimed job through pickup -> delivered. Mirrors
// apps/web's ShipmentsPage. Two tabs (Available / Mine) since a
// transporter's own claimed jobs need different actions than the open
// job board.
import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, GlassCard, IconTile, TruckIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function ShipmentsScreen() {
  const [tab, setTab] = useState<"available" | "mine">("available");
  const queryClient = useQueryClient();

  const availableQuery = useQuery({
    queryKey: ["shipments", "available"],
    queryFn: () => apiClient.shipments.listAvailable(),
    enabled: tab === "available",
  });
  const mineQuery = useQuery({
    queryKey: ["shipments", "as-transporter"],
    queryFn: () => apiClient.shipments.listAsTransporter(),
    enabled: tab === "mine",
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.shipments.claim(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "IN_TRANSIT" | "DELIVERED" }) =>
      apiClient.shipments.updateStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
  });

  const activeQuery = tab === "available" ? availableQuery : mineQuery;
  const shipments = activeQuery.data ?? [];

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </Pressable>
        <Text style={styles.title}>Mizigo</Text>
        <Text style={styles.subtitle}>Shipments</Text>

        <View style={styles.tabRow}>
          {(["available", "mine"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabButton, tab === t && styles.tabButtonActive]}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === "available" ? "Available" : "Mine"}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeQuery.isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : shipments.length === 0 ? (
          <Text style={styles.muted}>{tab === "available" ? "No jobs right now." : "You haven't claimed any jobs yet."}</Text>
        ) : (
          shipments.map((shipment) => (
            <GlassCard key={shipment.id} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <IconTile size="sm">
                  <TruckIcon size={16} />
                </IconTile>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destName}>To {shipment.deliveryLocation}</Text>
                  <Text style={styles.meta}>
                    {shipment.purchaseOrder.currency} {shipment.purchaseOrder.totalAmount.toLocaleString()} · {shipment.status.replaceAll("_", " ")}
                  </Text>
                </View>
              </View>

              {tab === "available" && (
                <Button
                  title="Claim this job"
                  onPress={() => claimMutation.mutate(shipment.id)}
                  isLoading={claimMutation.isPending}
                  style={{ marginTop: 12 }}
                />
              )}
              {tab === "mine" && shipment.status === "ASSIGNED" && (
                <Button
                  title="Mark picked up"
                  onPress={() => statusMutation.mutate({ id: shipment.id, status: "IN_TRANSIT" })}
                  isLoading={statusMutation.isPending}
                  style={{ marginTop: 12 }}
                />
              )}
              {tab === "mine" && shipment.status === "IN_TRANSIT" && (
                <Button
                  title="Mark delivered"
                  onPress={() => statusMutation.mutate({ id: shipment.id, status: "DELIVERED" })}
                  isLoading={statusMutation.isPending}
                  style={{ marginTop: 12 }}
                />
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  back: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.leaf[700], marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", marginBottom: 14 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(15,61,40,0.06)" },
  tabButtonActive: { backgroundColor: colors.leaf[600] },
  tabLabel: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.leaf[900] },
  tabLabelActive: { color: colors.white },
  muted: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  destName: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "80" },
});
