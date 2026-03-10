import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface VideoWatchRingProps {
  percent: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE_WIDTH = 3;

export function VideoWatchRing({ percent, size = 32 }: VideoWatchRingProps) {
  const { colors } = useTheme();

  const animatedPercent = useSharedValue(0);

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    animatedPercent.value = withTiming(Math.min(Math.max(percent, 0), 100), {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [percent]);

  const animatedProps = useAnimatedProps(() => {
    const dashOffset = circumference * (1 - animatedPercent.value / 100);
    return {
      strokeDashoffset: dashOffset,
    };
  });

  let strokeColor: string;
  if (percent <= 0) {
    strokeColor = colors.disabled;
  } else if (percent < 80) {
    strokeColor = colors.primary;
  } else {
    strokeColor = colors.success;
  }

  const fontSize = size <= 28 ? 8 : size <= 40 ? 10 : 12;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Animated.Text
          style={[
            styles.label,
            { fontSize, color: colors.textSecondary },
          ]}
        >
          {Math.round(percent)}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
