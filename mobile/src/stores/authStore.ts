import { create } from "zustand";
import type { User } from "@lingualeap/types";
import { apiClient } from "@/services/api";
import { setTokens, clearTokens, hasStoredTokens } from "@/services/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  oauthLogin: (provider: "google" | "apple", idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await apiClient.auth.login({ email, password });
    await setTokens(response.access_token, response.refresh_token);
    const profile = await apiClient.users.getMe();
    set({
      user: profile,
      isAuthenticated: true,
    });
  },

  register: async (email, password, displayName) => {
    const response = await apiClient.auth.register({
      email,
      password,
      display_name: displayName,
    });
    await setTokens(response.access_token, response.refresh_token);
    const profile = await apiClient.users.getMe();
    set({
      user: profile,
      isAuthenticated: true,
    });
  },

  oauthLogin: async (provider, idToken) => {
    const response = await apiClient.auth.oauth(provider, { id_token: idToken });
    await setTokens(response.access_token, response.refresh_token);
    const profile = await apiClient.users.getMe();
    set({
      user: profile,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      const { getRefreshToken } = await import("@/services/auth");
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiClient.auth.logout({ refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout API errors
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const hasTokens = await hasStoredTokens();
      if (hasTokens) {
        const profile = await apiClient.users.getMe();
        set({ user: profile, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
