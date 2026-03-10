import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { Lesson, LessonContent } from "@lingualeap/types";

export function useLessonQuery(lessonId: string | null, courseId: string | null) {
  return useQuery<Lesson>({
    queryKey: queryKeys.lessons.detail(lessonId!, courseId!),
    queryFn: () => apiClient.lessons.get(lessonId!, courseId!),
    enabled: !!lessonId && !!courseId,
  });
}

export function useLessonContentQuery(contentUrl: string | null) {
  return useQuery<LessonContent>({
    queryKey: queryKeys.lessons.content(contentUrl ?? ""),
    queryFn: () => apiClient.lessons.fetchContent(contentUrl!),
    enabled: !!contentUrl,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
}
