// Sell Produce -- offline-first. If the device has connectivity, the
// listing is created immediately via the API. If not, it's queued
// locally (src/sync/offlineQueue.ts) and sent automatically the moment
// connectivity returns, so a farmer at the edge of signal never loses
// the listing or has to redo the form.
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { createProduceListingSchema } from "@agroflow/validation";
import { CROPS, UNITS } from "@agroflow/config";
import { Button, GlassCard, IconTile, Input, LeafIcon, Select, type SelectOption } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { enqueueListing } from "@/sync/offlineQueue";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

const cropOptions: SelectOption[] = CROPS.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }));
const unitOptions: SelectOption[] = UNITS.map((u) => ({ value: u, label: u.replaceAll("_", " ").toLowerCase() }));

export default function SellProduceScreen() {
  const { data: farms } = useQuery({ queryKey: ["farms", "mine"], queryFn: () => apiClient.farms.listMine() });
  const farmOptions: SelectOption[] = (farms ?? []).map((f) => ({ value: f.id, label: f.name }));

  const [farmId, setFarmId] = useState("");
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ queued: boolean } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  async function handleSubmit() {
    setFormError(null);
    setConfirmation(null);

    const parsed = createProduceListingSchema.safeParse({
      farmId,
      crop: crop || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      pricePerUnit: pricePerUnit ? Number(pricePerUnit) : undefined,
      availableFrom: new Date().toISOString(),
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        farmId: flat.farmId?.[0] ?? "",
        crop: flat.crop?.[0] ?? "",
        quantity: flat.quantity?.[0] ?? "",
        unit: flat.unit?.[0] ?? "",
      });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isOnline) {
        await apiClient.produceListings.create(parsed.data);
        setConfirmation({ queued: false });
      } else {
        await enqueueListing(parsed.data);
        setConfirmation({ queued: true });
      }
      setQuantity("");
      setPricePerUnit("");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        // Network-level failure even though NetInfo reported online (e.g. a
        // weak/flaky connection) -- fall back to the offline queue rather
        // than losing the farmer's input.
        await enqueueListing(parsed.data);
        setConfirmation({ queued: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <IconTile size="md">
            <LeafIcon size={22} />
          </IconTile>
          <View>
            <Text style={styles.title}>Uza Mazao</Text>
            <Text style={styles.subtitle}>List what you have available for sale.</Text>
          </View>
        </View>

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              You're offline. This listing will be saved and sent automatically once you're back online.
            </Text>
          </View>
        )}

        {confirmation && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              {confirmation.queued
                ? "Saved. It will be sent automatically once you're online."
                : "Listing created."}
            </Text>
          </View>
        )}

        <GlassCard strong style={styles.card}>
          <Select
            label="Farm"
            placeholder={farmOptions.length ? "Select farm" : "Add a farm first"}
            options={farmOptions}
            value={farmId}
            onChange={setFarmId}
            error={fieldErrors.farmId}
          />
          <View style={{ height: 14 }} />
          <Select label="Crop" placeholder="Select crop" options={cropOptions} value={crop} onChange={setCrop} error={fieldErrors.crop} />
          <View style={{ height: 14 }} />
          <Input
            label="Quantity"
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
            error={fieldErrors.quantity}
          />
          <View style={{ height: 14 }} />
          <Select label="Unit" placeholder="Select unit" options={unitOptions} value={unit} onChange={setUnit} error={fieldErrors.unit} />
          <View style={{ height: 14 }} />
          <Input
            label="Price per unit (TZS)"
            keyboardType="decimal-pad"
            value={pricePerUnit}
            onChangeText={setPricePerUnit}
            hint="Optional -- leave blank to negotiate."
          />

          {formError && <Text style={styles.formError}>{formError}</Text>}

          <View style={{ height: 20 }} />
          <Button title={isOnline ? "Save & publish" : "Save (will sync later)"} onPress={handleSubmit} isLoading={isSubmitting} />
          <View style={{ height: 10 }} />
          <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        </GlassCard>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  card: {},
  offlineBanner: {
    backgroundColor: colors.harvest[100],
    borderRadius: 16,
    padding: 12,
  },
  offlineText: { fontFamily: fonts.sans, fontSize: 13, color: colors.harvest[800] },
  successBanner: { backgroundColor: colors.leaf[100], borderRadius: 16, padding: 12 },
  successText: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[800] },
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], marginTop: 8 },
});
