import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import type { LessonCompleteResponse } from "@lingualeap/types";

interface LessonResultsProps {
  completionResult: LessonCompleteResponse | null;
  totalExercises: number;
  correctCount: number;
  elapsedTime: number;
  onContinue: () => void;
}

export function LessonResults({
  completionResult,
  totalExercises,
  correctCount,
  elapsedTime,
  onContinue,
}: LessonResultsProps) {
  const { colors, typography, spacing } = useTheme();

  const isPerfect = correctCount === totalExercises;
  const mascotState = isPerfect ? "celebrating" : "encouraging";
  const mascotMessage = isPerfect ? "Perfect score! Amazing!" : "Good effort! Keep it up!";

  const xpEarned = completionResult?.xp_earned ?? 0;
  const breakdown = completionResult?.xp_breakdown;
  const streak = completionResult?.streak;

  // Animated XP counter
  const xpDisplay = useSharedValue(0);
  const xpScale = useSharedValue(1);

  useEffect(() => {
    xpDisplay.value = withTiming(xpEarned, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
    xpScale.value = withDelay(
      1500,
      withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      ),
    );
  }, [xpEarned]);

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Mascot state={mascotState} size="lg" message={mascotMessage} />

        <Animated.View entering={FadeInUp.delay(300)} style={styles.xpSection}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>XP Earned</Text>
          <Animated.View style={xpAnimatedStyle}>
            <Text style={[typography.heading1, { color: colors.xpGold }]}>
              +{xpEarned}
            </Text>
          </Animated.View>
        </Animated.View>

        {breakdown && (
          <Animated.View entering={FadeInUp.delay(500)} style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BreakdownRow label="Base XP" value={breakdown.base} />
            {breakdown.perfect_bonus > 0 && (
              <BreakdownRow label="Perfect bonus" value={breakdown.perfect_bonus} icon="star" />
            )}
            {breakdown.streak_bonus > 0 && (
              <BreakdownRow label="Streak bonus" value={breakdown.streak_bonus} icon="flame" />
            )}
            {breakdown.speed_bonus > 0 && (
              <BreakdownRow label="Speed bonus" value={breakdown.speed_bonus} icon="flash" />
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(700)} style={styles.statsRow}>
          <StatPill icon="checkmark-circle" label={`${correctCount}/${totalExercises}`} color={colors.success} />
          <StatPill icon="time-outline" label={`${minutes}:${seconds.toString().padStart(2, "0")}`} color={colors.info} />
          {streak && (
            <StatPill
              icon="flame"
              label={`${streak.current} day${streak.current !== 1 ? "s" : ""}`}
              color={colors.streakOrange}
            />
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" size="lg" fullWidth onPress={onContinue}>
          Continue
        </Button>
      </View>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: string;
}) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={breakdownStyles.row}>
      <View style={breakdownStyles.labelRow}>
        {icon && (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={colors.textSecondary}
            style={{ marginRight: 4 }}
          />
        )}
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[typography.body, { color: colors.xpGold, fontWeight: "600" }]}>
        +{value}
      </Text>
    </View>
  );
}

function StatPill({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  const { typography, colors } = useTheme();

  return (
    <View style={statStyles.pill}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={color} />
      <Text style={[typography.bodySmall, { color: colors.text, marginLeft: 4, fontWeight: "600" }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  xpSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  breakdownCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  footer: {
    paddingTop: 16,
  },
});

const breakdownStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

const statStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});
