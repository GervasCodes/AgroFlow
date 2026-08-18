// Auth flow: phone entry -> OTP verify -> home. Registration is a
// separate screen off the phone-entry screen for people without an
// account yet. Agent-assisted registration (a Village Agent completing
// this flow on a farmer's behalf) is added in the channels phase.
import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/store/session";

export default function AuthLayout() {
  const user = useSessionStore((s) => s.user);
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
