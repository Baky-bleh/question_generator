import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type {
  AdminUserListResponse,
  UserSummary,
  UserRole,
  UserRoleUpdateRequest,
  CourseCreateRequest,
  CourseOut,
  VideoLessonListResponse,
  VideoLessonCreateRequest,
  VideoLessonUpdateRequest,
  VideoLessonOut,
  VideoUploadResponse,
} from "@lingualeap/types";

// --- User management hooks ---

export function useAdminUsersQuery(role?: UserRole, offset?: number, limit?: number) {
  return useQuery<AdminUserListResponse>({
    queryKey: queryKeys.admin.users(role),
    queryFn: () => apiClient.admin.listUsers(role, offset, limit),
  });
}

interface UpdateUserRoleVars {
  userId: string;
  data: UserRoleUpdateRequest;
}

export function useUpdateUserRoleMutation() {
  const qc = useQueryClient();

  return useMutation<UserSummary, Error, UpdateUserRoleVars>({
    mutationFn: ({ userId, data }) => apiClient.admin.updateUserRole(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// --- Course management hooks ---

export function useAdminCreateCourseMutation() {
  const qc = useQueryClient();

  return useMutation<CourseOut, Error, CourseCreateRequest>({
    mutationFn: (data) => apiClient.admin.createCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.courses });
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

// --- Video lesson management hooks ---

export function useAdminVideoLessonsQuery(courseId?: string, offset?: number, limit?: number) {
  return useQuery<VideoLessonListResponse>({
    queryKey: queryKeys.admin.videoLessons(courseId),
    queryFn: () => apiClient.admin.listVideoLessons(courseId, offset, limit),
  });
}

export function useCreateVideoLessonMutation() {
  const qc = useQueryClient();

  return useMutation<VideoLessonOut, Error, VideoLessonCreateRequest>({
    mutationFn: (data) => apiClient.admin.createVideoLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "videoLessons"] });
    },
  });
}

export function useUpdateVideoLessonMutation() {
  const qc = useQueryClient();

  return useMutation<VideoLessonOut, Error, { id: string; data: VideoLessonUpdateRequest }>({
    mutationFn: ({ id, data }) => apiClient.admin.updateVideoLesson(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "videoLessons"] });
    },
  });
}

export function useDeleteVideoLessonMutation() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.admin.deleteVideoLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "videoLessons"] });
    },
  });
}

// --- File upload hooks ---

export function useUploadVideoMutation() {
  return useMutation<VideoUploadResponse, Error, FormData>({
    mutationFn: (formData) => apiClient.admin.uploadVideo(formData),
  });
}

export function useUploadThumbnailMutation() {
  return useMutation<VideoUploadResponse, Error, FormData>({
    mutationFn: (formData) => apiClient.admin.uploadThumbnail(formData),
  });
}
