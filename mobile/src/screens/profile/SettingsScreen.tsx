import React from 'react';
import { View, Text, Switch, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUpdateUserMutation } from '@/hooks/queries/useUser';
import { useAuth } from '@/hooks/useAuth';

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20];

export function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const { logout } = useAuth();
  const updateUser = useUpdateUserMutation();

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const toggleHaptic = useSettingsStore((s) => s.toggleHaptic);

  const [selectedGoal, setSelectedGoal] = React.useState(10);

  const handleGoalChange = (goal: number) => {
    setSelectedGoal(goal);
    updateUser.mutate({ daily_goal: goal });
  };

  const themeOptions: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <SafeAreaView testID="settings-screen" style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
      >
        <Text style={[typography.heading2, { color: colors.text, marginBottom: spacing.lg }]}>
          Settings
        </Text>

        {/* Theme */}
        <Card variant="elevated" padding="md" style={{ marginBottom: spacing.base }}>
          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>
            Theme
          </Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <View
                key={opt.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      theme === opt.value ? colors.primary : colors.surface,
                    borderColor:
                      theme === opt.value ? colors.primary : colors.border,
                  },
                ]}
                onTouchEnd={() => setTheme(opt.value)}
              >
                <Text
                  style={[
                    typography.buttonSmall,
                    {
                      color:
                        theme === opt.value ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Notifications */}
        <Card variant="elevated" padding="md" style={{ marginBottom: spacing.base }}>
          <SettingRow
            label="Notifications"
            value={notificationsEnabled}
            onToggle={toggleNotifications}
            colors={colors}
            typography={typography}
          />
        </Card>

        {/* Daily Goal */}
        <Card variant="elevated" padding="md" style={{ marginBottom: spacing.base }}>
          <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>
            Daily Goal
          </Text>
          <View style={styles.goalRow}>
            {DAILY_GOAL_OPTIONS.map((goal) => (
              <View
                key={goal}
                style={[
                  styles.goalOption,
                  {
                    backgroundColor:
                      selectedGoal === goal ? colors.primary : colors.surface,
                    borderColor:
                      selectedGoal === goal ? colors.primary : colors.border,
                  },
                ]}
                onTouchEnd={() => handleGoalChange(goal)}
              >
                <Text
                  style={[
                    typography.button,
                    {
                      color:
                        selectedGoal === goal
                          ? colors.textInverse
                          : colors.text,
                    },
                  ]}
                >
                  {goal}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color:
                        selectedGoal === goal
                          ? colors.textInverse
                          : colors.textSecondary,
                    },
                  ]}
                >
                  min
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Sound & Haptic */}
        <Card variant="elevated" padding="md" style={{ marginBottom: spacing.base }}>
          <SettingRow
            label="Sound"
            value={soundEnabled}
            onToggle={toggleSound}
            colors={colors}
            typography={typography}
          />
          <View style={[styles.separator, { backgroundColor: colors.borderLight, marginVertical: spacing.md }]} />
          <SettingRow
            label="Haptic Feedback"
            value={hapticEnabled}
            onToggle={toggleHaptic}
            colors={colors}
            typography={typography}
          />
        </Card>

        {/* Sign Out */}
        <View style={{ marginTop: spacing.lg }}>
          <Button variant="outline" fullWidth onPress={logout}>
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}

function SettingRow({ label, value, onToggle, colors, typography }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.disabled, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    height: 1,
  },
});
