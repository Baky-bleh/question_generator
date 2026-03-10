import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { StreakInfo } from "@lingualeap/types";

export function useStreakQuery() {
  return useQuery<StreakInfo>({
    queryKey: queryKeys.streak.me,
    queryFn: () => apiClient.streaks.getMe(),
  });
}
