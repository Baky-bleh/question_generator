import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button } from '@/components/ui';
import { Mascot } from '@/components/mascot';

export default function Welcome() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView testID="onboarding-welcome-screen" style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.mascotSection}>
          <Mascot testID="onboarding-mascot" state="celebrating" size="lg" />
        </View>

        <View style={styles.textSection}>
          <Text style={[typography.heading1, { color: colors.primary, textAlign: 'center' }]}>
            LinguaLeap
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: spacing.md,
                paddingHorizontal: spacing.xl,
              },
            ]}
          >
            Learn a new language in just a few minutes a day. Fun, effective, and 100% free to start!
          </Text>
        </View>

        <View style={[styles.buttonSection, { paddingHorizontal: spacing.lg }]}>
          <Button
            testID="onboarding-get-started-button"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(onboarding)/language')}
            fullWidth
          >
            Get Started
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotSection: {
    flex: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
});
