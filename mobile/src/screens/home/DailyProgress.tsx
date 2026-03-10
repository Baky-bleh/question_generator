import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card, Badge } from '@/components/ui';
import { useUserProfileQuery } from '@/hooks/queries/useUser';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 100;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DailyProgressProps {
  xpEarned: number;
  goalMet: boolean;
  lessonsCompleted: number;
}

export function DailyProgress({ xpEarned, goalMet, lessonsCompleted }: DailyProgressProps) {
  const { colors, typography, spacing } = useTheme();
  const userQuery = useUserProfileQuery();
  const dailyGoalMinutes = userQuery.data?.daily_goal ?? 10;

  // Use lessons as a proxy for progress toward daily goal
  // daily_goal is in minutes, approximate 1 lesson = 5 min
  const estimatedMinutes = lessonsCompleted * 5;
  const progress = Math.min(1, estimatedMinutes / dailyGoalMinutes);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    <Card variant="elevated" padding="lg">
      <View style={styles.row}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.borderLight}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={goalMet ? colors.success : colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <Text style={[typography.heading3, { color: colors.text }]}>
              {xpEarned}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              XP
            </Text>
          </View>
        </View>

        <View style={[styles.details, { marginLeft: spacing.lg }]}>
          <Text style={[typography.heading3, { color: colors.text }]}>
            Daily Progress
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {lessonsCompleted} lesson{lessonsCompleted !== 1 ? 's' : ''} today
          </Text>
          {goalMet && (
            <View style={{ marginTop: spacing.sm }}>
              <Badge variant="status" value="Goal met!" size="sm" />
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
});
