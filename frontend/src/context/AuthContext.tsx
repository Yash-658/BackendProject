import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredToken,
  decodeJwtClaims,
  getStoredToken,
  isTokenExpired,
  loginUser,
  setStoredToken,
  setUnauthorizedHandler,
} from "../api";
import type { LoginCredentials } from "../types";

const USERNAME_STORAGE_KEY = "coding_platform_username";

function getStoredUsername(): string | null {
  try {
    return window.localStorage.getItem(USERNAME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredUsername(username: string): void {
  try {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
  } catch {
    // Ignore storage write errors.
  }
}

function clearStoredUsername(): void {
  try {
    window.localStorage.removeItem(USERNAME_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors.
  }
}

function parseUserIdFromToken(token: string | null): number | null {
  if (!token) {
    return null;
  }
  const claims = decodeJwtClaims(token);
  if (!claims?.sub) {
    return null;
  }
  const parsed = Number(claims.sub);
  return Number.isInteger(parsed) ? parsed : null;
}

interface AuthContextValue {
  token: string | null;
  userId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  sessionMessage: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (message?: string) => void;
  clearSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialToken(): string | null {
  const stored = getStoredToken();
  if (!stored) {
    return null;
  }
  if (isTokenExpired(stored)) {
    clearStoredToken();
    clearStoredUsername();
    return null;
  }
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [username, setUsername] = useState<string | null>(() =>
    getInitialToken() ? getStoredUsername() : null
  );
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const logout = useCallback((message?: string) => {
    clearStoredToken();
    clearStoredUsername();
    setToken(null);
    setUsername(null);
    setSessionMessage(message ?? null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout("Your session has expired or is invalid. Please sign in again.");
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const data = await loginUser(credentials);
    setStoredToken(data.access_token);
    setStoredUsername(credentials.username);
    setToken(data.access_token);
    setUsername(credentials.username);
    setSessionMessage(null);
  }, []);

  const clearSessionMessage = useCallback(() => {
    setSessionMessage(null);
  }, []);

  const userId = useMemo(() => parseUserIdFromToken(token), [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      username,
      isAuthenticated: Boolean(token),
      sessionMessage,
      login,
      logout,
      clearSessionMessage,
    }),
    [token, userId, username, sessionMessage, login, logout, clearSessionMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
