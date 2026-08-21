// Storage bookings for one warehouse -- read-only list (creating a
// booking is a Logistics-side action, done from the booking party's
// own flow, not here).
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { GlassCard, IconTile, WarehouseIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function WarehouseBookingsScreen() {
  const { warehouseId } = useLocalSearchParams<{ warehouseId: string }>();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["logistics", "storage-bookings", "warehouse", warehouseId],
    queryFn: () => apiClient.logistics.listWarehouseBookings(warehouseId),
    enabled: Boolean(warehouseId),
  });

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <IconTile size="md">
          <WarehouseIcon size={22} />
        </IconTile>
        <Text style={styles.title}>Storage bookings</Text>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : (
        <FlatList
          data={bookings ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No bookings for this warehouse yet.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.amount}>{item.quantityTonnes.toLocaleString()} tonnes</Text>
              <Text style={styles.meta}>
                From {new Date(item.startDate).toLocaleDateString()} &middot; {item.status}
              </Text>
            </GlassCard>
          )}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.leaf[950] },
  list: { padding: 20, paddingTop: 12, gap: 10, paddingBottom: 100 },
  card: {},
  amount: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", padding: 20 },
});
