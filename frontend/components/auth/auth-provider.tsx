"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { AuthState, User } from "@/types";

interface AuthContextValue extends AuthState {
  setAuthenticatedUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest<User>("/auth/me", { cache: "no-store" });
      const authenticatedUser = response.data ?? null;
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        return null;
      }
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setAuthenticatedUser = useCallback((authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<never>("/auth/logout", { method: "POST" });
    setUser(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setAuthenticatedUser,
      refreshUser,
      logout,
    }),
    [isLoading, logout, refreshUser, setAuthenticatedUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
