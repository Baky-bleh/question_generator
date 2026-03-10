import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTheme } from "@/theme";

interface QuizUnlockBannerProps {
  quizUnlocked: boolean;
  watchPercent: number;
  thresholdPercent: number;
  videoLessonId: string;
  courseId: string;
  quizId: string | null;
}

export function QuizUnlockBanner({
  quizUnlocked,
  watchPercent,
  thresholdPercent,
  videoLessonId,
  courseId,
  quizId,
}: QuizUnlockBannerProps) {
  const { colors, typography, spacing, shadows } = useTheme();
  const router = useRouter();

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (quizUnlocked) {
      scale.value = withSpring(1.02, { damping: 8, stiffness: 150 });
      translateY.value = withTiming(-4, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [quizUnlocked, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handleTakeQuiz = () => {
    router.push(
      `/(video)/quiz?videoLessonId=${videoLessonId}&courseId=${courseId}` as never,
    );
  };

  const progressFraction = Math.min(watchPercent / thresholdPercent, 1);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: quizUnlocked ? colors.successLight : colors.surface,
          borderColor: quizUnlocked ? colors.success : colors.border,
          ...shadows.sm,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Mascot
          state={quizUnlocked ? "happy" : "thinking"}
          size="sm"
          animated={quizUnlocked}
        />

        <View style={[styles.textArea, { marginLeft: spacing.md }]}>
          {quizUnlocked ? (
            <>
              <Text
                style={[
                  typography.heading3,
                  { color: colors.success, marginBottom: spacing.xs },
                ]}
              >
                Quiz Ready!
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                Test what you learned from this video
              </Text>
              {quizId && (
                <View style={{ marginTop: spacing.sm }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleTakeQuiz}
                  >
                    Take Quiz
                  </Button>
                </View>
              )}
            </>
          ) : (
            <>
              <Text
                style={[
                  typography.body,
                  { color: colors.text, marginBottom: spacing.xs },
                ]}
              >
                Watch {thresholdPercent}% to unlock quiz
              </Text>
              <ProgressBar
                progress={progressFraction}
                style={{ marginBottom: spacing.xs }}
              />
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                {watchPercent}% watched
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textArea: {
    flex: 1,
  },
});
