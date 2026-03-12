import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoPlayer, QuizUnlockBanner } from "@/components/video";
import { useVideoLessonQuery } from "@/hooks/queries/useVideoLesson";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useProgressStore } from "@/stores/progressStore";
import { useTheme } from "@/theme";

export default function VideoLessonScreen() {
  const { id, courseId: courseIdParam } = useLocalSearchParams<{
    id: string;
    courseId?: string;
  }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const storedCourseId = useProgressStore((s) => s.currentCourseId);
  const courseId = courseIdParam ?? storedCourseId ?? "";

  const { data, isLoading, error } = useVideoLessonQuery(id ?? null);

  const videoLesson = data?.video_lesson;
  const progress = data?.progress;
  const quizUnlocked = data?.quiz_unlocked ?? false;

  const player = useVideoPlayer({
    videoLessonId: id ?? "",
    lastPositionSeconds: progress?.last_position_seconds ?? 0,
    durationSeconds: videoLesson?.video_duration_seconds ?? 0,
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !videoLesson) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.error }]}>
          Failed to load video lesson
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        >
          <Text style={[typography.body, { color: colors.primary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View testID="video-lesson-screen" style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, paddingHorizontal: spacing.md },
        ]}
      >
        <TouchableOpacity
          testID="video-back-button"
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Video player */}
      <VideoPlayer
        videoUrl={videoLesson.video_url}
        videoRef={player.videoRef}
        isPlaying={player.isPlaying}
        isLoaded={player.isLoaded}
        positionSeconds={player.positionSeconds}
        durationSeconds={player.durationSeconds}
        playbackSpeed={player.playbackSpeed}
        onPlaybackStatusUpdate={player.onPlaybackStatusUpdate}
        onLoad={player.onLoad}
        onPlay={player.play}
        onPause={player.pause}
        onSeek={player.seek}
        onCycleSpeed={player.cycleSpeed}
        onToggleFullscreen={player.toggleFullscreen}
      />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      >
        {/* Title and description */}
        <View style={[styles.infoSection, { padding: spacing.md }]}>
          <Text testID="video-lesson-title" style={[typography.heading2, { color: colors.text }]}>
            {videoLesson.title}
          </Text>

          {videoLesson.teacher_name && (
            <View style={[styles.teacherRow, { marginTop: spacing.xs }]}>
              <Ionicons
                name="person-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                testID="video-teacher-name"
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginLeft: spacing.xs },
                ]}
              >
                {videoLesson.teacher_name}
              </Text>
            </View>
          )}

          {videoLesson.description && (
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              {videoLesson.description}
            </Text>
          )}
        </View>

        {/* Quiz unlock banner */}
        <QuizUnlockBanner
          quizUnlocked={quizUnlocked}
          watchPercent={player.watchPercent}
          thresholdPercent={videoLesson.watch_threshold_percent}
          videoLessonId={id ?? ""}
          courseId={courseId}
          quizId={videoLesson.quiz_id}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  infoSection: {},
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
