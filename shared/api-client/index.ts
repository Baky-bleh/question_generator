import type {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  OAuthRequest,
  LogoutRequest,
  TokenResponse,
  RefreshResponse,
  OAuthProvider,
  UserProfileResponse,
  UserUpdateRequest,
  CourseListResponse,
  CourseDetail,
  EnrollResponse,
  Lesson,
  ExerciseSubmitRequest,
  ExerciseSubmitResponse,
  LessonCompleteRequest,
  LessonCompleteResponse,
  ProgressSummary,
  CourseProgress,
  ReviewNextResponse,
  ReviewSubmitRequest,
  ReviewSubmitResponse,
  StreakInfo,
  LessonContent,
  VideoLessonDetailResponse,
  VideoProgressUpdateRequest,
  VideoProgressResponse,
  AdminUserListResponse,
  UserSummary,
  UserRoleUpdateRequest,
  CourseCreateRequest,
  CourseOut,
  VideoLessonCreateRequest,
  VideoLessonUpdateRequest,
  VideoLessonOut,
  VideoLessonListResponse,
  VideoUploadResponse,
  UserRole,
} from "@lingualeap/types";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<void>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export function createApiClient(config: ApiClientConfig) {
  let isRefreshing = false;

  function buildUrl(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): string {
    let url = `${config.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  async function doFetch(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string,
  ): Promise<Response> {
    return fetch(url, { method, headers, body });
  }

  async function request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      auth?: boolean;
    },
  ): Promise<T> {
    const { body, query, auth = true } = options ?? {};

    const url = buildUrl(path, query);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (auth) {
      const token = await config.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const serializedBody = body ? JSON.stringify(body) : undefined;
    let response = await doFetch(url, method, headers, serializedBody);

    if (response.status === 401 && auth && !isRefreshing) {
      isRefreshing = true;
      try {
        await config.onUnauthorized();
        // Retry with refreshed token
        const newToken = await config.getAccessToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await doFetch(url, method, headers, serializedBody);
        }
      } finally {
        isRefreshing = false;
      }
    }

    if (response.status === 401) {
      throw new ApiError(401, "Unauthorized");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new ApiError(response.status, errorBody.detail ?? "Unknown error");
    }

    return response.json() as Promise<T>;
  }

  async function requestFormData<T>(
    method: string,
    path: string,
    formData: FormData,
  ): Promise<T> {
    const url = `${config.baseUrl}${path}`;

    const headers: Record<string, string> = {};
    const token = await config.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(url, { method, headers, body: formData });

    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        await config.onUnauthorized();
        const newToken = await config.getAccessToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(url, { method, headers, body: formData });
        }
      } finally {
        isRefreshing = false;
      }
    }

    if (response.status === 401) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new ApiError(response.status, errorBody.detail ?? "Unknown error");
    }

    return response.json() as Promise<T>;
  }

  return {
    auth: {
      register: (data: RegisterRequest) =>
        request<TokenResponse>("POST", "/api/v1/auth/register", { body: data, auth: false }),

      login: (data: LoginRequest) =>
        request<TokenResponse>("POST", "/api/v1/auth/login", { body: data, auth: false }),

      refresh: (data: RefreshRequest) =>
        request<RefreshResponse>("POST", "/api/v1/auth/refresh", { body: data, auth: false }),

      oauth: (provider: OAuthProvider, data: OAuthRequest) =>
        request<TokenResponse>("POST", `/api/v1/auth/oauth/${provider}`, {
          body: data,
          auth: false,
        }),

      logout: (data: LogoutRequest) =>
        request<void>("POST", "/api/v1/auth/logout", { body: data }),
    },

    users: {
      getMe: () => request<UserProfileResponse>("GET", "/api/v1/users/me"),

      updateMe: (data: UserUpdateRequest) =>
        request<UserProfileResponse>("PATCH", "/api/v1/users/me", { body: data }),
    },

    courses: {
      list: () => request<CourseListResponse>("GET", "/api/v1/courses"),

      getDetail: (courseId: string) =>
        request<CourseDetail>("GET", `/api/v1/courses/${courseId}`),

      enroll: (courseId: string) =>
        request<EnrollResponse>("POST", `/api/v1/courses/${courseId}/enroll`),
    },

    lessons: {
      get: (lessonId: string, courseId: string) =>
        request<Lesson>("GET", `/api/v1/lessons/${lessonId}`, {
          query: { course_id: courseId },
        }),

      submit: (lessonId: string, courseId: string, data: ExerciseSubmitRequest) =>
        request<ExerciseSubmitResponse>("POST", `/api/v1/lessons/${lessonId}/submit`, {
          body: data,
          query: { course_id: courseId },
        }),

      complete: (lessonId: string, courseId: string, data: LessonCompleteRequest) =>
        request<LessonCompleteResponse>("POST", `/api/v1/lessons/${lessonId}/complete`, {
          body: data,
          query: { course_id: courseId },
        }),

      fetchContent: async (contentUrl: string): Promise<LessonContent> => {
        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new ApiError(response.status, "Failed to fetch lesson content");
        }
        return response.json() as Promise<LessonContent>;
      },
    },

    progress: {
      getSummary: () => request<ProgressSummary>("GET", "/api/v1/progress/me"),

      getCourseProgress: (courseId: string) =>
        request<CourseProgress>("GET", `/api/v1/progress/me/course/${courseId}`),
    },

    review: {
      getNext: (courseId?: string, limit?: number) =>
        request<ReviewNextResponse>("GET", "/api/v1/review/next", {
          query: { course_id: courseId, limit },
        }),

      submit: (data: ReviewSubmitRequest) =>
        request<ReviewSubmitResponse>("POST", "/api/v1/review/submit", { body: data }),
    },

    streaks: {
      getMe: () => request<StreakInfo>("GET", "/api/v1/streaks/me"),
    },

    videoLessons: {
      get: (id: string) =>
        request<VideoLessonDetailResponse>("GET", `/api/v1/video-lessons/${id}`),

      updateProgress: (id: string, data: VideoProgressUpdateRequest) =>
        request<VideoProgressResponse>("POST", `/api/v1/video-lessons/${id}/progress`, {
          body: data,
        }),

      getQuiz: (id: string) =>
        request<LessonContent>("GET", `/api/v1/video-lessons/${id}/quiz`),
    },

    admin: {
      listUsers: (role?: UserRole, offset?: number, limit?: number) =>
        request<AdminUserListResponse>("GET", "/api/v1/admin/users", {
          query: { role, offset, limit },
        }),

      updateUserRole: (userId: string, data: UserRoleUpdateRequest) =>
        request<UserSummary>("PATCH", `/api/v1/admin/users/${userId}/role`, {
          body: data,
        }),

      createCourse: (data: CourseCreateRequest) =>
        request<CourseOut>("POST", "/api/v1/admin/courses", { body: data }),

      listVideoLessons: (courseId?: string, offset?: number, limit?: number) =>
        request<VideoLessonListResponse>("GET", "/api/v1/admin/video-lessons", {
          query: { course_id: courseId, offset, limit },
        }),

      createVideoLesson: (data: VideoLessonCreateRequest) =>
        request<VideoLessonOut>("POST", "/api/v1/admin/video-lessons", { body: data }),

      updateVideoLesson: (id: string, data: VideoLessonUpdateRequest) =>
        request<VideoLessonOut>("PATCH", `/api/v1/admin/video-lessons/${id}`, {
          body: data,
        }),

      deleteVideoLesson: (id: string) =>
        request<void>("DELETE", `/api/v1/admin/video-lessons/${id}`),

      uploadVideo: (formData: FormData) =>
        requestFormData<VideoUploadResponse>("POST", "/api/v1/admin/upload/video", formData),

      uploadThumbnail: (formData: FormData) =>
        requestFormData<VideoUploadResponse>("POST", "/api/v1/admin/upload/thumbnail", formData),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
