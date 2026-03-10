export const XP_PER_CORRECT_ANSWER = 2;
export const XP_BASE_LESSON = 10;
export const XP_PERFECT_BONUS = 5;
export const MAX_STREAK_BONUS = 7;
export const MAX_HEARTS = 5;
export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20];
export const DEFAULT_DAILY_GOAL = 10;

// Video
export const VIDEO_PROGRESS_REPORT_INTERVAL_MS = 30_000;
export const DEFAULT_WATCH_THRESHOLD_PERCENT = 80;

// Admin
export const ADMIN_USERS_PAGE_SIZE = 50;
export const ADMIN_VIDEO_LESSONS_PAGE_SIZE = 50;
export const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;
export const MAX_THUMBNAIL_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// Roles
export const USER_ROLES = ["student", "teacher", "admin"] as const;
