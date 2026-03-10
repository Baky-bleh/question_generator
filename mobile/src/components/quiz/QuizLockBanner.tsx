import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { ProgressBar } from "@/components/ui";
import { Mascot } from "@/components/mascot";

interface QuizLockBannerProps {
  watchPercent: number;
  thresholdPercent: number;
}

export function QuizLockBanner({ watchPercent, thresholdPercent }: QuizLockBannerProps) {
  const { colors, typography, spacing } = useTheme();

  const progressFraction = thresholdPercent > 0 ? watchPercent / thresholdPercent : 0;

  return (
    <View style={styles.container}>
      <Mascot state="thinking" size="md" />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
          <Text
            style={[
              typography.heading3,
              { color: colors.text, marginLeft: spacing.sm },
            ]}
          >
            Quiz Locked
          </Text>
        </View>

        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.sm },
          ]}
        >
          Watch more of the video to unlock the quiz.
        </Text>

        <View style={[styles.progressSection, { marginTop: spacing.md }]}>
          <ProgressBar progress={Math.min(progressFraction, 1)} height={8} animated />
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {Math.round(watchPercent)}% watched — need {thresholdPercent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressSection: {},
});
