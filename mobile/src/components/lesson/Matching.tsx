import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme";
import { Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { MatchingExercise } from "@lingualeap/types";

interface MatchPair {
  left: string;
  right: string;
}

export function Matching({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as MatchingExercise;
  const { colors, typography, spacing } = useTheme();

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<MatchPair[]>([]);

  // Shuffle columns independently using a stable random order
  const [shuffledLeft] = useState(() =>
    [...ex.pairs.map((p) => p.left)].sort(() => Math.random() - 0.5),
  );
  const [shuffledRight] = useState(() =>
    [...ex.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5),
  );

  const isLeftMatched = useCallback(
    (item: string) => matchedPairs.some((p) => p.left === item),
    [matchedPairs],
  );
  const isRightMatched = useCallback(
    (item: string) => matchedPairs.some((p) => p.right === item),
    [matchedPairs],
  );

  const handleLeftPress = (item: string) => {
    if (disabled || isLeftMatched(item)) return;
    setSelectedLeft(item);

    if (selectedRight) {
      setMatchedPairs((prev) => [...prev, { left: item, right: selectedRight }]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleRightPress = (item: string) => {
    if (disabled || isRightMatched(item)) return;
    setSelectedRight(item);

    if (selectedLeft) {
      setMatchedPairs((prev) => [...prev, { left: selectedLeft, right: item }]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const allMatched = matchedPairs.length === ex.pairs.length;

  const handleSubmit = () => {
    if (!allMatched || disabled) return;
    // Send pairs as alternating array: [left1, right1, left2, right2, ...]
    const answer = matchedPairs.flatMap((p) => [p.left, p.right]);
    onAnswer(answer);
  };

  const handleReset = () => {
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.heading3, { color: colors.text, textAlign: "center", marginBottom: spacing.lg }]}>
        Match the pairs
      </Text>

      <View style={styles.columns}>
        <View style={styles.column}>
          {shuffledLeft.map((item) => (
            <MatchTile
              key={item}
              text={item}
              isSelected={selectedLeft === item}
              isMatched={isLeftMatched(item)}
              disabled={disabled || isLeftMatched(item)}
              onPress={() => handleLeftPress(item)}
            />
          ))}
        </View>

        <View style={styles.column}>
          {shuffledRight.map((item) => (
            <MatchTile
              key={item}
              text={item}
              isSelected={selectedRight === item}
              isMatched={isRightMatched(item)}
              disabled={disabled || isRightMatched(item)}
              onPress={() => handleRightPress(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {matchedPairs.length > 0 && !allMatched && (
          <Button variant="ghost" onPress={handleReset} disabled={disabled}>
            Reset
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!allMatched || disabled}
        >
          Check
        </Button>
      </View>
    </View>
  );
}

function MatchTile({
  text,
  isSelected,
  isMatched,
  disabled,
  onPress,
}: {
  text: string;
  isSelected: boolean;
  isMatched: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.93, { duration: 50 }),
      withSpring(1, { damping: 15 }),
    );
    onPress();
  };

  const bgColor = isMatched
    ? colors.successLight
    : isSelected
      ? colors.primaryLight
      : colors.card;

  const borderColor = isMatched
    ? colors.success
    : isSelected
      ? colors.primary
      : colors.border;

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
            opacity: isMatched ? 0.7 : 1,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <Text
          style={[
            typography.bodySmall,
            { color: isMatched ? colors.success : colors.text, textAlign: "center" },
          ]}
        >
          {text}
        </Text>
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
  columns: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  column: {
    flex: 1,
  },
  tile: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  actions: {
    paddingTop: 16,
    gap: 8,
  },
});
