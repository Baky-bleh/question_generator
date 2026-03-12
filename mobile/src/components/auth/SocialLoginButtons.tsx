import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui';
import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

interface SocialLoginButtonsProps {
  onGoogleLogin: (idToken: string) => Promise<void>;
  onAppleLogin: (idToken: string) => Promise<void>;
  loading?: boolean;
}

export function SocialLoginButtons({
  onGoogleLogin,
  onAppleLogin,
  loading = false,
}: SocialLoginButtonsProps) {
  const { colors, spacing } = useTheme();

  const redirectUri = makeRedirectUri({ scheme: 'lingualeap' });

  const [googleRequest, , googlePromptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '',
      redirectUri,
      scopes: ['openid', 'email', 'profile'],
      responseType: 'id_token',
    },
    GOOGLE_DISCOVERY,
  );

  async function handleGoogleLogin() {
    const result = await googlePromptAsync();
    if (result.type === 'success' && result.params.id_token) {
      await onGoogleLogin(result.params.id_token);
    }
  }

  async function handleAppleLogin() {
    // Apple Sign-In is handled natively on iOS via expo-apple-authentication
    // For now, placeholder that shows the button but would need expo-apple-authentication
    // This is a simplified version using auth-session
    // TODO: Integrate expo-apple-authentication for native iOS flow
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Button
        testID="google-login-button"
        variant="outline"
        size="lg"
        onPress={handleGoogleLogin}
        disabled={!googleRequest || loading}
        fullWidth
        leftIcon={<Ionicons name="logo-google" size={20} color={colors.text} />}
      >
        Continue with Google
      </Button>
      {Platform.OS === 'ios' && (
        <Button
          testID="apple-login-button"
          variant="outline"
          size="lg"
          onPress={handleAppleLogin}
          disabled={loading}
          fullWidth
          leftIcon={<Ionicons name="logo-apple" size={20} color={colors.text} />}
        >
          Continue with Apple
        </Button>
      )}
    </View>
  );
}
