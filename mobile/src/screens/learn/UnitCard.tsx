import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { LessonNode } from './LessonNode';
import { VideoLessonNode } from './VideoLessonNode';
import type { Unit } from '@lingualeap/types';

interface UnitCardProps {
  unit: Unit;
  testID?: string;
}

export function UnitCard({ unit, testID }: UnitCardProps) {
  const { colors, typography, spacing, shadows } = useTheme();
  const [expanded, setExpanded] = useState(true);

  const completedCount = unit.lessons.filter((l) => l.status === 'completed').length;
  const totalCount = unit.lessons.length;

  return (
    <View testID={testID} style={[styles.container, { marginBottom: spacing.lg }]}>
      {/* Expandable Header */}
      <TouchableOpacity
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...shadows.sm,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View
          style={[
            styles.unitBadge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>
            {unit.order}
          </Text>
        </View>
        <View style={[styles.headerText, { marginLeft: spacing.md }]}>
          <Text
            style={[
              typography.heading3,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {unit.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {completedCount}/{totalCount} lessons
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {/* Lesson Nodes */}
      {expanded && (
        <View style={[styles.lessonsGrid, { gap: spacing.md, paddingTop: spacing.md }]}>
          {unit.lessons.map((lesson, index) =>
            lesson.type === 'video' ? (
              <VideoLessonNode key={lesson.id} lesson={lesson} testID={`video-lesson-node-${index}`} />
            ) : (
              <LessonNode key={lesson.id} lesson={lesson} testID={`lesson-node-${index}`} />
            ),
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerText: {
    flex: 1,
  },
  unitBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
});
