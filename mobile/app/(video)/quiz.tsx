import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useQuizQuery } from "@/hooks/queries/useQuiz";
import { useVideoLessonQuery } from "@/hooks/queries/useVideoLesson";
import { useQuizPlayer } from "@/hooks/useQuizPlayer";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { LessonProgressBar } from "@/components/lesson/LessonProgressBar";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { ExerciseTransition } from "@/components/lesson/ExerciseTransition";
import { LessonResults } from "@/screens/lesson/LessonResults";
import { QuizIntro, QuizLockBanner } from "@/components/quiz";
import { Button } from "@/components/ui";
import type { Exercise } from "@lingualeap/types";

export default function QuizScreen() {
  const { videoLessonId, quizId, courseId } = useLocalSearchParams<{
    videoLessonId: string;
    quizId: string;
    courseId: string;
  }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const { data: videoData } = useVideoLessonQuery(videoLessonId ?? null);
  const { exercises, isLocked, isLoading, error } = useQuizQuery(videoLessonId ?? null);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.error, textAlign: "center", marginBottom: spacing.base }]}>
          Failed to load quiz
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  // Locked state
  if (isLocked || !exercises) {
    const watchPercent = videoData?.progress?.watch_percent ?? 0;
    const thresholdPercent = videoData?.video_lesson?.watch_threshold_percent ?? 80;

    return (
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <View style={styles.lockedHeader}>
          <Button variant="ghost" onPress={() => router.back()}>
            X
          </Button>
        </View>
        <View style={styles.lockedContent}>
          <QuizLockBanner watchPercent={watchPercent} thresholdPercent={thresholdPercent} />
          <View style={styles.lockedFooter}>
            <Button variant="primary" size="lg" fullWidth onPress={() => router.back()}>
              Back to Video
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Quiz loaded — render the quiz content
  return (
    <QuizContent
      quizId={quizId ?? ""}
      courseId={courseId ?? ""}
      videoTitle={videoData?.video_lesson?.title ?? ""}
      videoLessonId={videoLessonId ?? ""}
      exercises={exercises}
    />
  );
}

function QuizContent({
  quizId,
  courseId,
  videoTitle,
  videoLessonId,
  exercises,
}: {
  quizId: string;
  courseId: string;
  videoTitle: string;
  videoLessonId: string;
  exercises: Exercise[];
}) {
  const router = useRouter();
  const { colors } = useTheme();

  const player = useQuizPlayer(quizId, courseId, exercises);

  const estimatedMinutes = Math.max(1, Math.ceil(exercises.length * 0.5));

  const handleClose = () => {
    router.back();
  };

  const handleBackToCourse = () => {
    // Navigate back past the video route group to the course screen
    router.dismissAll();
  };

  const handleRewatchVideo = () => {
    router.replace({
      pathname: "/(video)/[id]",
      params: { id: videoLessonId, courseId },
    });
  };

  // Intro phase
  if (player.phase === "intro") {
    return (
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <QuizIntro
          videoTitle={videoTitle}
          exerciseCount={player.totalExercises}
          estimatedMinutes={estimatedMinutes}
          onStart={player.startQuiz}
          onRewatch={handleRewatchVideo}
        />
      </SafeAreaView>
    );
  }

  // Results phase
  if (player.phase === "results") {
    return (
      <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <LessonResults
          completionResult={player.completionResult}
          totalExercises={player.totalExercises}
          correctCount={player.answers.filter((a) => a.correct).length}
          elapsedTime={player.elapsedTime}
          onContinue={handleBackToCourse}
        />
        <View style={styles.resultsExtraButtons}>
          <Button variant="outline" size="md" fullWidth onPress={handleRewatchVideo}>
            Rewatch Video
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise + feedback phases
  return (
    <SafeAreaView style={[styles.fullContainer, { backgroundColor: colors.background }]}>
      {/* Header: close button + progress bar (no hearts) */}
      <View style={styles.header}>
        <Button variant="ghost" onPress={handleClose}>
          X
        </Button>
        <View style={styles.progressContainer}>
          <LessonProgressBar
            current={player.currentIndex + (player.phase === "feedback" ? 1 : 0)}
            total={player.totalExercises}
          />
        </View>
      </View>

      {/* Exercise area */}
      <View style={styles.exerciseArea}>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fullContainer: {
    flex: 1,
  },
  lockedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  lockedContent: {
    flex: 1,
    justifyContent: "center",
  },
  lockedFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  resultsExtraButtons: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
