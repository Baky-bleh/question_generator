import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import type { MascotState } from '../../../../shared/mascot/types';
import { MASCOT_CONFIG } from '../../../../shared/mascot/constants';
import { MascotStatic } from './MascotStatic';

interface MascotAnimatedProps {
  state: MascotState;
  size?: 'sm' | 'md' | 'lg';
}

export function MascotAnimated({ state, size = 'md' }: MascotAnimatedProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);

  const config = MASCOT_CONFIG[state];

  useEffect(() => {
    // Bounce-in on appear
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  useEffect(() => {
    // Scale pulse on state change
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );

    // Animation based on state type
    switch (config.animationType) {
      case 'bounce':
        translateY.value = withSequence(
          withTiming(-8, { duration: 200 }),
          withSpring(0, { damping: 8, stiffness: 200 }),
        );
        break;
      case 'float':
        translateY.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        );
        break;
      case 'shake':
        translateY.value = withSequence(
          withTiming(-3, { duration: 100 }),
          withTiming(3, { duration: 100 }),
          withTiming(-2, { duration: 100 }),
          withTiming(0, { duration: 100 }),
        );
        break;
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        );
        break;
      case 'none':
        translateY.value = 0;
        break;
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MascotStatic state={state} size={size} />
    </Animated.View>
  );
}
