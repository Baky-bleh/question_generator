import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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
import { triggerShake } from '@/utils/animations';
import type { LessonSummary } from '@lingualeap/types';

interface LessonNodeProps {
  lesson: LessonSummary;
  testID?: string;
}

const NODE_SIZE = 64;

export function LessonNode({ lesson, testID }: LessonNodeProps) {
  const { colors, shadows } = useTheme();
  const router = useRouter();

  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const isAvailable = lesson.status === 'available';
  const isCurrent = isAvailable && lesson.order === 1; // First available = current
  const isCompleted = lesson.status === 'completed';
  const isLocked = lesson.status === 'locked';

  useEffect(() => {
    if (isAvailable || isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [isAvailable, isCurrent]);

  const handlePress = () => {
    if (isLocked) {
      triggerShake(shakeX);
      return;
    }
    router.push(`/(lesson)/${lesson.id}`);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shakeX.value },
    ],
  }));

  let backgroundColor: string;
  let iconName: keyof typeof Ionicons.glyphMap;
  let iconColor: string;

  if (isCompleted) {
    backgroundColor = colors.xpGold;
    iconName = 'checkmark';
    iconColor = colors.textInverse;
  } else if (isAvailable) {
    backgroundColor = colors.primary;
    iconName = 'play';
    iconColor = colors.textInverse;
  } else {
    backgroundColor = colors.disabled;
    iconName = 'lock-closed';
    iconColor = colors.disabledText;
  }

  return (
    <Animated.View testID={testID} style={[styles.wrapper, animatedStyle]}>
      <Animated.View
        style={[
          styles.node,
          {
            backgroundColor,
            ...(isAvailable ? shadows.md : {}),
          },
        ]}
        onTouchEnd={handlePress}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isLocked ? colors.textTertiary : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {lesson.title}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 80,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    width: 76,
  },
});
