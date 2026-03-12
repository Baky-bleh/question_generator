import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { Input, Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { FillBlankExercise } from "@lingualeap/types";

export function FillBlank({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as FillBlankExercise;
  const { colors, typography, spacing } = useTheme();
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return;
    onAnswer(answer.trim());
  };

  // The prompt contains "___" as the blank marker
  const parts = ex.prompt.split("___");

  return (
    <View style={styles.container}>
      <View style={styles.sentenceArea}>
        <View style={styles.sentenceRow}>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <Text style={[typography.heading3, { color: colors.text }]}>{part}</Text>
              {i < parts.length - 1 && (
                <View
                  style={[
                    styles.blankIndicator,
                    { borderBottomColor: colors.primary, marginHorizontal: spacing.xs },
                  ]}
                >
                  <Text style={[typography.heading3, { color: colors.primary }]}>
                    {answer || "____"}
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {ex.hint && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md, textAlign: "center" }]}>
            Hint: {ex.hint}
          </Text>
        )}
      </View>

      <View style={styles.inputArea}>
        <Input
          testID="fill-blank-input"
          placeholder="Type your answer..."
          value={answer}
          onChangeText={setAnswer}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          disabled={disabled}
        />
        <Button
          testID="exercise-check-button"
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
  sentenceArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  blankIndicator: {
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  inputArea: {
    gap: 12,
  },
});
