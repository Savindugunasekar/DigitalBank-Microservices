import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "./types";
import { login as apiLogin } from "./api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_KEY = "admin-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch (err) {
      console.error("Failed to load admin auth from storage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  function saveAuth(nextUser: User | null, nextToken: string | null) {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      window.localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify({ user: nextUser, token: nextToken })
      );
    } else {
      window.localStorage.removeItem(LOCAL_KEY);
    }
  }

  async function handleLogin(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(email, password);

      if (
        data.user.role !== "ADMIN" &&
        data.user.role !== "RISK_OFFICER"
      ) {
        setError("Access denied. Admin or Risk Officer role required.");
        saveAuth(null, null);
        return;
      }

      saveAuth(data.user, data.token);
    } catch (err: any) {
      console.error("Admin login failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to login as admin.";
      setError(msg);
      saveAuth(null, null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    saveAuth(null, null);
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    error,
    login: handleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
