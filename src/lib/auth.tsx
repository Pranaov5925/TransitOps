import * as React from "react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "./api/config";
import type { Role, User } from "./api/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  React.useEffect(() => {
    try {
      const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
      const u = window.localStorage.getItem(AUTH_USER_KEY);
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u) as User);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = React.useCallback((t: string, u: User) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, t);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ user, token, isAuthenticated: !!token, login, logout }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};
