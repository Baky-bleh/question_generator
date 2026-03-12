import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
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
import { useProgressStore } from '@/stores/progressStore';
import { triggerShake } from '@/utils/animations';
import { VideoWatchRing } from '@/components/progress/VideoWatchRing';
import type { LessonSummary } from '@lingualeap/types';

interface VideoLessonNodeProps {
  lesson: LessonSummary;
  testID?: string;
}

const CARD_WIDTH = 100;
const CARD_HEIGHT = 80;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoLessonNode({ lesson, testID }: VideoLessonNodeProps) {
  const { colors, typography, spacing, shadows } = useTheme();
  const router = useRouter();
  const courseId = useProgressStore((s) => s.currentCourseId);

  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const isAvailable = lesson.status === 'available';
  const isCompleted = lesson.status === 'completed';
  const isLocked = lesson.status === 'locked';
  const hasPartialWatch =
    !isCompleted &&
    lesson.watch_percent !== undefined &&
    lesson.watch_percent > 0;

  useEffect(() => {
    if (isAvailable) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [isAvailable]);

  const handlePress = () => {
    if (isLocked) {
      triggerShake(shakeX);
      return;
    }
    router.push(`/(video)/${lesson.id}?courseId=${courseId}`);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shakeX.value },
    ],
  }));

  let borderColor: string;
  let cardBackgroundColor: string;

  if (isCompleted) {
    borderColor = colors.xpGold;
    cardBackgroundColor = colors.card;
  } else if (isAvailable) {
    borderColor = colors.primary;
    cardBackgroundColor = colors.card;
  } else {
    borderColor = colors.disabled;
    cardBackgroundColor = colors.disabled;
  }

  return (
    <Animated.View testID={testID} style={[styles.wrapper, animatedStyle]}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: cardBackgroundColor,
            borderColor,
            ...(isAvailable ? shadows.md : {}),
          },
        ]}
        onTouchEnd={handlePress}
      >
        {/* Thumbnail or play icon area */}
        <View style={[styles.thumbnailArea, { backgroundColor: isLocked ? colors.disabled : colors.surface }]}>
          {lesson.thumbnail_url && !isLocked ? (
            <Image
              source={{ uri: lesson.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={isLocked ? 'lock-closed' : 'play'}
              size={20}
              color={isLocked ? colors.disabledText : colors.primary}
            />
          )}

          {/* Completed checkmark overlay */}
          {isCompleted && (
            <View style={[styles.checkOverlay, { backgroundColor: colors.xpGold }]}>
              <Ionicons name="checkmark" size={14} color={colors.textInverse} />
            </View>
          )}

          {/* Watch progress ring overlay */}
          {hasPartialWatch && (
            <View style={styles.watchRingOverlay}>
              <VideoWatchRing percent={lesson.watch_percent ?? 0} size={28} />
            </View>
          )}

          {/* Duration badge */}
          {lesson.duration_seconds !== undefined && (
            <View style={[styles.durationBadge, { backgroundColor: colors.overlay }]}>
              <Text style={styles.durationText}>
                {formatDuration(lesson.duration_seconds)}
              </Text>
            </View>
          )}
        </View>

        {/* Quiz indicator */}
        {lesson.quiz_unlocked && (
          <View style={[styles.quizBadge, { backgroundColor: colors.success }]}>
            <Ionicons name="school" size={10} color={colors.textInverse} />
          </View>
        )}
      </Animated.View>

      {/* Title below card */}
      <Text
        style={[
          styles.label,
          { color: isLocked ? colors.textTertiary : colors.textSecondary },
        ]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: CARD_WIDTH + 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnailArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  checkOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchRingOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  quizBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    width: CARD_WIDTH,
  },
});
