// Session state -- current user + tokens. The refresh token is
// persisted to AsyncStorage (survives app restarts); the access token
// lives in memory only, re-minted from the refresh token on launch,
// same pattern as apps/web's AuthContext.
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthenticatedUser } from "@agroflow/types";

const REFRESH_TOKEN_KEY = "agroflow.refreshToken";

interface SessionState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  isHydrating: boolean;
  setSession: (user: AuthenticatedUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
  getStoredRefreshToken: () => Promise<string | null>;
  setHydrating: (value: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  isHydrating: true,

  setSession: async (user, accessToken, refreshToken) => {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ user, accessToken });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ user: null, accessToken: null });
  },

  getStoredRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),

  setHydrating: (value) => set({ isHydrating: value }),
}));
