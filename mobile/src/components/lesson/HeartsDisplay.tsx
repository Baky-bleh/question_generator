import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

interface HeartsDisplayProps {
  count: number;
  unlimited?: boolean;
}

export function HeartsDisplay({ count, unlimited = false }: HeartsDisplayProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
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
