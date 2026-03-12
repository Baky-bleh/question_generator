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
import { showToast } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { AuthForm } from '@/components/auth/AuthForm';
import type { AuthFormData } from '@/components/auth/AuthForm';

export default function SignupScreen() {
  const { colors, typography, spacing } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(data: AuthFormData) {
    setLoading(true);
    setError(null);
    try {
      await register(data.email, data.password, data.displayName ?? '');
      router.replace('/(onboarding)/welcome');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView testID="signup-screen" style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Mascot state="waving" size="sm" />
          </View>

          <View style={styles.header}>
            <Text style={[typography.heading1, { color: colors.primary, textAlign: 'center' }]}>
              Create Account
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
            >
              Join LinguaLeap and start your language journey!
            </Text>
          </View>

          {error && (
            <View
              testID="signup-error-banner"
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
            <AuthForm mode="signup" onSubmit={handleSignup} loading={loading} />
          </View>

          <View style={[styles.footer, { marginTop: spacing.xl, paddingBottom: spacing.lg }]}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text testID="signup-login-link" style={StyleSheet.flatten([typography.button, { color: colors.primary }])}>Log In</Text>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
