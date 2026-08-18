// Phone entry -- the first screen most farmers see. Kiswahili-first
// copy (Section 9.1); requesting an OTP is the default path since many
// field-role users won't have set a password.
import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { requestOtpSchema } from "@agroflow/validation";
import { Button, GlassCard, IconTile, Input, LeafIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

export default function PhoneEntryScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleContinue() {
    setError(null);
    const parsed = requestOtpSchema.safeParse({ phoneNumber });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.phoneNumber?.[0] ?? "Enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.auth.requestOtp(parsed.data);
      router.push({ pathname: "/(auth)/verify", params: { phoneNumber: parsed.data.phoneNumber } });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <IconTile size="sm">
            <LeafIcon size={16} />
          </IconTile>
          <Text style={styles.brandText}>AgroFlow</Text>
        </View>

        <GlassCard strong style={styles.card}>
          <Text style={styles.eyebrow}>Karibu</Text>
          <Text style={styles.title}>Ingia na nambari yako ya simu</Text>
          <Text style={styles.subtitle}>Enter your phone number and we'll send you a code.</Text>

          <View style={{ height: 20 }} />
          <Input
            label="Phone number"
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={error ?? undefined}
          />
          <View style={{ height: 16 }} />
          <Button title="Endelea / Continue" onPress={handleContinue} isLoading={isLoading} />
        </GlassCard>

        <Text onPress={() => router.push("/(auth)/register")} style={styles.link}>
          New to AgroFlow? Create an account
        </Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 24 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: { fontFamily: fonts.display, fontSize: 18, color: colors.leaf[900] },
  card: { gap: 4 },
  eyebrow: { fontFamily: fonts.sansSemibold, fontSize: 12, letterSpacing: 1.5, color: colors.harvest[700] },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "99" },
  link: { textAlign: "center", fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.leaf[700] },
});
