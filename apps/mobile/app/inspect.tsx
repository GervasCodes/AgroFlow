// Aggregator companion screen -- browse published listings and record
// a quality inspection against one. Reuses apiClient.produceListings.
// browse() and apiClient.qualityInspections.create(), the same calls
// apps/web's Produce > Browse + InspectListingPage use. Recording an
// inspection also updates the listing's own qualityGrade server-side
// (see apps/api's services/quality) -- nothing extra to do here.
import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { QUALITY_GRADES } from "@agroflow/config";
import { Button, GlassCard, IconTile, LeafIcon, ShieldCheckIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { fonts, colors, radii } from "@/theme";

export default function InspectScreen() {
  const queryClient = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => apiClient.produceListings.browse(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: apiClient.qualityInspections.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produce-listings"] });
      setSelectedId(null);
      setGrade(null);
    },
  });

  function submit() {
    if (!selectedId || !grade) return;
    mutation.mutate({ produceListingId: selectedId, grade: grade as never });
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </Pressable>
        <Text style={styles.title}>Kagua Ubora</Text>
        <Text style={styles.subtitle}>Record a quality inspection</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : !listings || listings.length === 0 ? (
          <Text style={styles.muted}>Hakuna bidhaa kwa sasa.</Text>
        ) : (
          listings.map((listing) => {
            const selected = selectedId === listing.id;
            return (
              <Pressable key={listing.id} onPress={() => setSelectedId(listing.id)}>
                <GlassCard style={{ marginBottom: 12, borderWidth: selected ? 2 : 0, borderColor: colors.leaf[500] } as never}>
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
                    </View>
                  </View>

                  {selected && (
                    <View style={styles.gradeRow}>
                      {QUALITY_GRADES.map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => setGrade(g)}
                          style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
                        >
                          <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>
                            {g.replaceAll("_", " ")}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </Pressable>
            );
          })
        )}

        {selectedId && grade && (
          <Button title="Save inspection" onPress={submit} isLoading={mutation.isPending} />
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
  gradeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  gradeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: "rgba(15,61,40,0.06)" },
  gradeChipActive: { backgroundColor: colors.leaf[600] },
  gradeText: { fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.leaf[900] },
  gradeTextActive: { color: colors.white },
});
