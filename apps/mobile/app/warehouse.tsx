// Warehouse manager companion screen -- view registered warehouses and
// update current utilization. Reuses apiClient.warehouses.listMine()
// and .updateUtilization(), same calls apps/web's WarehousesPage uses.
// Registering a NEW warehouse stays a web-only flow for now (a longer
// form with region/district/address fields is a better fit for a
// bigger screen) -- this covers the day-to-day mobile need of updating
// how full a facility is.
import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, GlassCard, IconTile, Input, WarehouseIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function WarehouseScreen() {
  const queryClient = useQueryClient();
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["warehouses", "mine"],
    queryFn: () => apiClient.warehouses.listMine(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: ({ id, currentUtilization }: { id: string; currentUtilization: number }) =>
      apiClient.warehouses.updateUtilization(id, currentUtilization),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setEditingId(null);
      setValue("");
    },
  });

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </Pressable>
        <Text style={styles.title}>Maghala Yangu</Text>
        <Text style={styles.subtitle}>My Warehouses</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : !warehouses || warehouses.length === 0 ? (
          <Text style={styles.muted}>Hakuna ghala lililosajiliwa. Register one via the AgroFlow web app.</Text>
        ) : (
          warehouses.map((w) => (
            <GlassCard key={w.id} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <IconTile size="sm">
                  <WarehouseIcon size={16} />
                </IconTile>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{w.name}</Text>
                  {w.capacityTonnes && (
                    <Text style={styles.meta}>
                      {(w.currentUtilization ?? 0).toLocaleString()} / {w.capacityTonnes.toLocaleString()} tonnes
                    </Text>
                  )}
                </View>
              </View>

              {editingId === w.id ? (
                <View style={{ marginTop: 12, gap: 10 }}>
                  <Input
                    label="Current utilization (tonnes)"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                  <Button
                    title="Save"
                    isLoading={mutation.isPending}
                    onPress={() => {
                      const n = Number(value);
                      if (Number.isFinite(n) && n >= 0) mutation.mutate({ id: w.id, currentUtilization: n });
                    }}
                  />
                </View>
              ) : (
                <Button
                  title="Update utilization"
                  variant="secondary"
                  onPress={() => {
                    setEditingId(w.id);
                    setValue(String(w.currentUtilization ?? 0));
                  }}
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
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", marginBottom: 18 },
  muted: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "80" },
});
