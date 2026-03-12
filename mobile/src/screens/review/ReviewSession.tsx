import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { Mascot, useMascotState } from '@/components/mascot';
import { useSRSQuery, useSubmitReviewMutation } from '@/hooks/queries/useReview';
import { useProgressStore } from '@/stores/progressStore';
import type { ReviewItem } from '@lingualeap/types';

type ReviewPhase = 'prompt' | 'feedback';

export function ReviewSession() {
  const { colors, typography, spacing } = useTheme();
  const currentCourseId = useProgressStore((s) => s.currentCourseId);
  const srsQuery = useSRSQuery(currentCourseId ?? undefined);
  const submitReview = useSubmitReviewMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>('prompt');
  const [lastQuality, setLastQuality] = useState<number | null>(null);

  const mascot = useMascotState({ screen: 'review' });
  const items = srsQuery.data?.items ?? [];
  const totalDue = srsQuery.data?.total_due ?? 0;
  const currentItem: ReviewItem | undefined = items[currentIndex];

  const handleRate = useCallback(
    (quality: number) => {
      if (!currentItem) return;
      setLastQuality(quality);
      submitReview.mutate(
        { conceptId: currentItem.concept_id, quality },
        {
          onSuccess: () => {
            setPhase('feedback');
          },
        },
      );
    },
    [currentItem, submitReview],
  );

  const handleNext = useCallback(() => {
    setPhase('prompt');
    setLastQuality(null);
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Refetch to get more items or show completion
      srsQuery.refetch();
      setCurrentIndex(0);
    }
  }, [currentIndex, items.length, srsQuery]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Mascot state="happy" message="All caught up! No reviews due." size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="review-screen" style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.heading3, { color: colors.text }]}>
            Review ({currentIndex + 1}/{items.length})
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {totalDue} items due
          </Text>
        </View>

        {/* Mascot */}
        <View style={[styles.mascotArea, { marginTop: spacing.lg }]}>
          <Mascot
            state={
              phase === 'feedback'
                ? lastQuality !== null && lastQuality >= 3
                  ? 'happy'
                  : 'encouraging'
                : mascot.state
            }
            size="md"
          />
        </View>

        {/* Review Card */}
        <Card variant="elevated" padding="lg" style={{ marginTop: spacing.lg }}>
          <Text style={[typography.body, { color: colors.text, textAlign: 'center' }]}>
            {currentItem.concept_type === 'vocabulary' ? 'Vocabulary' : 'Grammar'}
          </Text>
          <Text
            style={[
              typography.heading2,
              { color: colors.text, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            {currentItem.concept_id}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Review #{currentItem.review_count + 1} - Interval: {currentItem.interval_days}d
          </Text>
        </Card>

        {/* Rating buttons or feedback */}
        {phase === 'prompt' ? (
          <View style={[styles.ratingContainer, { marginTop: spacing.lg, gap: spacing.sm }]}>
            <Text style={[typography.label, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>
              How well did you remember?
            </Text>
            <View style={styles.ratingRow}>
              {[
                { quality: 1, label: 'Hard', color: colors.error },
                { quality: 3, label: 'Good', color: colors.warning },
                { quality: 5, label: 'Easy', color: colors.success },
              ].map((option) => (
                <View key={option.quality} style={styles.ratingButton}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleRate(option.quality)}
                    loading={submitReview.isPending}
                  >
                    {option.label}
                  </Button>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.feedbackContainer, { marginTop: spacing.lg }]}>
            <Text
              style={[
                typography.body,
                {
                  color: lastQuality !== null && lastQuality >= 3 ? colors.success : colors.warning,
                  textAlign: 'center',
                },
              ]}
            >
              {lastQuality !== null && lastQuality >= 3
                ? 'Nice recall!'
                : 'Keep practicing!'}
            </Text>
            <View style={{ marginTop: spacing.base }}>
              <Button variant="primary" fullWidth onPress={handleNext}>
                Next
              </Button>
            </View>
          </View>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mascotArea: {
    alignItems: 'center',
  },
  ratingContainer: {},
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
  },
  feedbackContainer: {},
});
