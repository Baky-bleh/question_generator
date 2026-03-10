import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { Input, Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { TranslationExercise } from "@lingualeap/types";

export function Translation({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as TranslationExercise;
  const { colors, typography, spacing } = useTheme();
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return;
    onAnswer(answer.trim());
  };

  return (
    <View style={styles.container}>
      <View style={styles.promptArea}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Translate this sentence
        </Text>
        <Text style={[typography.heading2, { color: colors.text, textAlign: "center" }]}>
          {ex.prompt}
        </Text>
      </View>

      <View style={styles.inputArea}>
        <Input
          placeholder="Type your translation..."
          value={answer}
          onChangeText={setAnswer}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          disabled={disabled}
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!answer.trim() || disabled}
        >
          Check
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  promptArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputArea: {
    gap: 12,
  },
});
