import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { ProgressSummary, CourseProgress } from "@lingualeap/types";

export function useProgressQuery() {
  return useQuery<ProgressSummary>({
    queryKey: queryKeys.progress.summary,
    queryFn: () => apiClient.progress.getSummary(),
  });
}

export function useCourseProgressQuery(courseId: string | null) {
  return useQuery<CourseProgress>({
    queryKey: queryKeys.progress.course(courseId!),
    queryFn: () => apiClient.progress.getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}
