import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';

interface StatsCardProps {
  lessonsCompleted: number;
  wordsLearned: number;
  timeSpentMinutes: number;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function StatsCard({ lessonsCompleted, wordsLearned, timeSpentMinutes }: StatsCardProps) {
  const { colors, typography, spacing } = useTheme();

  const stats = [
    { icon: 'book-outline' as const, value: String(lessonsCompleted), label: 'Lessons' },
    { icon: 'chatbubble-outline' as const, value: String(wordsLearned), label: 'Words' },
    { icon: 'time-outline' as const, value: formatTime(timeSpentMinutes), label: 'Time' },
  ];

  return (
    <Card variant="elevated" padding="lg">
      <View style={styles.row}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 && (
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            )}
            <View style={styles.stat}>
              <Ionicons name={stat.icon} size={20} color={colors.primary} />
              <Text
                style={[
                  typography.heading3,
                  { color: colors.text, marginTop: spacing.xs },
                ]}
              >
                {stat.value}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary },
                ]}
              >
                {stat.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 48,
  },
});
