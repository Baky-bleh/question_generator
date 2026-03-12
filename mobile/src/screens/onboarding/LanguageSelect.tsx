import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useUpdateUserMutation } from '@/hooks/queries/useUser';
import { apiClient } from '@/services/api';
import type { Course } from '@lingualeap/types';

type MathGoal = 'fundamentals' | 'sat' | 'olympiad' | 'class';

type Step =
  | 'subject'
  | 'math-goal'
  | 'math-level'
  | 'class-select'
  | 'math-courses';

interface GoalOption {
  id: MathGoal;
  label: string;
  description: string;
  icon: string;
}

const MATH_GOALS: GoalOption[] = [
  {
    id: 'fundamentals',
    label: 'Master fundamentals',
    description: 'Build a strong foundation in core math concepts',
    icon: 'build',
  },
  {
    id: 'sat',
    label: 'SAT Prep',
    description: 'Prepare for the SAT math section',
    icon: 'school',
  },
  {
    id: 'olympiad',
    label: 'Competitive Math (Olympiad)',
    description: 'Train for math competitions',
    icon: 'trophy',
  },
  {
    id: 'class',
    label: 'Improve school grades',
    description: 'Follow your school curriculum',
    icon: 'library',
  },
];

interface LevelOption {
  id: string;
  label: string;
}

