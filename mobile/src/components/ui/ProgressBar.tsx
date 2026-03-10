import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  animated?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  animated = true,
  showLabel = false,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const animatedWidth = useSharedValue(animated ? 0 : clampedProgress);

  useEffect(() => {
    if (animated) {
      animatedWidth.value = withTiming(clampedProgress, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  const fillColor = color ?? colors.primary;
  const trackColor = colors.borderLight;

  return (
    <View style={style}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: trackColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
            fillStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {Math.round(clampedProgress * 100)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});
