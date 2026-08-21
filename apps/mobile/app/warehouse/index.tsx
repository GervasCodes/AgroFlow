// Warehouse Manager home -- "My Warehouses": the warehouses you own,
// with inline utilization updates and a link into each one's storage
// bookings. Online-only, same reasoning as the Buyer screen -- see
// offlineQueue.ts's header comment.
import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Button, GlassCard, IconTile, Input, WarehouseIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function WarehouseHomeScreen() {
  const queryClient = useQueryClient();
  const { data: warehouses, isLoading } = useQuery({ queryKey: ["warehouses", "mine"], queryFn: () => apiClient.warehouses.listMine() });

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const utilizationMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => apiClient.warehouses.updateUtilization(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <IconTile size="md">
          <WarehouseIcon size={22} />
        </IconTile>
        <View>
          <Text style={styles.title}>Maghala Yangu</Text>
          <Text style={styles.subtitle}>Your warehouses and their bookings.</Text>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : (
        <FlatList
          data={warehouses ?? []}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No warehouses registered yet.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.regionId.replaceAll("_", " ")}
                {item.capacityTonnes ? ` \u00b7 ${item.capacityTonnes} t capacity` : ""}
              </Text>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Current utilization (t)"
                    keyboardType="decimal-pad"
                    defaultValue={item.currentUtilization ? String(item.currentUtilization) : ""}
                    onChangeText={(v) => setDrafts((prev) => ({ ...prev, [item.id]: v }))}
                  />
                </View>
                <View style={{ width: 10 }} />
                <Button
                  title="Save"
                  onPress={() => {
                    const next = Number(drafts[item.id]);
                    if (Number.isFinite(next) && next >= 0) {
                      utilizationMutation.mutate({ id: item.id, value: next });
                    }
                  }}
                  isLoading={utilizationMutation.isPending && utilizationMutation.variables?.id === item.id}
                />
              </View>

              <View style={{ height: 10 }} />
              <Button title="View bookings" variant="secondary" onPress={() => router.push(`/warehouse/${item.id}`)} />
            </GlassCard>
          )}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", maxWidth: 260 },
  list: { padding: 20, paddingTop: 12, gap: 12, paddingBottom: 100 },
  card: {},
  name: { fontFamily: fonts.sansSemibold, fontSize: 17, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", padding: 20 },
});
