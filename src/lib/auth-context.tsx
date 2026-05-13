import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError, setUnauthorizedHandler } from "./api";
import { bootstrapStore, resetStore } from "./progress-store";

export interface CurrentUser {
  id: number;
  fullName: string;
  nickname: string;
  photoUrl: string | null;
  isAdmin: boolean;
  createdAt: number;
  lastActiveAt: number;
}

interface AuthState {
  status: "loading" | "anon" | "authed";
  user: CurrentUser | null;
}

interface AuthContextValue extends AuthState {
  login: (nickname: string, password: string) => Promise<void>;
  register: (params: {
    invite_code: string;
    nickname: string;
    full_name: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const bootstrap = useCallback(async (user: CurrentUser) => {
    await bootstrapStore();
    setState({ status: "authed", user });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: CurrentUser }>("/api/auth/me");
      await bootstrap(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        resetStore();
        setState({ status: "anon", user: null });
        return;
      }
      throw err;
    }
  }, [bootstrap]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetStore();
      setState({ status: "anon", user: null });
    });
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (nickname: string, password: string) => {
      const { user } = await api.post<{ user: CurrentUser }>("/api/auth/login", {
        nickname,
        password,
      });
      await bootstrap(user);
    },
    [bootstrap],
  );

  const register = useCallback(
    async (params: {
      invite_code: string;
      nickname: string;
      full_name: string;
      password: string;
    }) => {
      const { user } = await api.post<{ user: CurrentUser }>("/api/auth/register", params);
      await bootstrap(user);
    },
    [bootstrap],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      resetStore();
      setState({ status: "anon", user: null });
    }
  }, []);

  const setUser = useCallback((u: CurrentUser) => {
    setState((prev) => ({ status: prev.status === "authed" ? "authed" : prev.status, user: u }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
