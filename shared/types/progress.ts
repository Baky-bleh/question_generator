export interface XPBreakdown {
  base: number;
  perfect_bonus: number;
  streak_bonus: number;
  speed_bonus: number;
  total: number;
}

export interface LessonCompleteRequest {
  score: number;
  time_seconds: number;
  mistakes: number;
  perfect: boolean;
}

export interface LessonCompleteResponse {
  xp_earned: number;
  xp_breakdown: XPBreakdown;
  streak: { current: number; is_new_record: boolean };
  achievements_unlocked: string[];
  next_lesson: { id: string; title: string } | null;
}

export interface TodayProgress {
  lessons_completed: number;
  xp_earned: number;
  goal_met: boolean;
}

export interface CourseProgressSummary {
  course_id: string;
  title: string;
  progress: number;
  current_streak: number;
}

export interface ProgressSummary {
  total_xp: number;
  level: number;
  courses: CourseProgressSummary[];
  today: TodayProgress;
}

export interface CourseProgress {
  course_id: string;
  units_completed: number;
  units_total: number;
  lessons_completed: number;
  lessons_total: number;
  total_xp_in_course: number;
  words_learned: number;
  time_spent_minutes: number;
}
