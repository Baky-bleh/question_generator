import React, { useRef, useCallback } from 'react';
import { View, Text, FlatList, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { ProgressBar } from '@/components/ui';
import { useCourseDetailQuery } from '@/hooks/queries/useCourses';
import { useProgressStore } from '@/stores/progressStore';
import { UnitCard } from './UnitCard';
import type { Unit } from '@lingualeap/types';

export function SkillTree() {
  const { colors, typography, spacing } = useTheme();
  const currentCourseId = useProgressStore((s) => s.currentCourseId);
  const courseQuery = useCourseDetailQuery(currentCourseId);
  const flatListRef = useRef<FlatList<Unit>>(null);

  const units = courseQuery.data?.units ?? [];
  const enrollment = courseQuery.data?.enrollment;
  const overallProgress = enrollment?.overall_progress ?? 0;
  const currentUnitIndex = enrollment
    ? units.findIndex((u) => u.order === enrollment.current_unit)
    : 0;

  const handleContentReady = useCallback(() => {
    if (currentUnitIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: currentUnitIndex,
        animated: false,
        viewOffset: 20,
      });
    }
  }, [currentUnitIndex]);

  const renderUnit = useCallback(
    ({ item, index }: { item: Unit; index: number }) => <UnitCard unit={item} testID={`unit-card-${index}`} />,
    [],
  );

  if (!currentCourseId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
          <Text style={[typography.heading3, { color: colors.text, marginTop: spacing.base }]}>
            No course selected
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Enroll in a course to start learning
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="skill-tree-screen" style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Course Header */}
      <View style={[styles.header, { padding: spacing.base, borderBottomColor: colors.borderLight }]}>
        <Text style={[typography.heading2, { color: colors.text }]}>
          {courseQuery.data?.title ?? 'Loading...'}
        </Text>
        {enrollment && (
          <View style={[styles.progressSection, { marginTop: spacing.sm }]}>
            <ProgressBar
              progress={overallProgress}
              color={colors.primary}
              height={8}
            />
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.xs },
              ]}
            >
              {Math.round(overallProgress * 100)}% complete
            </Text>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={units}
        keyExtractor={(item) => String(item.order)}
        renderItem={renderUnit}
        contentContainerStyle={{ padding: spacing.base, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
        onLayout={handleContentReady}
        onScrollToIndexFailed={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  progressSection: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
