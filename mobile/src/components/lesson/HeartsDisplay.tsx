import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

interface HeartsDisplayProps {
  count: number;
  unlimited?: boolean;
  testID?: string;
}

export function HeartsDisplay({ count, unlimited = false, testID }: HeartsDisplayProps) {
  const { colors, typography } = useTheme();

  return (
    <View testID={testID} style={styles.container}>
      <Ionicons name="heart" size={20} color={colors.error} />
      <Text style={[typography.label, { color: colors.error, marginLeft: 4 }]}>
        {unlimited ? "\u221E" : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
