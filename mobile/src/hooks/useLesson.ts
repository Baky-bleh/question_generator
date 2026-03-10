import { useLessonQuery, useLessonContentQuery } from "@/hooks/queries/useLesson";
import type { Exercise } from "@lingualeap/types";

interface UseLessonResult {
  lesson: { id: string; title: string; exerciseCount: number; estimatedMinutes: number } | null;
  exercises: Exercise[];
  isLoading: boolean;
  error: Error | null;
}

export function useLesson(lessonId: string | null, courseId: string | null): UseLessonResult {
  const lessonQuery = useLessonQuery(lessonId, courseId);
  const contentQuery = useLessonContentQuery(lessonQuery.data?.content_url ?? null);

  const lesson = lessonQuery.data
    ? {
        id: lessonQuery.data.id,
        title: lessonQuery.data.title,
        exerciseCount: lessonQuery.data.exercise_count,
        estimatedMinutes: lessonQuery.data.estimated_minutes,
      }
    : null;

  const exercises = contentQuery.data?.exercises ?? [];

  return {
    lesson,
    exercises,
    isLoading: lessonQuery.isLoading || contentQuery.isLoading,
    error: (lessonQuery.error as Error | null) ?? (contentQuery.error as Error | null),
  };
}
