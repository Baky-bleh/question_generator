import React, { useMemo } from 'react';
import { View, Text, ScrollView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useUserProfileQuery } from '@/hooks/queries/useUser';
import { useProgressQuery, useCourseProgressQuery } from '@/hooks/queries/useProgress';
import { useStreakQuery } from '@/hooks/queries/useStreak';
import { useProgressStore } from '@/stores/progressStore';
import { useAuth } from '@/hooks/useAuth';
import { XPBadge } from '@/components/progress/XPBadge';
import { LevelIndicator } from '@/components/progress/LevelIndicator';
import { StatsCard } from './StatsCard';

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function ProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const userQuery = useUserProfileQuery();
  const progressQuery = useProgressQuery();
  const streakQuery = useStreakQuery();
  const currentCourseId = useProgressStore((s) => s.currentCourseId);
  const courseProgressQuery = useCourseProgressQuery(currentCourseId);

  const user = userQuery.data;
  const totalXP = progressQuery.data?.total_xp ?? 0;
  const level = progressQuery.data?.level ?? 1;
  const streakData = streakQuery.data;

  const initials = useMemo(() => getInitials(user?.display_name), [user?.display_name]);
  const memberSince = useMemo(() => formatMemberSince(user?.created_at), [user?.created_at]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
      >
        {/* Avatar + Name */}
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary, borderColor: colors.primaryDark },
            ]}
          >
            <Text style={[typography.heading1, { color: colors.textInverse }]}>
              {initials}
            </Text>
          </View>
          <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.md }]}>
            {user?.display_name ?? 'Loading...'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {user?.email ?? ''}
          </Text>
          {memberSince ? (
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>
              Member since {memberSince}
            </Text>
          ) : null}
        </View>

        {/* XP + Level badges */}
        <View style={[styles.badgeRow, { marginTop: spacing.lg, gap: spacing.base }]}>
          <XPBadge xp={totalXP} />
          <LevelIndicator level={level} totalXP={totalXP} />
        </View>

        {/* Quick Stats Grid */}
        <View style={[styles.statsGrid, { marginTop: spacing.lg, gap: spacing.sm }]}>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Ionicons name="star" size={24} color={colors.xpGold} />
            <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.xs }]}>
              {totalXP.toLocaleString()}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Total XP
            </Text>
          </Card>

          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Ionicons name="flame" size={24} color={colors.streakOrange} />
            <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.xs }]}>
              {streakData?.current ?? 0}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </Card>

          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.xs }]}>
              {courseProgressQuery.data?.lessons_completed ?? 0}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Lessons
            </Text>
          </Card>

          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Ionicons name="trophy" size={24} color={colors.accent} />
            <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.xs }]}>
              {streakData?.longest ?? 0}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Best Streak
            </Text>
          </Card>
        </View>

        {/* Detailed Stats */}
        <View style={{ marginTop: spacing.lg }}>
          <StatsCard
            lessonsCompleted={courseProgressQuery.data?.lessons_completed ?? 0}
            wordsLearned={courseProgressQuery.data?.words_learned ?? 0}
            timeSpentMinutes={courseProgressQuery.data?.time_spent_minutes ?? 0}
          />
        </View>

        {/* Achievement placeholder */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.heading3, { color: colors.text, marginBottom: spacing.md }]}>
            Achievements
          </Text>
          <View style={styles.achievementGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.achievementPlaceholder,
                  { backgroundColor: colors.surface, borderColor: colors.borderLight },
                ]}
              >
                <Ionicons name="trophy-outline" size={24} color={colors.textTertiary} />
              </View>
            ))}
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Coming Soon
          </Text>
        </View>

        {/* Settings button */}
        <View style={{ marginTop: spacing.xl }}>
          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/(tabs)/settings')}
          >
            Settings
          </Button>
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: spacing.md }}>
          <Button
            variant="ghost"
            fullWidth
            onPress={logout}
          >
            Sign Out
          </Button>
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing.lg }} />
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
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  achievementPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
});
