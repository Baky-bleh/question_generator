import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface StreakFireProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { icon: 20, font: 14 },
  md: { icon: 28, font: 18 },
  lg: { icon: 36, font: 24 },
};

export function StreakFire({ count, size = 'md' }: StreakFireProps) {
  const { colors, typography } = useTheme();
  const sizeConfig = SIZE_MAP[size];

  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name="flame"
          size={sizeConfig.icon}
          color={count > 0 ? colors.streakOrange : colors.textTertiary}
        />
      </Animated.View>
      <Text
        style={[
          { fontSize: sizeConfig.font, fontWeight: '700', color: colors.text, marginLeft: 4 },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
