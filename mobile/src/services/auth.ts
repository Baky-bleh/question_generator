const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// In-memory fallback when SecureStore native module isn't available
const mem: Record<string, string> = {};

async function secureGet(key: string): Promise<string | null> {
  try {
    const SecureStore = require("expo-secure-store");
    return await SecureStore.getItemAsync(key);
  } catch {
    return mem[key] ?? null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  } catch {
    mem[key] = value;
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    const SecureStore = require("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  } catch {
    delete mem[key];
  }
}

export async function getAccessToken(): Promise<string | null> {
  return secureGet(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureGet(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await secureSet(ACCESS_TOKEN_KEY, accessToken);
  await secureSet(REFRESH_TOKEN_KEY, refreshToken);
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await secureSet(ACCESS_TOKEN_KEY, accessToken);
}

export async function clearTokens(): Promise<void> {
  await secureDelete(ACCESS_TOKEN_KEY);
  await secureDelete(REFRESH_TOKEN_KEY);
}

export async function refreshTokens(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/v1/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  await setAccessToken(data.access_token);
}

export async function hasStoredTokens(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}
