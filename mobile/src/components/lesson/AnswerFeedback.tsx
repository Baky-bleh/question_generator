import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { SlideInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/mascot";

interface AnswerFeedbackProps {
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
  onContinue: () => void;
}

export function AnswerFeedback({
  correct,
  correctAnswer,
  explanation,
  onContinue,
}: AnswerFeedbackProps) {
  const { colors, typography, spacing } = useTheme();

  const bgColor = correct ? colors.successLight : colors.errorLight;
  const accentColor = correct ? colors.success : colors.error;
  const icon = correct ? "checkmark-circle" : "close-circle";
  const title = correct ? "Great job!" : "Not quite";
  const mascotState = correct ? "happy" : "encouraging";

  return (
    <Animated.View
      testID="answer-feedback"
      entering={SlideInDown.springify().damping(18)}
      style={[styles.container, { backgroundColor: bgColor, borderTopColor: accentColor }]}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Animated.View entering={FadeIn.delay(100)}>
            <Ionicons name={icon} size={32} color={accentColor} />
          </Animated.View>
          <Text style={[typography.heading3, { color: accentColor, marginLeft: spacing.sm }]}>
            {title}
          </Text>
        </View>

        {!correct && (
          <View style={styles.correctAnswerRow}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              Correct answer:
            </Text>
            <Text style={[typography.body, { color: accentColor, fontWeight: "600", marginTop: 2 }]}>
              {correctAnswer}
            </Text>
          </View>
        )}

        {explanation && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            {explanation}
          </Text>
        )}

        <View style={styles.mascotRow}>
          <Mascot state={mascotState} size="sm" />
        </View>

        <Button
          testID="feedback-continue-button"
          variant={correct ? "primary" : "outline"}
          size="lg"
          fullWidth
          onPress={onContinue}
        >
          Continue
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  correctAnswerRow: {
    marginTop: 8,
  },
  mascotRow: {
    alignItems: "center",
    marginVertical: 12,
  },
});
