import React from "react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { StyleSheet } from "react-native";

interface ExerciseTransitionProps {
  children: React.ReactNode;
}

export function ExerciseTransition({ children }: ExerciseTransitionProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(300).springify().damping(18)}
      exiting={FadeOutLeft.duration(200)}
      style={styles.container}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
