import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import type { ExerciseSubmitRequest, ExerciseSubmitResponse } from "@lingualeap/types";

interface SubmitAnswerVars {
  lessonId: string;
  courseId: string;
  body: ExerciseSubmitRequest;
}

export function useSubmitAnswerMutation() {
  return useMutation<ExerciseSubmitResponse, Error, SubmitAnswerVars>({
    mutationFn: ({ lessonId, courseId, body }) =>
      apiClient.lessons.submit(lessonId, courseId, body),
  });
}
