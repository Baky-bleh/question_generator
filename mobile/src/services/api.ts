import { QueryClient } from "@tanstack/react-query";
import { createApiClient } from "@lingualeap/api-client";
import { getAccessToken, refreshTokens, clearTokens } from "./auth";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken,
  onUnauthorized: async () => {
    try {
      await refreshTokens();
    } catch {
      await clearTokens();
    }
  },
});
