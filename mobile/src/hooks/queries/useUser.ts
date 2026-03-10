import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { UserProfileResponse, UserUpdateRequest } from "@lingualeap/types";

export function useUserProfileQuery() {
  return useQuery<UserProfileResponse>({
    queryKey: queryKeys.user.profile,
    queryFn: () => apiClient.users.getMe(),
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();

  return useMutation<UserProfileResponse, Error, UserUpdateRequest>({
    mutationFn: (data) => apiClient.users.updateMe(data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.user.profile, data);
    },
  });
}
