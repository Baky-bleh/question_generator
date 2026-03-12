import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/mascot";

interface LessonIntroProps {
  title: string;
  exerciseCount: number;
  estimatedMinutes: number;
  onStart: () => void;
  onClose: () => void;
}

export function LessonIntro({
  title,
  exerciseCount,
  estimatedMinutes,
  onStart,
  onClose,
}: LessonIntroProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View testID="lesson-intro-screen" style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Mascot state="teaching" size="lg" message="Let me show you something new!" />

        <Text testID="lesson-intro-title" style={[typography.heading2, { color: colors.text, textAlign: "center", marginTop: spacing.lg }]}>
          {title}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
            <Text testID="lesson-intro-exercise-count" style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
              {exerciseCount} exercises
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
              ~{estimatedMinutes} min
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button testID="lesson-intro-start-button" variant="primary" size="lg" fullWidth onPress={onStart}>
          Start Lesson
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
  closeButton: {
    alignSelf: "flex-start",
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  footer: {
    paddingTop: 16,
  },
});
