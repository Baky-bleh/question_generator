export interface Course {
  id: string;
  language_from: string;
  language_to: string;
  title: string;
  description: string | null;
  total_units: number;
  thumbnail_url: string | null;
  content_version: string;
  course_type: "language" | "math";
  content_mode: "exercise" | "video_quiz";
}

export interface CourseListResponse {
  courses: Course[];
}

export interface LessonSummary {
  id: string;
  order: number;
  title: string;
  type: "standard" | "review" | "checkpoint" | "video";
  status: "locked" | "available" | "completed";
  best_score: number | null;
  exercise_count: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  watch_percent?: number;
  quiz_unlocked?: boolean;
  quiz_id?: string;
}

export interface Unit {
  order: number;
  title: string;
  lessons: LessonSummary[];
}

export interface Enrollment {
  enrolled_at: string;
  current_unit: number;
  current_lesson: number;
  overall_progress: number;
}

export interface CourseDetail {
  id: string;
  title: string;
  units: Unit[];
  enrollment: Enrollment | null;
}

export interface EnrollResponse {
  enrollment_id: string;
  enrolled_at: string;
}
