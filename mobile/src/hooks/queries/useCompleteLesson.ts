import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import { useProgressStore } from "@/stores/progressStore";
import type { LessonCompleteRequest, LessonCompleteResponse } from "@lingualeap/types";

interface CompleteLessonVars {
  lessonId: string;
  courseId: string;
  body: LessonCompleteRequest;
}

export function useCompleteLessonMutation() {
  const qc = useQueryClient();
  const addXP = useProgressStore((s) => s.addXP);

  return useMutation<LessonCompleteResponse, Error, CompleteLessonVars>({
    mutationFn: ({ lessonId, courseId, body }) =>
      apiClient.lessons.complete(lessonId, courseId, body),
    onSuccess: (data, variables) => {
      addXP(data.xp_earned);
      qc.invalidateQueries({ queryKey: queryKeys.progress.summary });
      qc.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.courseId) });
      qc.invalidateQueries({ queryKey: queryKeys.streak.me });
    },
  });
}
