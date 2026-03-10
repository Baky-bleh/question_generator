export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface OAuthRequest {
  id_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface TokenResponse {
  user_id: string;
  email: string;
  display_name: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export type OAuthProvider = "google" | "apple";

export interface UserProfileResponse {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  daily_goal: number;
  role: string;
  created_at: string;
}

export interface UserUpdateRequest {
  display_name?: string;
  avatar_url?: string | null;
  timezone?: string;
  daily_goal?: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  daily_goal: number;
  role: string;
  created_at: string;
}
