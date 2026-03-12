import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settingsStore';
import { showToast } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { AuthForm } from '@/components/auth/AuthForm';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import type { AuthFormData } from '@/components/auth/AuthForm';

export default function LoginScreen() {
  const { colors, typography, spacing } = useTheme();
  const { login, oauthLogin } = useAuth();
  const router = useRouter();
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function navigateAfterAuth() {
    if (!hasCompletedOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else {
      router.replace('/(tabs)/home');
    }
  }

  async function handleLogin(data: AuthFormData) {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigateAfterAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(idToken: string) {
    setLoading(true);
    setError(null);
    try {
      await oauthLogin('google', idToken);
      navigateAfterAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin(idToken: string) {
    setLoading(true);
    setError(null);
    try {
      await oauthLogin('apple', idToken);
      navigateAfterAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apple login failed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView testID="login-screen" style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight ?? 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
        >
          <View style={styles.mascotContainer}>
            <Mascot testID="login-mascot" state="waving" size="sm" />
          </View>

          <View style={styles.header}>
            <Text style={[typography.heading1, { color: colors.primary, textAlign: 'center' }]}>
              LinguaLeap
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
            >
              Welcome back! Log in to continue learning.
            </Text>
          </View>

          {error && (
            <View
              testID="login-error-banner"
              style={[
                styles.errorBanner,
                { backgroundColor: colors.errorLight, marginTop: spacing.base },
              ]}
            >
              <Text style={[typography.bodySmall, { color: colors.error, textAlign: 'center' }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <AuthForm mode="login" onSubmit={handleLogin} loading={loading} />
          </View>

          <View style={[styles.divider, { marginVertical: spacing.lg }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[typography.caption, { color: colors.textTertiary, marginHorizontal: spacing.md }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <SocialLoginButtons
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
            loading={loading}
          />

          <View style={[styles.footer, { marginTop: spacing.xl, paddingBottom: spacing.lg }]}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {"Don't have an account? "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Text testID="login-signup-link" style={StyleSheet.flatten([typography.button, { color: colors.primary }])}>Sign Up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
