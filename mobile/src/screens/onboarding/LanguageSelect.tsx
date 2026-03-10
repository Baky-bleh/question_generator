import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';

type Step = 'subject' | 'math-category' | 'class-select';

interface MathCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const MATH_CATEGORIES: MathCategory[] = [
  { id: 'sat', name: 'SAT Prep', icon: 'school', description: 'SAT math preparation' },
  { id: 'olympiad', name: 'Olympiad', icon: 'trophy', description: 'Math competitions' },
  { id: 'eyesh', name: 'EYESH', icon: 'ribbon', description: 'National exam prep' },
  { id: 'class', name: 'Class 1-12', icon: 'library', description: 'School curriculum' },
];

const CLASSES = Array.from({ length: 12 }, (_, i) => ({
  id: `class-${i + 1}`,
  name: `Class ${i + 1}`,
  grade: i + 1,
}));

export default function LanguageSelect() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [step, setStep] = useState<Step>('subject');
  const [selected, setSelected] = useState<string | null>(null);

  function handleSubjectSelect(subject: 'english' | 'math') {
    if (subject === 'english') {
      setSelected('english');
      setLanguage('english');
      router.push('/(onboarding)/goal');
    } else {
      setStep('math-category');
    }
  }

  function handleMathCategory(categoryId: string) {
    if (categoryId === 'class') {
      setStep('class-select');
    } else {
      setSelected(categoryId);
      setLanguage(`math-${categoryId}`);
      router.push('/(onboarding)/goal');
    }
  }

  function handleClassSelect(grade: number) {
    setSelected(`class-${grade}`);
    setLanguage(`math-class-${grade}`);
    router.push('/(onboarding)/goal');
  }

  // Step 1: English or Math
  if (step === 'subject') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            What do you want to learn?
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            Choose your learning path
          </Text>
        </View>

        <View style={[styles.subjectContainer, { padding: spacing.lg, gap: spacing.base }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSubjectSelect('english')}
          >
            <Card variant="elevated" padding="lg">
              <View style={styles.subjectCard}>
                <View style={[styles.subjectIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={{ fontSize: 48 }}>🇬🇧</Text>
                </View>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.md }]}>
                  English
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  Learn English with interactive exercises
                </Text>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSubjectSelect('math')}
          >
            <Card variant="elevated" padding="lg">
              <View style={styles.subjectCard}>
                <View style={[styles.subjectIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={{ fontSize: 48 }}>📐</Text>
                </View>
                <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.md }]}>
                  Math
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  Video lessons, quizzes & practice
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: Math categories
  if (step === 'math-category') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => setStep('subject')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
            Choose Math Track
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            Select your math learning goal
          </Text>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
          {MATH_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => handleMathCategory(cat.id)}
            >
              <Card variant="outlined" padding="md">
                <View style={styles.categoryRow}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight + '30' }]}>
                    <Ionicons name={cat.icon as any} size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.base }}>
                    <Text style={[typography.heading3, { color: colors.text }]}>
                      {cat.name}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                      {cat.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Step 3: Class selection (1-12)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { padding: spacing.lg }]}>
        <TouchableOpacity onPress={() => setStep('math-category')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.heading2, { color: colors.text, textAlign: 'center' }]}>
          Select Your Class
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
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
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => handleClassSelect(item.grade)}
          >
            <Card variant="outlined" padding="md">
              <View style={styles.classCard}>
                <Text style={[typography.heading2, { color: colors.primary }]}>
                  {item.grade}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
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
});
