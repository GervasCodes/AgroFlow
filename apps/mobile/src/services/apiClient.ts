// Mobile's instance of the shared api-client, wired to the session
// store for token attachment. `API_BASE_URL` reads Expo's app.json
// `extra.apiUrl` so it's configurable per build profile without a
// rebuild (see app.json -> expo.extra.apiUrl).
import Constants from "expo-constants";
import { createApiClient } from "@agroflow/api-client";
import { useSessionStore } from "@/store/session";

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:4000/api/v1";

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => useSessionStore.getState().accessToken,
});

/** Attempts to restore a session from the persisted refresh token.
 * Call once at app launch (see app/_layout.tsx). */
export async function hydrateSession(): Promise<void> {
  const { getStoredRefreshToken, setSession, setHydrating } = useSessionStore.getState();
  try {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) return;
    const result = await apiClient.auth.refresh(refreshToken);
    await setSession(result.user, result.accessToken, result.refreshToken);
  } catch {
    // Expired/invalid refresh token -- fall through to the login screen.
  } finally {
    setHydrating(false);
  }
}
