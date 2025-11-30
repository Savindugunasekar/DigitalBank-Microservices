/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "./types";
import { getMyProfile } from "./api"; // <-- make sure this exists

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (data: { user: User; token: string }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;  // <-- Added
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "digital-bank-auth";

function loadInitialAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { user: null, token: null };

  try {
    const parsed = JSON.parse(raw) as AuthState;
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadInitialAuthState());

  const login = (data: { user: User; token: string }) => {
    const next: AuthState = { user: data.user, token: data.token };
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    const next: AuthState = { user: null, token: null };
    setState(next);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  /** 🔥 Refresh user from backend /auth/me */
  const refreshUser = async () => {
    if (!state.token) return;

    try {
      const data = await getMyProfile(state.token); // { user }
      const next: AuthState = { user: data.user, token: state.token };

      setState(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  const value: AuthContextValue = {
    user: state.user,
    token: state.token,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
