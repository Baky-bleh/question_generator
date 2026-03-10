import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/mascot";

interface QuizIntroProps {
  videoTitle: string;
  exerciseCount: number;
  estimatedMinutes: number;
  onStart: () => void;
  onRewatch: () => void;
}

export function QuizIntro({
  videoTitle,
  exerciseCount,
  estimatedMinutes,
  onStart,
  onRewatch,
}: QuizIntroProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Mascot state="teaching" size="lg" message="Let's test what you learned!" />

        <Text
          style={[
            typography.heading1,
            { color: colors.text, marginTop: spacing.lg, textAlign: "center" },
          ]}
        >
          Quiz
        </Text>

        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" },
          ]}
        >
          Based on: {videoTitle}
        </Text>

        <View style={[styles.statsRow, { marginTop: spacing.lg }]}>
          <View style={styles.statItem}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.xs }]}>
              {exerciseCount} question{exerciseCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.xs }]}>
              ~{estimatedMinutes} min
            </Text>
          </View>
        </View>

        <Text
          style={[
            typography.bodySmall,
            {
              color: colors.textSecondary,
              marginTop: spacing.md,
              textAlign: "center",
            },
          ]}
        >
          No hearts — take your time and answer at your own pace.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" size="lg" fullWidth onPress={onStart}>
          Start Quiz
        </Button>
        <Button variant="outline" size="md" fullWidth onPress={onRewatch}>
          Re-watch Video
        </Button>
      </View>
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
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    gap: 12,
    paddingTop: 16,
  },
});
