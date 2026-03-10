import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { queryClient } from "@/services/api";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login: storeLogin, register: storeRegister, oauthLogin: storeOauthLogin, logout: storeLogout } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      await storeLogin(email, password);
    },
    [storeLogin],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await storeRegister(email, password, displayName);
    },
    [storeRegister],
  );

  const oauthLogin = useCallback(
    async (provider: "google" | "apple", idToken: string) => {
      await storeOauthLogin(provider, idToken);
    },
    [storeOauthLogin],
  );

  const logout = useCallback(async () => {
    await storeLogout();
    queryClient.clear();
    router.replace("/(auth)/login");
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    oauthLogin,
    logout,
  };
}
