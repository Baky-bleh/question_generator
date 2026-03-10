export interface VideoLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_duration_seconds: number;
  thumbnail_url: string | null;
  teacher_name: string | null;
  quiz_id: string | null;
  watch_threshold_percent: number;
}

export interface VideoProgress {
  watch_percent: number;
  last_position_seconds: number;
  completed: boolean;
  completed_at: string | null;
}

export interface VideoLessonDetailResponse {
  video_lesson: VideoLesson;
  progress: VideoProgress | null;
  quiz_unlocked: boolean;
}

export interface VideoProgressUpdateRequest {
  position_seconds: number;
  watch_percent: number;
}

export interface VideoProgressResponse {
  watch_percent: number;
  last_position_seconds: number;
  completed: boolean;
  quiz_unlocked: boolean;
}
