// OTP verification -- completes login for an existing account. New
// accounts go through register.tsx first (which also ends in an OTP
// check via the same verify flow, server-side).
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { verifyOtpSchema } from "@agroflow/validation";
import { Button, GlassCard, IconTile, Input, ShieldCheckIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { useSessionStore } from "@/store/session";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

export default function VerifyOtpScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const setSession = useSessionStore((s) => s.setSession);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify() {
    setError(null);
    const parsed = verifyOtpSchema.safeParse({ phoneNumber, code });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.code?.[0] ?? "Enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.auth.verifyOtp(parsed.data);
      await setSession(result.user, result.accessToken, result.refreshToken);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Incorrect code. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <GlassCard strong style={styles.card}>
          <IconTile size="lg">
            <ShieldCheckIcon size={30} />
          </IconTile>
          <View style={{ height: 12 }} />
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to {phoneNumber}.</Text>

          <View style={{ height: 20 }} />
          <Input
            label="Verification code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            error={error ?? undefined}
          />
          <View style={{ height: 16 }} />
          <Button title="Verify" onPress={handleVerify} isLoading={isLoading} />
        </GlassCard>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  card: {},
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "99", marginTop: 4 },
});
