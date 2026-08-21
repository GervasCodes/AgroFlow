// Aggregator home -- "collection run" list of published produce
// listings to visit and inspect. Tapping one opens the inspection form
// (./inspect/[listingId]). Read-only browsing; no offline queue needed
// here since it's a GET, not a write -- see that screen for the
// offline-queued write.
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { GlassCard, IconTile, LeafIcon, ShieldCheckIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function AggregatorHomeScreen() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => apiClient.produceListings.browse(),
  });

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <IconTile size="md">
          <ShieldCheckIcon size={22} />
        </IconTile>
        <View>
          <Text style={styles.title}>Kagua Ubora</Text>
          <Text style={styles.subtitle}>Published listings you can inspect on your collection run.</Text>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : (
        <FlatList
          data={listings ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No published listings right now.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/aggregator/inspect/${item.id}`)}>
              <GlassCard style={styles.card}>
                <View style={styles.row}>
                  <IconTile size="sm">
                    <LeafIcon size={16} />
                  </IconTile>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cropName}>
                      {item.crop.name.charAt(0) + item.crop.name.slice(1).toLowerCase()}
                    </Text>
                    <Text style={styles.meta}>
                      {item.quantity} {item.unit.replaceAll("_", " ")} &middot; {item.farm.name}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
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
  list: { padding: 20, paddingTop: 12, gap: 10, paddingBottom: 100 },
  card: {},
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  cropName: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", padding: 20 },
});
