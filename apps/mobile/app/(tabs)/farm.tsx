// My Farm -- list the farmer's registered farms, add a new one.
// Mirrors apps/web's Farms feature, adapted for mobile forms/nav.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createFarmSchema } from "@agroflow/validation";
import { REGIONS } from "@agroflow/config";
import { Button, FarmIcon, GlassCard, IconTile, Input, Select, type SelectOption } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

const regionOptions: SelectOption[] = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export default function MyFarmScreen() {
  const queryClient = useQueryClient();
  const { data: farms, isLoading } = useQuery({
    queryKey: ["farms", "mine"],
    queryFn: () => apiClient.farms.listMine(),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [village, setVillage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: apiClient.farms.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms", "mine"] });
      setShowForm(false);
      setName("");
      setVillage("");
      setRegionId("");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save farm."),
  });

  function handleSubmit() {
    setFormError(null);
    const parsed = createFarmSchema.safeParse({ name, regionId: regionId || undefined, village: village || undefined });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name?.[0] ?? "", regionId: flat.regionId?.[0] ?? "" });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Shamba Langu</Text>
        <Text style={styles.subtitle}>My Farm</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : farms && farms.length > 0 ? (
          farms.map((farm) => (
            <GlassCard key={farm.id} style={{ marginBottom: 12 }}>
              <View style={styles.farmRow}>
                <IconTile size="sm">
                  <FarmIcon size={16} />
                </IconTile>
                <View>
                  <Text style={styles.farmName}>{farm.name}</Text>
                  <Text style={styles.farmMeta}>
                    {[farm.village, farm.regionId.replaceAll("_", " ")].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))
        ) : (
          <Text style={styles.muted}>No farms yet -- add one below.</Text>
        )}

        {showForm ? (
          <GlassCard strong style={{ marginTop: 8 }}>
            <Input label="Farm name" value={name} onChangeText={setName} error={fieldErrors.name} />
            <View style={{ height: 14 }} />
            <Select label="Region" placeholder="Select region" options={regionOptions} value={regionId} onChange={setRegionId} error={fieldErrors.regionId} />
            <View style={{ height: 14 }} />
            <Input label="Village" value={village} onChangeText={setVillage} />
            {formError && <Text style={styles.formError}>{formError}</Text>}
            <View style={{ height: 18 }} />
            <Button title="Save farm" onPress={handleSubmit} isLoading={mutation.isPending} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
          </GlassCard>
        ) : (
          <Pressable onPress={() => setShowForm(true)} style={{ marginTop: 8 }}>
            <Button title="+ Add farm" variant="secondary" onPress={() => setShowForm(true)} />
          </Pressable>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", marginBottom: 18 },
  muted: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "80", marginBottom: 16 },
  farmRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  farmName: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.leaf[950] },
  farmMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "80" },
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], marginTop: 8 },
});
