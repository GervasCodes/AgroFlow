// Buyer companion screen -- browse published produce listings. Reuses
// apiClient.produceListings.browse(), the same endpoint apps/web's
// Produce > Browse tab calls. Proposing a match from mobile is a
// follow-up (needs a demand-order picker like apps/web's
// ProposeMatchPage) -- this screen covers browsing/discovery first,
// the higher-value half of the buyer's mobile need.
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GlassCard, IconTile, LeafIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors } from "@/theme";

export default function BrowseProduceScreen() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => apiClient.produceListings.browse(),
  });

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </Pressable>
        <Text style={styles.title}>Bidhaa Zilizopo</Text>
        <Text style={styles.subtitle}>Browse produce</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : !listings || listings.length === 0 ? (
          <Text style={styles.muted}>Hakuna bidhaa kwa sasa. Nothing published yet.</Text>
        ) : (
          listings.map((listing) => (
            <GlassCard key={listing.id} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <IconTile size="sm">
                  <LeafIcon size={16} />
                </IconTile>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>
                    {listing.crop.name.charAt(0) + listing.crop.name.slice(1).toLowerCase()}
                  </Text>
                  <Text style={styles.meta}>
                    {listing.quantity} {listing.unit.toLowerCase()} · {listing.farm.name}
                  </Text>
                  {listing.pricePerUnit && (
                    <Text style={styles.price}>
                      {listing.currency} {listing.pricePerUnit.toLocaleString()} / unit
                    </Text>
                  )}
                </View>
              </View>
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
  cropName: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.leaf[950] },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "80" },
  price: { fontFamily: fonts.mono, fontSize: 13, color: colors.leaf[900] + "99", marginTop: 2 },
});
