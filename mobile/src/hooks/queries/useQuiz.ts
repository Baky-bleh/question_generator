import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { ApiError } from "@lingualeap/api-client";
import { queryKeys } from "./queryKeys";
import type { Exercise } from "@lingualeap/types";

interface UseQuizResult {
  exercises: Exercise[] | null;
  isLocked: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useQuizQuery(videoLessonId: string | null): UseQuizResult {
  const query = useQuery({
    queryKey: [...queryKeys.videoLessons.detail(videoLessonId!), "quiz"] as const,
    queryFn: async () => {
      try {
        const content = await apiClient.videoLessons.getQuiz(videoLessonId!);
        return { exercises: content.exercises, isLocked: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          return { exercises: null, isLocked: true };
        }
        throw err;
      }
    },
    enabled: !!videoLessonId,
  });

  return {
    exercises: query.data?.exercises ?? null,
    isLocked: query.data?.isLocked ?? false,
    isLoading: query.isLoading,
    error: query.error,
  };
}
