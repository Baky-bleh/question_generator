import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type {
  VideoLessonDetailResponse,
  VideoProgressUpdateRequest,
  VideoProgressResponse,
} from "@lingualeap/types";

export function useVideoLessonQuery(id: string | null) {
  return useQuery<VideoLessonDetailResponse>({
    queryKey: queryKeys.videoLessons.detail(id!),
    queryFn: () => apiClient.videoLessons.get(id!),
    enabled: !!id,
  });
}

export function useVideoProgressMutation(videoLessonId: string) {
  const queryClient = useQueryClient();

  return useMutation<VideoProgressResponse, Error, VideoProgressUpdateRequest>({
    mutationFn: (data) => apiClient.videoLessons.updateProgress(videoLessonId, data),
    onSuccess: (response) => {
      queryClient.setQueryData<VideoLessonDetailResponse>(
        queryKeys.videoLessons.detail(videoLessonId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            progress: {
              watch_percent: response.watch_percent,
              last_position_seconds: response.last_position_seconds,
              completed: response.completed,
              completed_at: old.progress?.completed_at ?? null,
            },
            quiz_unlocked: response.quiz_unlocked,
          };
        },
      );
    },
  });
}
