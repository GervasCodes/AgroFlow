// Session/auth context: holds the current user + tokens, exposes
// login/register/logout, and persists the refresh token so a page
// reload doesn't force a re-login. Access tokens live in memory only
// (never localStorage -- short-lived, re-minted from the refresh token).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createApiClient, type AuthResult, type ApiClient } from "@agroflow/api-client";
import type { AuthenticatedUser } from "@agroflow/types";
import type { RegisterInput, LoginInput } from "@agroflow/validation";
import { API_BASE_URL } from "../config/index";

const REFRESH_TOKEN_STORAGE_KEY = "agroflow.refreshToken";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  client: ApiClient;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo(
    () => createApiClient({ baseUrl: API_BASE_URL, getAccessToken: () => accessToken }),
    [accessToken],
  );

  const applyAuthResult = useCallback((result: AuthResult) => {
    setUser(result.user);
    setAccessToken(result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refreshToken);
  }, []);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    createApiClient({ baseUrl: API_BASE_URL })
      .auth.refresh(storedRefreshToken)
      .then(applyAuthResult)
      .catch(() => localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY))
      .finally(() => setIsLoading(false));
    // Runs once on mount to restore a session from a persisted refresh token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (input: LoginInput) => applyAuthResult(await client.auth.login(input)),
    [client, applyAuthResult],
  );

  const register = useCallback(
    async (input: RegisterInput) => applyAuthResult(await client.auth.register(input)),
    [client, applyAuthResult],
  );

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (storedRefreshToken) {
      await client.auth.logout(storedRefreshToken).catch(() => undefined);
    }
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  }, [client]);

  const value = useMemo(
    () => ({ user, isLoading, client, login, register, logout }),
    [user, isLoading, client, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
