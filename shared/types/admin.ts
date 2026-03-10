export type UserRole = "student" | "teacher" | "admin";

export interface UserSummary {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export interface UserListResponse {
  users: UserSummary[];
  total: number;
}

export interface UserRoleUpdateRequest {
  role: UserRole;
}

export interface VideoLessonCreateRequest {
  id: string;
  course_id: string;
  unit_order: number;
  lesson_order: number;
  title: string;
  description?: string | null;
  video_url: string;
  video_duration_seconds: number;
  thumbnail_url?: string | null;
  teacher_name?: string | null;
  quiz_id?: string | null;
  watch_threshold_percent?: number;
}

export interface VideoLessonUpdateRequest {
  title?: string | null;
  description?: string | null;
  video_url?: string | null;
  video_duration_seconds?: number | null;
  thumbnail_url?: string | null;
  teacher_name?: string | null;
  quiz_id?: string | null;
  watch_threshold_percent?: number | null;
}

export interface VideoLessonOut {
  id: string;
  course_id: string;
  unit_order: number;
  lesson_order: number;
  title: string;
  description: string | null;
  video_url: string;
  video_duration_seconds: number;
  thumbnail_url: string | null;
  teacher_name: string | null;
  quiz_id: string | null;
  watch_threshold_percent: number;
  created_at: string;
}

export interface VideoLessonListResponse {
  video_lessons: VideoLessonOut[];
  total: number;
}

export interface CourseCreateRequest {
  language_from: string;
  language_to: string;
  title: string;
  description?: string | null;
  course_type?: "language" | "math";
  content_mode?: "exercise" | "video_quiz";
  total_units: number;
  total_lessons?: number;
  content_version?: string;
  is_published?: boolean;
}

export interface CourseOut {
  id: string;
  language_from: string;
  language_to: string;
  title: string;
  description: string | null;
  course_type: string;
  content_mode: string;
  total_units: number;
  total_lessons: number;
  content_version: string;
  is_published: boolean;
  created_at: string;
}

export interface VideoUploadResponse {
  filename: string;
  url: string;
  size_bytes: number;
}
