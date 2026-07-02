import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capsFromPermissions, type Capabilities } from "@datacon/shared-types";
import { api } from "../api/client";
import type { CurrentUser } from "../lib/types";

interface AuthContextValue {
  user: CurrentUser | undefined;
  caps: Capabilities;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  quickLogin: (personaId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_CAPS = capsFromPermissions([]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<CurrentUser>("/auth/me");
      return res.data;
    },
    retry: false,
    staleTime: 60_000,
  });

  // React Query keeps the last-known-good `data` around even after a
  // background refetch errors (e.g. post-logout 401) — so authentication
  // must be derived from `status`, not from `data` truthiness.
  const currentUser = meQuery.status === "success" ? meQuery.data : undefined;

  const afterAuthChange = () => qc.invalidateQueries({ queryKey: ["me"] });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await api.post("/auth/login", { email, password });
    },
    onSuccess: afterAuthChange,
  });

  const registerMutation = useMutation({
    mutationFn: async (vars: { name: string; email: string; password: string }) => {
      await api.post("/auth/register", vars);
    },
    onSuccess: afterAuthChange,
  });

  const quickLoginMutation = useMutation({
    mutationFn: async (personaId: string) => {
      await api.post("/auth/quick-login", { personaId });
    },
    onSuccess: afterAuthChange,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: afterAuthChange,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUser,
      caps: currentUser ? capsFromPermissions(currentUser.permissions) : EMPTY_CAPS,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!currentUser,
      login: async (email, password) => {
        await loginMutation.mutateAsync({ email, password });
      },
      register: async (name, email, password) => {
        await registerMutation.mutateAsync({ name, email, password });
      },
      quickLogin: async (personaId) => {
        await quickLoginMutation.mutateAsync(personaId);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [currentUser, meQuery.isLoading, loginMutation, registerMutation, quickLoginMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
