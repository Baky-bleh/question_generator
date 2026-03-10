import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { queryKeys } from "./queryKeys";
import type { Course, CourseDetail } from "@lingualeap/types";

export function useCoursesQuery() {
  return useQuery<Course[]>({
    queryKey: queryKeys.courses.all,
    queryFn: async () => {
      const response = await apiClient.courses.list();
      return response.courses;
    },
  });
}

export function useCourseDetailQuery(courseId: string | null) {
  return useQuery<CourseDetail>({
    queryKey: queryKeys.courses.detail(courseId!),
    queryFn: () => apiClient.courses.getDetail(courseId!),
    enabled: !!courseId,
  });
}
