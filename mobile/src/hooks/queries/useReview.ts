import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { ReviewNextResponse, ReviewSubmitResponse } from "@lingualeap/types";

export function useSRSQuery(courseId?: string, limit?: number) {
  return useQuery<ReviewNextResponse>({
    queryKey: queryKeys.review.next(courseId),
    queryFn: () => apiClient.review.getNext(courseId, limit),
  });
}

export function useSubmitReviewMutation() {
  const qc = useQueryClient();

  return useMutation<ReviewSubmitResponse, Error, { conceptId: string; quality: number }>({
    mutationFn: ({ conceptId, quality }) =>
      apiClient.review.submit({ concept_id: conceptId, quality }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review"] });
    },
  });
}
