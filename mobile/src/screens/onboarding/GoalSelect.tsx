import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUpdateUserMutation } from '@/hooks/queries/useUser';
import { Mascot } from '@/components/mascot';

interface GoalOption {
  minutes: number;
  label: string;
  description: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { minutes: 5, label: 'Casual', description: '5 min / day' },
  { minutes: 10, label: 'Regular', description: '10 min / day' },
  { minutes: 15, label: 'Serious', description: '15 min / day' },
  { minutes: 20, label: 'Intense', description: '20 min / day' },
];

export default function GoalSelect() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const updateUser = useUpdateUserMutation();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (selected === null) return;
    setLoading(true);
    try {
      await updateUser.mutateAsync({ daily_goal: selected });
      completeOnboarding();
      router.replace('/(tabs)/home');
    } catch {
      // If the API call fails, still complete onboarding locally
      completeOnboarding();
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { padding: spacing.lg }]}>
        <Mascot state="teaching" size="sm" />
        <Text
          style={[
            typography.heading2,
            { color: colors.text, textAlign: 'center', marginTop: spacing.base },
          ]}
        >
          Set your daily goal
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
          ]}
        >
          How much time do you want to spend learning each day?
        </Text>
      </View>

      <View style={[styles.options, { paddingHorizontal: spacing.lg, gap: spacing.md }]}>
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selected === option.minutes;
          return (
            <Card
              key={option.minutes}
              variant="outlined"
              padding="lg"
              onPress={() => setSelected(option.minutes)}
              style={{
                ...styles.goalCard,
                ...(isSelected ? { borderColor: colors.primary, borderWidth: 3 } : {}),
              }}
            >
              <View style={styles.goalContent}>
                <View>
                  <Text
                    style={[
                      typography.heading3,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={{ color: colors.textInverse, fontSize: 14, fontWeight: '700' }}>
                      {'\u2713'}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </View>

      <View style={[styles.footer, { padding: spacing.lg }]}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={selected === null}
          loading={loading}
          fullWidth
        >
          Start Learning
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  options: {
    flex: 1,
    justifyContent: 'center',
  },
  goalCard: {
    width: '100%',
  },
  goalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
  },
});
