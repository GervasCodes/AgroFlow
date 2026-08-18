// Root layout -- font loading, splash screen, global providers
// (TanStack Query, session hydration), offline-queue connectivity
// listener. Route groups (auth) and (tabs) each own their own
// _layout.tsx; this file only wraps everything in common.
import { useEffect, useState } from "react";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts as useFraunces,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import { useFonts as useManrope, Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { useFonts as usePlexMono, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { hydrateSession, apiClient } from "@/services/apiClient";
import { subscribeToConnectivity } from "@/sync/offlineQueue";
import { useSessionStore } from "@/store/session";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const [frauncesLoaded] = useFraunces({ Fraunces_500Medium, Fraunces_600SemiBold });
  const [manropeLoaded] = useManrope({ Manrope_500Medium, Manrope_700Bold });
  const [plexMonoLoaded] = usePlexMono({ IBMPlexMono_500Medium });
  const isHydrating = useSessionStore((s) => s.isHydrating);
  const [didHydrate, setDidHydrate] = useState(false);

  useEffect(() => {
    hydrateSession().finally(() => setDidHydrate(true));
    const unsubscribe = subscribeToConnectivity();
    return unsubscribe;
    // apiClient is stable for the app's lifetime; referencing it here just
    // documents that hydrateSession/offlineQueue depend on it being ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient]);

  const fontsReady = frauncesLoaded && manropeLoaded && plexMonoLoaded;
  const ready = fontsReady && didHydrate && !isHydrating;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
