// Profile/settings -- account info, sign out, low-data mode toggle
// (Section 9.1). Low-data mode itself (skip images, smaller payloads)
// is wired in once the media/image pipeline exists; the toggle UI ships
// now so the setting has somewhere to live.
import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { ROLE_LABELS } from "@agroflow/config";
import { Button, GlassCard, IconTile, UserIcon } from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { apiClient } from "@/services/apiClient";
import { useSessionStore } from "@/store/session";
import { fonts, colors } from "@/theme";

export default function ProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const refreshToken = await useSessionStore.getState().getStoredRefreshToken();
      if (refreshToken) await apiClient.auth.logout(refreshToken).catch(() => undefined);
    } finally {
      await clearSession();
      setIsSigningOut(false);
      router.replace("/(auth)");
    }
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard strong style={styles.headerCard}>
          <IconTile size="lg">
            <UserIcon size={30} />
          </IconTile>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.phone}>{user?.phoneNumber}</Text>
          <View style={styles.rolesRow}>
            {user?.roles.map((role) => (
              <View key={role} style={styles.rolePill}>
                <Text style={styles.roleText}>{ROLE_LABELS[role]}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 16 }}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Low-data mode</Text>
              <Text style={styles.settingHint}>Reduce data usage on slower connections.</Text>
            </View>
            <Switch
              value={lowDataMode}
              onValueChange={setLowDataMode}
              trackColor={{ true: colors.leaf[500], false: colors.leaf[900] + "30" }}
            />
          </View>
        </GlassCard>

        <View style={{ height: 24 }} />
        <Button title="Sign out" variant="danger" onPress={handleSignOut} isLoading={isSigningOut} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  headerCard: { alignItems: "center", gap: 6 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.leaf[950], marginTop: 8 },
  phone: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99" },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, justifyContent: "center" },
  rolePill: { backgroundColor: colors.leaf[100], borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  roleText: { fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.leaf[700] },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontFamily: fonts.displayMedium, fontSize: 15, color: colors.leaf[950] },
  settingHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.leaf[900] + "80", marginTop: 2 },
});
