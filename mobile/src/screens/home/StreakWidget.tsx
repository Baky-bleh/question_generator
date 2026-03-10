import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';

interface StreakWidgetProps {
  current: number;
  todayCompleted: boolean;
}

export function StreakWidget({ current, todayCompleted }: StreakWidgetProps) {
  const { colors, typography, spacing } = useTheme();
  const isAtRisk = !todayCompleted && new Date().getHours() >= 12;

  const glowOpacity = useSharedValue(1);

  useEffect(() => {
    if (isAtRisk) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      glowOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isAtRisk]);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const fireColor = isAtRisk ? colors.streakOrange : current > 0 ? colors.streakOrange : colors.textTertiary;

  return (
    <Card variant="elevated" padding="md">
      <View style={styles.row}>
        <Animated.View style={animatedGlow}>
          <Ionicons name="flame" size={36} color={fireColor} />
        </Animated.View>
        <View style={[styles.textContainer, { marginLeft: spacing.md }]}>
          <Text style={[typography.heading2, { color: colors.text }]}>
            {current}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            day{current !== 1 ? 's' : ''} streak
          </Text>
        </View>
        {isAtRisk && (
          <View style={[styles.warningBadge, { backgroundColor: colors.warningLight }]}>
            <Text style={[typography.caption, { color: colors.warning, fontWeight: '700' }]}>
              At risk!
            </Text>
          </View>
        )}
        {todayCompleted && current > 0 && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  warningBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
