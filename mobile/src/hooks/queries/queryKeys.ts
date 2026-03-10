export const queryKeys = {
  courses: {
    all: ["courses"] as const,
    detail: (id: string) => ["courses", id] as const,
  },
  lessons: {
    detail: (id: string, courseId: string) => ["lessons", id, courseId] as const,
    content: (id: string) => ["lessons", "content", id] as const,
  },
  progress: {
    summary: ["progress", "summary"] as const,
    course: (courseId: string) => ["progress", "course", courseId] as const,
  },
  review: {
    next: (courseId?: string) => ["review", "next", courseId] as const,
  },
  streak: {
    me: ["streak", "me"] as const,
  },
  user: {
    profile: ["user", "profile"] as const,
  },
  videoLessons: {
    all: ["videoLessons"] as const,
    detail: (id: string) => ["videoLessons", id] as const,
  },
  admin: {
    users: (role?: string) => ["admin", "users", role] as const,
    videoLessons: (courseId?: string) => ["admin", "videoLessons", courseId] as const,
    courses: ["admin", "courses"] as const,
  },
} as const;
