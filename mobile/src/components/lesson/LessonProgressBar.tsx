import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "@/components/ui";
import { useTheme } from "@/theme";

interface LessonProgressBarProps {
  current: number;
  total: number;
}

export function LessonProgressBar({ current, total }: LessonProgressBarProps) {
  const { colors, typography } = useTheme();
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} height={10} animated />
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, textAlign: "right" }]}>
        {current}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
