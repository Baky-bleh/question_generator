import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Mascot, useMascotState } from '@/components/mascot';
import { Button, Card } from '@/components/ui';
import { useProgressQuery } from '@/hooks/queries/useProgress';
import { useStreakQuery } from '@/hooks/queries/useStreak';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useProgressStore } from '@/stores/progressStore';
import { DailyProgress } from './DailyProgress';
import { StreakWidget } from './StreakWidget';

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const progressQuery = useProgressQuery();
  const streakQuery = useStreakQuery();
  const coursesQuery = useCoursesQuery();
  const currentCourseId = useProgressStore((s) => s.currentCourseId);

  const streakData = streakQuery.data;
  const isStreakAtRisk =
    !!streakData && !streakData.today_completed && new Date().getHours() >= 12;

  const mascotContext = useMascotState({ screen: 'home' });

  const mascotState = isStreakAtRisk ? 'sad' : mascotContext.state;
  const mascotMessage = isStreakAtRisk
    ? 'Your streak is at risk! Practice now!'
    : mascotContext.message;

  const isRefreshing = progressQuery.isFetching || streakQuery.isFetching;

  const onRefresh = useCallback(() => {
    progressQuery.refetch();
    streakQuery.refetch();
    coursesQuery.refetch();
  }, [progressQuery, streakQuery, coursesQuery]);

  const handleContinueLearning = useCallback(() => {
    if (currentCourseId) {
      router.push('/(tabs)/learn');
    }
  }, [currentCourseId, router]);

  const greeting = useMemo(() => getTimeOfDayGreeting(), []);

  const todayLessons = progressQuery.data?.today.lessons_completed ?? 0;
  const todayXP = progressQuery.data?.today.xp_earned ?? 0;
  const activeCourses = progressQuery.data?.courses ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
      >
        {/* Greeting Header */}
        <Text style={[typography.heading2, { color: colors.text }]}>
          {greeting}!
        </Text>

        {/* Mascot Section */}
        <View style={styles.mascotContainer}>
          <Mascot state={mascotState} message={mascotMessage} size="lg" />
        </View>

        {/* Daily Progress Ring */}
        <View style={{ marginTop: spacing.lg }}>
          <DailyProgress
            xpEarned={todayXP}
            goalMet={progressQuery.data?.today.goal_met ?? false}
            lessonsCompleted={todayLessons}
          />
        </View>

        {/* Streak Widget */}
        <View style={{ marginTop: spacing.base }}>
          <StreakWidget
            current={streakData?.current ?? 0}
            todayCompleted={streakData?.today_completed ?? false}
          />
        </View>

        {/* Continue Learning Button */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleContinueLearning}
            disabled={!currentCourseId}
          >
            Continue Learning
          </Button>
        </View>

        {/* Recent Activity / Course Suggestions */}
        {activeCourses.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.md }]}>
              Your Courses
            </Text>
            {activeCourses.map((course) => (
              <Card
                key={course.course_id}
                variant="outlined"
                padding="md"
                onPress={() => {
                  useProgressStore.getState().setCurrentCourse(course.course_id);
                  router.push('/(tabs)/learn');
                }}
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.courseRow}>
                  <View style={styles.courseInfo}>
                    <Text style={[typography.label, { color: colors.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                      {Math.round(course.progress * 100)}% complete
                    </Text>
                  </View>
                  <View style={styles.courseProgress}>
                    <View
                      style={[
                        styles.progressBarTrack,
                        { backgroundColor: colors.borderLight },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${Math.round(course.progress * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                      style={{ marginLeft: spacing.sm }}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Action: Review */}
        <View style={{ marginTop: spacing.base }}>
          <Card
            variant="outlined"
            padding="md"
            onPress={() => router.push('/(tabs)/review' as never)}
          >
            <View style={styles.courseRow}>
              <View style={styles.reviewIcon}>
                <Ionicons name="refresh" size={20} color={colors.accent} />
              </View>
              <View style={[styles.courseInfo, { marginLeft: spacing.md }]}>
                <Text style={[typography.label, { color: colors.text }]}>
                  Review Words
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Practice with spaced repetition
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        </View>

        {/* Bottom padding for safe scrolling */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  mascotContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
