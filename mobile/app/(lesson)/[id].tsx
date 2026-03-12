import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useLesson } from "@/hooks/useLesson";
import { useLessonPlayer } from "@/hooks/useLessonPlayer";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { LessonProgressBar } from "@/components/lesson/LessonProgressBar";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { HeartsDisplay } from "@/components/lesson/HeartsDisplay";
import { ExerciseTransition } from "@/components/lesson/ExerciseTransition";
import { LessonIntro } from "@/screens/lesson/LessonIntro";
import { LessonResults } from "@/screens/lesson/LessonResults";
import { Button } from "@/components/ui";

export default function LessonScreen() {
  const { id, courseId } = useLocalSearchParams<{ id: string; courseId: string }>();
  const { colors, typography, spacing } = useTheme();
  const { lesson, exercises, isLoading, error } = useLesson(id ?? null, courseId ?? null);

  if (isLoading || !lesson || exercises.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[typography.body, { color: colors.error, textAlign: "center", marginBottom: spacing.base }]}>
              Failed to load lesson
            </Text>
            <Button variant="outline" onPress={() => router.back()}>
              Go Back
            </Button>
          </View>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <LessonContent
      lessonId={id!}
      courseId={courseId!}
      lesson={lesson}
      exercises={exercises}
    />
  );
}

function LessonContent({
  lessonId,
  courseId,
  lesson,
  exercises,
}: {
  lessonId: string;
  courseId: string;
  lesson: { id: string; title: string; exerciseCount: number; estimatedMinutes: number };
  exercises: import("@lingualeap/types").Exercise[];
}) {
  const { colors } = useTheme();

  const player = useLessonPlayer(lessonId, courseId, exercises);

  const handleClose = () => {
    router.back();
  };

  if (player.phase === "intro") {
    return (
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <LessonIntro
          title={lesson.title}
          exerciseCount={lesson.exerciseCount}
          estimatedMinutes={lesson.estimatedMinutes}
          onStart={player.startLesson}
          onClose={handleClose}
        />
      </SafeAreaView>
    );
  }

  if (player.phase === "results") {
    return (
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <LessonResults
          completionResult={player.completionResult}
          totalExercises={player.totalExercises}
          correctCount={player.answers.filter((a) => a.correct).length}
          elapsedTime={player.elapsedTime}
          onContinue={handleClose}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="exercise-screen" style={[styles.fullContainer, { backgroundColor: colors.background }]}>
      {/* Header: progress bar + hearts + close */}
      <View style={styles.header}>
        <Button testID="lesson-close-button" variant="ghost" onPress={handleClose}>
          X
        </Button>
        <View style={styles.progressContainer}>
          <LessonProgressBar testID="lesson-progress-bar"
            current={player.currentIndex + (player.phase === "feedback" ? 1 : 0)}
            total={player.totalExercises}
          />
        </View>
        <HeartsDisplay testID="hearts-display" count={player.heartsCount} />
      </View>

      {/* Exercise area */}
      <View testID="exercise-renderer" style={styles.exerciseArea}>
        {player.currentExercise && (
          <ExerciseTransition key={player.currentIndex}>
            <ExerciseRenderer
              exercise={player.currentExercise}
              onAnswer={player.submitAnswer}
              disabled={player.phase === "feedback" || player.isSubmitting}
            />
          </ExerciseTransition>
        )}
      </View>

      {/* Answer feedback overlay */}
      {player.phase === "feedback" && player.lastFeedback && (
        <AnswerFeedback
          correct={player.lastFeedback.correct}
          correctAnswer={player.lastFeedback.correct_answer}
          explanation={player.lastFeedback.explanation}
          onContinue={player.nextExercise}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullContainer: {
    flex: 1,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  progressContainer: {
    flex: 1,
  },
  exerciseArea: {
    flex: 1,
  },
});
