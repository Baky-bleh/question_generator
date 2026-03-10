import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/theme";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { MultipleChoiceExercise } from "@lingualeap/types";

export function MultipleChoice({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as MultipleChoiceExercise;
  const { colors, typography, spacing } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || disabled) return;
    onAnswer(ex.choices[selectedIndex]);
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.heading3, { color: colors.text, textAlign: "center", marginBottom: spacing.lg }]}>
        {ex.prompt}
      </Text>

      <View style={styles.options}>
        {ex.choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          return (
            <OptionCard
              key={index}
              text={choice}
              isSelected={isSelected}
              disabled={disabled}
              onPress={() => handleSelect(index)}
            />
          );
        })}
      </View>

      <View style={styles.submitArea}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={selectedIndex === null || disabled}
        >
          Check
        </Button>
      </View>
    </View>
  );
}

function OptionCard({
  text,
  isSelected,
  disabled,
  onPress,
}: {
  text: string;
  isSelected: boolean;
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
      withTiming(0.95, { duration: 50 }),
      withSpring(1, { damping: 15 }),
    );
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Card
        variant="outlined"
        padding="md"
        onPress={handlePress}
        disabled={disabled}
        style={{
          marginBottom: spacing.sm,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 3 : 2,
          backgroundColor: isSelected ? colors.successLight : colors.card,
        }}
      >
        <Text
          style={[
            typography.body,
            {
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? "600" : "400",
              textAlign: "center",
            },
          ]}
        >
          {text}
        </Text>
      </Card>
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
  options: {
    flex: 1,
    justifyContent: "center",
  },
  submitArea: {
    paddingTop: 16,
  },
});
