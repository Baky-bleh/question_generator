import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { WordArrangeExercise } from "@lingualeap/types";

export function WordArrange({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as WordArrangeExercise;
  const { colors, typography, spacing } = useTheme();
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords] = useState(() =>
    [...ex.words].sort(() => Math.random() - 0.5),
  );

  const remainingWords = availableWords.filter(
    (word) => {
      const selectedCount = selectedWords.filter((w) => w === word).length;
      const totalCount = availableWords.filter((w) => w === word).length;
      return selectedCount < totalCount;
    },
  );

  // Track by index for duplicate handling
  const usedIndices = new Set<number>();
  const remainingWithIndices = availableWords.map((word, idx) => ({ word, idx })).filter(({ word, idx }) => {
    const isUsed = selectedWords.some((sw, si) => {
      if (sw !== word) return false;
      if (usedIndices.has(idx)) return false;
      // Check if this specific index should be used
      const priorUsedCount = [...usedIndices].filter(
        (ui) => availableWords[ui] === word,
      ).length;
      const selectedCountSoFar = selectedWords.slice(0, si + 1).filter((s) => s === word).length;
      return false;
    });
    // Simpler approach: count how many times word appears in selected vs available
    const selectedCount = selectedWords.filter((w) => w === word).length;
    const availCount = availableWords.slice(0, idx + 1).filter((w) => w === word).length;
    const alreadyAccountedFor = availableWords.slice(0, idx).filter((w) => w === word).length;
    // Just check if this index is still "available"
    return true;
  });

  const handleWordTap = (word: string) => {
    if (disabled) return;
    setSelectedWords((prev) => [...prev, word]);
  };

  const handleRemoveWord = (index: number) => {
    if (disabled) return;
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (disabled || selectedWords.length === 0) return;
    onAnswer(selectedWords);
  };

  const handleClear = () => {
    setSelectedWords([]);
  };

  // Track which available words are used
  const usedCounts: Record<string, number> = {};
  selectedWords.forEach((w) => {
    usedCounts[w] = (usedCounts[w] ?? 0) + 1;
  });

  return (
    <View style={styles.container}>
      <Text style={[typography.heading3, { color: colors.text, textAlign: "center", marginBottom: spacing.lg }]}>
        {ex.prompt}
      </Text>

      {/* Answer slots */}
      <View
        style={[
          styles.answerArea,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            minHeight: 60,
          },
        ]}
      >
        {selectedWords.length === 0 ? (
          <Text style={[typography.body, { color: colors.textTertiary }]}>
            Tap words to build your answer
          </Text>
        ) : (
          <View style={styles.wordRow}>
            {selectedWords.map((word, index) => (
              <Animated.View key={`selected-${index}`} entering={FadeIn.duration(200)}>
                <WordTile
                  text={word}
                  variant="selected"
                  onPress={() => handleRemoveWord(index)}
                  disabled={disabled}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      {/* Available words */}
      <View style={styles.wordBank}>
        {availableWords.map((word, index) => {
          const countInAvailable = availableWords.slice(0, index + 1).filter((w) => w === word).length;
          const countUsed = usedCounts[word] ?? 0;
          const isUsed = countInAvailable <= countUsed;
          return (
            <WordTile
              key={`available-${index}`}
              text={word}
              variant="available"
              onPress={() => handleWordTap(word)}
              disabled={disabled || isUsed}
              dimmed={isUsed}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        {selectedWords.length > 0 && (
          <Button variant="ghost" onPress={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={selectedWords.length === 0 || disabled}
        >
          Check
        </Button>
      </View>
    </View>
  );
}

function WordTile({
  text,
  variant,
  onPress,
  disabled,
  dimmed,
}: {
  text: string;
  variant: "available" | "selected";
  onPress: () => void;
  disabled: boolean;
  dimmed?: boolean;
}) {
  const { colors, typography, spacing } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 15 }),
    );
    onPress();
  };

  const bgColor = variant === "selected" ? colors.primaryLight : colors.card;
  const borderColor = variant === "selected" ? colors.primary : colors.border;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.tile,
          {
            backgroundColor: bgColor,
            borderColor,
            opacity: dimmed ? 0.3 : 1,
            margin: 4,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.text }]}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  answerArea: {
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: "dashed",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  wordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  wordBank: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "center",
  },
  tile: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actions: {
    paddingTop: 16,
    gap: 8,
  },
});