const FUNDAMENTALS_LEVELS: LevelOption[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const SAT_LEVELS: LevelOption[] = [
  { id: 'starting', label: 'Just starting' },
  { id: 'some-practice', label: 'Some practice' },
  { id: 'high-score', label: 'Need high score' },
];

const OLYMPIAD_LEVELS: LevelOption[] = [
  { id: 'regional', label: 'Regional' },
  { id: 'national', label: 'National' },
  { id: 'international', label: 'International' },
];

const CLASSES = Array.from({ length: 12 }, (_, i) => ({
  id: `class-${i + 1}`,
  name: `Class ${i + 1}`,
  grade: i + 1,
}));

function getLevelsForGoal(goal: MathGoal): LevelOption[] {
  switch (goal) {
    case 'fundamentals':
      return FUNDAMENTALS_LEVELS;
    case 'sat':
      return SAT_LEVELS;
    case 'olympiad':
      return OLYMPIAD_LEVELS;
    default:
      return [];
  }
}

function getGoalLabel(goal: MathGoal): string {
  return MATH_GOALS.find((g) => g.id === goal)?.label ?? goal;
}

export default function LanguageSelect() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setMathGoal = useSettingsStore((s) => s.setMathGoal);
  const setMathLevel = useSettingsStore((s) => s.setMathLevel);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setCurrentCourse = useProgressStore((s) => s.setCurrentCourse);
  const setDailyGoal = useProgressStore((s) => s.setDailyGoal);
  const updateUser = useUpdateUserMutation();

  const [step, setStep] = useState<Step>('subject');
  const [selectedGoal, setSelectedGoal] = useState<MathGoal | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const coursesQuery = useCoursesQuery();

  const mathCourses = useMemo(() => {
    if (!coursesQuery.data) return [];
    return coursesQuery.data.filter((c) => c.course_type === 'math');
  }, [coursesQuery.data]);

  const matchingCourses = useMemo(() => {
    if (!selectedGoal) return [];
    const goalTag = selectedGoal === 'class' ? `math-class-${selectedLevel}` : `math-${selectedGoal}`;
    return mathCourses.filter(
      (c) => c.language_to === goalTag || c.language_to === `math-${selectedGoal}-${selectedLevel}`,
    );
  }, [mathCourses, selectedGoal, selectedLevel]);

  const fallbackCourse = useMemo(() => {
    return mathCourses.find((c) => {
      const title = c.title.toLowerCase();
      return title.includes('algebra') && title.includes('basics');
    }) ?? mathCourses[0] ?? null;
  }, [mathCourses]);

  // --- Subject selection ---
  function handleSubjectSelect(subject: 'english' | 'math') {
    if (subject === 'english') {
      setLanguage('english');
      router.push('/(onboarding)/goal');
    } else {
      setStep('math-goal');
    }
  }

  // --- Math goal selection ---
  function handleGoalSelect(goal: MathGoal) {
    setSelectedGoal(goal);
    setMathGoal(goal);

    if (goal === 'class') {
      setStep('class-select');
    } else {
      setStep('math-level');
    }
  }

  // --- Level selection ---
  function handleLevelSelect(level: string) {
    setSelectedLevel(level);
    setMathLevel(level);
    setLanguage(`math-${selectedGoal}-${level}`);
    setStep('math-courses');
  }

  // --- Class selection ---
  function handleClassSelect(grade: number) {
    const level = `${grade}`;
    setSelectedLevel(level);
    setMathLevel(level);
    setLanguage(`math-class-${grade}`);
    setStep('math-courses');
  }

  // --- Course enrollment and finish ---
  async function enrollAndFinish(course: Course) {
    setEnrolling(true);
    try {
      await apiClient.courses.enroll(course.id);
      await updateUser.mutateAsync({ daily_goal: 1 });
    } catch {
      // Best-effort — still complete onboarding on failure
    } finally {
      setCurrentCourse(course.id);
      setDailyGoal(1);
      completeOnboarding();
      setEnrolling(false);
      router.replace('/(tabs)/home');
    }
  }

  // ========== RENDER ==========

  // Step 1: English or Math
  if (step === 'subject') {
    return (
      <SafeAreaView testID="onboarding-subject-screen" style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            What do you want to learn?
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Choose your learning path
          </Text>
        </View>

        <View style={[styles.subjectContainer, { padding: spacing.lg, gap: spacing.base }]}>
          <TouchableOpacity
            testID="subject-english-card"
            activeOpacity={0.8}
            onPress={() => handleSubjectSelect('english')}
          >
            <Card variant="elevated" padding="lg">
              <View style={styles.subjectCard}>
                <View style={[styles.subjectIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={{ fontSize: 48 }}>&#x1F1EC;&#x1F1E7;</Text>
                </View>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.md }]}>
                  English
                </Text>
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  Learn English with interactive exercises
                </Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            testID="subject-math-card"
            activeOpacity={0.8}
            onPress={() => handleSubjectSelect('math')}
          >
            <Card variant="elevated" padding="lg">
              <View style={styles.subjectCard}>
                <View style={[styles.subjectIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={{ fontSize: 48 }}>&#x1F4D0;</Text>
                </View>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.md }]}>
                  Math
                </Text>
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  Video lessons, quizzes & practice
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Math goal
  if (step === 'math-goal') {
    return (
      <SafeAreaView testID="math-category-screen" style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <TouchableOpacity testID="math-category-back-button" onPress={() => setStep('subject')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            What's your goal?
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            We'll personalize your experience
          </Text>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
          {MATH_GOALS.map((goal) => {
            const goalTestIds: Record<string, string> = {
              fundamentals: 'math-category-eyesh',
              sat: 'math-category-sat',
              olympiad: 'math-category-olympiad',
              class: 'math-category-class',
            };
            return (
            <TouchableOpacity
              key={goal.id}
              testID={goalTestIds[goal.id]}
              activeOpacity={0.8}
              onPress={() => handleGoalSelect(goal.id)}
            >
              <Card variant="outlined" padding="md">
                <View style={styles.categoryRow}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: colors.primaryLight + '30' },
                    ]}
                  >
                    <Ionicons
                      name={goal.icon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.base }}>
                    <Text style={[typography.heading3, { color: colors.text }]}>
                      {goal.label}
                    </Text>
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {goal.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </Card>
            </TouchableOpacity>
          );
          })}
        </View>
      </SafeAreaView>
    );
  }

  // Step 3a: Level selection (for fundamentals, SAT, olympiad)
  if (step === 'math-level' && selectedGoal && selectedGoal !== 'class') {
    const levels = getLevelsForGoal(selectedGoal);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => setStep('math-goal')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            What's your current level?
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            {getGoalLabel(selectedGoal)}
          </Text>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1, justifyContent: 'center' }}>
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              activeOpacity={0.8}
              onPress={() => handleLevelSelect(level.id)}
            >
              <Card variant="outlined" padding="lg">
                <View style={styles.levelContent}>
                  <Text style={[typography.heading3, { color: colors.text }]}>
                    {level.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Step 3b: Class selection (1-12)
  if (step === 'class-select') {
    return (
      <SafeAreaView testID="class-select-screen" style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => setStep('math-goal')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            Select Your Class
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            We'll customize content for your grade level
          </Text>
        </View>

        <FlatList
          data={CLASSES}
          numColumns={3}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          columnWrapperStyle={{ gap: spacing.md, marginBottom: spacing.md }}
          bounces={Platform.OS === 'ios'}
          overScrollMode="never"
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`class-grade-${item.grade}`}
              style={{ flex: 1 }}
              activeOpacity={0.8}
              onPress={() => handleClassSelect(item.grade)}
            >
              <Card variant="outlined" padding="md">
                <View style={styles.classCard}>
                  <Text style={[typography.heading2, { color: colors.primary }]}>
                    {item.grade}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Class
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </SafeAreaView>
    );
  }

  // Step 4: Show matching courses
  if (step === 'math-courses') {
    const isLoading = coursesQuery.isLoading;
    const hasMatches = matchingCourses.length > 0;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <TouchableOpacity
            onPress={() =>
              setStep(selectedGoal === 'class' ? 'class-select' : 'math-level')
            }
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Mascot state={hasMatches ? 'happy' : 'thinking'} size="sm" />
          <Text
            style={[
              typography.heading2,
              { color: colors.text, textAlign: 'center', marginTop: spacing.base },
            ]}
          >
            {isLoading ? 'Finding courses...' : hasMatches ? 'Available Courses' : 'Coming Soon!'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : hasMatches ? (
          <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
            {matchingCourses.map((course, index) => (
              <TouchableOpacity
                key={course.id}
                activeOpacity={0.8}
                onPress={() => enrollAndFinish(course)}
                disabled={enrolling}
              >
                <Card
                  variant="outlined"
                  padding="lg"
                  style={index === 0 ? { borderColor: colors.primary, borderWidth: 2 } : undefined}
                >
                  <View>
                    <Text style={[typography.heading3, { color: colors.text }]}>
                      {course.title}
                    </Text>
                    {course.description && (
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.textSecondary, marginTop: spacing.xs },
                        ]}
                      >
                        {course.description}
                      </Text>
                    )}
                    {index === 0 && (
                      <View
                        style={[
                          styles.recommendedBadge,
                          { backgroundColor: colors.primaryLight + '30', marginTop: spacing.sm },
                        ]}
                      >
                        <Text
                          style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}
                        >
                          Recommended
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
            {enrolling && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        ) : (
          <View style={[styles.centered, { padding: spacing.lg }]}>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
              ]}
            >
              We're building {getGoalLabel(selectedGoal!)} courses. In the meantime, try our
              Algebra Basics course!
            </Text>
            {fallbackCourse ? (
              <Button
                variant="primary"
                size="lg"
                onPress={() => enrollAndFinish(fallbackCourse)}
                loading={enrolling}
                fullWidth
              >
                Start {fallbackCourse.title}
              </Button>
            ) : (
              <Text style={[typography.bodySmall, { color: colors.textTertiary, textAlign: 'center' }]}>
                No courses available yet. Check back soon!
              </Text>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Fallback (should not reach here)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 24,
    zIndex: 10,
    padding: 4,
  },
  subjectContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  subjectIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  levelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
