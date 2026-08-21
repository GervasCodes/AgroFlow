// Quality inspection form -- offline-first, same pattern as
// (tabs)/sell.tsx: online, it posts immediately; offline (or on a
// mid-flight network failure), it's queued via enqueueQualityInspection
// and sent automatically once connectivity returns. An aggregator's
// collection run is exactly the "at the edge of signal" scenario this
// queue exists for.
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { createQualityInspectionSchema } from "@agroflow/validation";
import { QUALITY_GRADES } from "@agroflow/config";
import { Button, GlassCard, IconTile, Input, Select, ShieldCheckIcon, type SelectOption } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { enqueueQualityInspection } from "@/sync/offlineQueue";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

const gradeOptions: SelectOption[] = QUALITY_GRADES.map((g) => ({ value: g, label: g.replaceAll("_", " ") }));

export default function InspectListingScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();

  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
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

    const parsed = createQualityInspectionSchema.safeParse({
      produceListingId: listingId,
      grade: grade || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setFieldErrors({ grade: parsed.error.flatten().fieldErrors.grade?.[0] ?? "" });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isOnline) {
        await apiClient.qualityInspections.create(parsed.data);
        setConfirmation({ queued: false });
      } else {
        await enqueueQualityInspection(parsed.data);
        setConfirmation({ queued: true });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        await enqueueQualityInspection(parsed.data);
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
            <ShieldCheckIcon size={22} />
          </IconTile>
          <View>
            <Text style={styles.title}>Kagua Ubora</Text>
            <Text style={styles.subtitle}>Record a quality grade for this listing.</Text>
          </View>
        </View>

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              You're offline. This inspection will be saved and sent automatically once you're back online.
            </Text>
          </View>
        )}

        {confirmation && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              {confirmation.queued ? "Saved. It will be sent automatically once you're online." : "Inspection recorded."}
            </Text>
          </View>
        )}

        <GlassCard strong style={styles.card}>
          <Select label="Grade" placeholder="Select grade" options={gradeOptions} value={grade} onChange={setGrade} error={fieldErrors.grade} />
          <View style={{ height: 14 }} />
          <Input label="Notes" placeholder="Optional" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

          {formError && <Text style={styles.formError}>{formError}</Text>}

          <View style={{ height: 20 }} />
          <Button title={isOnline ? "Save inspection" : "Save (will sync later)"} onPress={handleSubmit} isLoading={isSubmitting} />
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
  offlineBanner: { backgroundColor: colors.harvest[100], borderRadius: 16, padding: 12 },
  offlineText: { fontFamily: fonts.sans, fontSize: 13, color: colors.harvest[800] },
  successBanner: { backgroundColor: colors.leaf[100], borderRadius: 16, padding: 12 },
  successText: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[800] },
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], marginTop: 8 },
});
