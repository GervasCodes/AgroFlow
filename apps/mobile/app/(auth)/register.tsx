// Registration -- name, phone, region. Role is no longer chosen at
// signup (security hardening, Phase 1): every new account starts with
// zero roles, and a role is requested afterwards from inside the app.
// No password field here since mobile's primary auth path is OTP (the
// API's `password` field on register is optional).
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { registerSchema } from "@agroflow/validation";
import { REGIONS, type RegionName } from "@agroflow/config";
import { Button, GlassCard, IconTile, Input, Select, type SelectOption } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

const regionOptions: SelectOption[] = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [regionId, setRegionId] = useState<RegionName | "">("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const parsed = registerSchema.safeParse({
      fullName,
      phoneNumber,
      email: email || undefined,
      regionId: regionId || undefined,
      preferredLanguage: "sw",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: flat.fullName?.[0] ?? "",
        phoneNumber: flat.phoneNumber?.[0] ?? "",
        email: flat.email?.[0] ?? "",
        regionId: flat.regionId?.[0] ?? "",
      });
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      await apiClient.auth.register(parsed.data);
      // Registration issues tokens directly, but mobile's primary path
      // still verifies via OTP for a consistent, phishable-resistant
      // login pattern -- send them to verify to complete the loop.
      await apiClient.auth.requestOtp({ phoneNumber: parsed.data.phoneNumber });
      router.push({ pathname: "/(auth)/verify", params: { phoneNumber: parsed.data.phoneNumber } });
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <IconTile size="sm">
            <Image source={require("../../assets/brand-mark.png")} style={styles.brandMark} resizeMode="contain" />
          </IconTile>
          <Text style={styles.brandText}>AgroFlow</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          We'll set up your workspace -- you can request your role once you're in.
        </Text>

        <GlassCard strong style={styles.card}>
          <Input
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            error={fieldErrors.fullName}
          />
          <View style={{ height: 14 }} />
          <Input
            label="Phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={fieldErrors.phoneNumber}
          />
          <View style={{ height: 14 }} />
          <Input
            label="Email (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
          />
          <View style={{ height: 14 }} />
          <Select
            label="Region"
            placeholder="Select your region"
            options={regionOptions}
            value={regionId}
            onChange={(v) => setRegionId(v as RegionName)}
            error={fieldErrors.regionId}
          />
          <View style={{ height: 20 }} />
          {formError && <Text style={styles.formError}>{formError}</Text>}
          <Button title="Create account" onPress={handleSubmit} isLoading={isLoading} />
        </GlassCard>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 48 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 16, height: 16 },
  brandText: { fontFamily: fonts.display, fontSize: 18, color: colors.leaf[900] },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "99" },
  card: {},
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], marginBottom: 8 },
});
