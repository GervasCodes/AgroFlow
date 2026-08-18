// Registration -- name, phone, role, region. Mirrors apps/web's
// RegisterPage; no password field here since mobile's primary auth
// path is OTP (the API's `password` field on register is optional).
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { registerSchema } from "@agroflow/validation";
import { ROLES, ROLE_LABELS, REGIONS, type RoleName, type RegionName } from "@agroflow/config";
import { Button, GlassCard, Input, Select, type SelectOption } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { ApiClientError } from "@agroflow/api-client";
import { fonts, colors } from "@/theme";

const roleOptions: SelectOption[] = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const regionOptions: SelectOption[] = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<RoleName | "">("");
  const [regionId, setRegionId] = useState<RegionName | "">("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const parsed = registerSchema.safeParse({
      fullName,
      phoneNumber,
      role: role || undefined,
      regionId: regionId || undefined,
      preferredLanguage: "sw",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: flat.fullName?.[0] ?? "",
        phoneNumber: flat.phoneNumber?.[0] ?? "",
        role: flat.role?.[0] ?? "",
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Tell us who you are so we can set up the right workspace.</Text>

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
          <Select
            label="I am a..."
            placeholder="Select your role"
            options={roleOptions}
            value={role}
            onChange={(v) => setRole(v as RoleName)}
            error={fieldErrors.role}
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
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.leaf[950] },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "99" },
  card: {},
  formError: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600], marginBottom: 8 },
});
