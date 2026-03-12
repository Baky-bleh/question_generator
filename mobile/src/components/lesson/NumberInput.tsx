import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { NumberInputExercise } from "@lingualeap/types";

export function NumberInput({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as NumberInputExercise;
  const { colors, typography, spacing } = useTheme();
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onAnswer(trimmed);
  };

  const handleChangeText = (text: string) => {
    // Allow digits, decimal point, and negative sign
    const filtered = text.replace(/[^0-9.\-]/g, "");
    setValue(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.promptArea}>
        <Text style={[typography.heading3, { color: colors.text, textAlign: "center" }]}>
          {ex.prompt}
        </Text>
      </View>

      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TextInput
            testID="number-input-field"
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                ...typography.heading2,
              },
            ]}
            value={value}
            onChangeText={handleChangeText}
            keyboardType="numeric"
            placeholder="?"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!disabled}
          />
          {ex.unit && (
            <Text
              style={[
                typography.heading3,
                { color: colors.textSecondary, marginLeft: spacing.sm },
              ]}
            >
              {ex.unit}
            </Text>
          )}
        </View>

        <Button
          testID="exercise-check-button"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!value.trim() || disabled}
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    textAlign: "center",
    minWidth: 120,
    fontSize: 24,
  },
});
