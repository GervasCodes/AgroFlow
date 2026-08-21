// Buyer home -- three sections: matches awaiting your approval, browse
// produce, and your purchase orders' status. Full demand-order creation
// stays on web (this is a companion view, per this folder's original
// scaffold comment) -- approving/rejecting a match is the one write
// action here, and it's online-only by design (see offlineQueue.ts's
// header comment for why).
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Button, GlassCard, HandshakeIcon, IconTile, LeafIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

type Tab = "matches" | "browse" | "orders";

export default function BuyerHomeScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("matches");
  const [actionError, setActionError] = useState<string | null>(null);

  const matchesQuery = useQuery({
    queryKey: ["matches", "as-buyer"],
    queryFn: () => apiClient.matches.listAsBuyer(),
    enabled: tab === "matches",
  });
  const browseQuery = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => apiClient.produceListings.browse(),
    enabled: tab === "browse",
  });
  const ordersQuery = useQuery({
    queryKey: ["purchase-orders", "as-buyer"],
    queryFn: () => apiClient.purchaseOrders.listAsBuyer(),
    enabled: tab === "orders",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.matches.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Could not approve match."),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.matches.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Could not reject match."),
  });

  const pendingMatches = (matchesQuery.data ?? []).filter((m) => m.status === "PROPOSED");

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <IconTile size="md">
          <HandshakeIcon size={22} />
        </IconTile>
        <View>
          <Text style={styles.title}>Bidhaa Zilizopo</Text>
          <Text style={styles.subtitle}>Matches, produce, and your orders.</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["matches", "browse", "orders"] as Tab[]).map((t) => (
          <Text
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            {t === "matches" ? "Matches" : t === "browse" ? "Browse" : "Orders"}
          </Text>
        ))}
      </View>

      {actionError && <Text style={styles.formError}>{actionError}</Text>}

      {tab === "matches" && (
        <FlatList
          data={pendingMatches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No matches awaiting your approval.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.cropName}>
                {item.produceListing.crop.name.charAt(0) + item.produceListing.crop.name.slice(1).toLowerCase()}
              </Text>
              <Text style={styles.meta}>
                {item.matchedQuantity} {item.produceListing.unit.replaceAll("_", " ")} from {item.produceListing.farm.name}
              </Text>
              <View style={styles.row}>
                <Button
                  title="Approve"
                  onPress={() => approveMutation.mutate(item.id)}
                  isLoading={approveMutation.isPending && approveMutation.variables === item.id}
                  style={{ flex: 1 }}
                />
                <View style={{ width: 10 }} />
                <Button
                  title="Reject"
                  variant="secondary"
                  onPress={() => rejectMutation.mutate(item.id)}
                  isLoading={rejectMutation.isPending && rejectMutation.variables === item.id}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          )}
        />
      )}

      {tab === "browse" && (
        <FlatList
          data={browseQuery.data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No published listings right now.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <IconTile size="sm">
                  <LeafIcon size={16} />
                </IconTile>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>{item.crop.name.charAt(0) + item.crop.name.slice(1).toLowerCase()}</Text>
                  <Text style={styles.meta}>
                    {item.quantity} {item.unit.replaceAll("_", " ")} &middot; {item.farm.name}
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}
        />
      )}

      {tab === "orders" && (
        <FlatList
          data={ordersQuery.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No purchase orders yet.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.cropName}>
                {item.totalAmount.toLocaleString()} {item.currency}
              </Text>
              <Text style={styles.meta}>{item.status.replaceAll("_", " ")}</Text>
            </GlassCard>
          )}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", maxWidth: 260 },
  tabs: { flexDirection: "row", gap: 16, paddingHorizontal: 20, marginBottom: 8 },
  tab: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.leaf[900] + "60", paddingVertical: 6 },
  tabActive: { color: colors.leaf[800], borderBottomWidth: 2, borderBottomColor: colors.leaf[700] },
  list: { padding: 20, paddingTop: 8, gap: 10, paddingBottom: 100 },
  card: {},
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  cropName: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", padding: 20 },
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], paddingHorizontal: 20, marginBottom: 8 },
});
