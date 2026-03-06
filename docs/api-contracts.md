# API Contracts

> Last synced: Phase 1 (Backend Core) — 2026-03-05
> This document is the source of truth for all API endpoints.
> Mobile and Web teams: read this before writing any API call.
> Backend team: update this (via CHANGELOG_ENTRY) when adding/changing endpoints.

## Base URL

- Local: `http://localhost:8000`
- Staging: `https://api-staging.lingualeap.app`
- Production: `https://api.lingualeap.app`

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```
Access tokens expire after 15 minutes (configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`). Use the refresh endpoint to get new ones.

---

## Auth Endpoints

Router: `src/auth/router.py` — prefix `/api/v1/auth`

### `POST /api/v1/auth/register`
Create a new account.
- **Auth**: None
- **Rate limited**: Yes (via `rate_limit_auth` dependency)
- **Request** (`RegisterRequest`):
  ```json
  {
    "email": "string (EmailStr)",
    "password": "string (min 8, max 128)",
    "display_name": "string (min 1, max 100)"
  }
  ```
- **Response** `201` (`TokenResponse`):
  ```json
  {
    "user_id": "uuid",
    "email": "string",
    "display_name": "string",
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 900
  }
  ```
- **Errors**: `409 email already exists` | `422 validation error`

### `POST /api/v1/auth/login`
Login with email/password.
- **Auth**: None
- **Rate limited**: Yes
- **Request** (`LoginRequest`):
  ```json
  { "email": "string (EmailStr)", "password": "string" }
  ```
- **Response** `200` (`TokenResponse`): Same as register response
- **Errors**: `401 invalid credentials`

### `POST /api/v1/auth/refresh`
Get new access token using refresh token.
- **Auth**: None
- **Request** (`RefreshRequest`):
  ```json
  { "refresh_token": "string" }
  ```
- **Response** `200` (`RefreshResponse`):
  ```json
  { "access_token": "string", "expires_in": 900 }
  ```
- **Errors**: `401 invalid or expired refresh token`

### `POST /api/v1/auth/oauth/{provider}`
OAuth login (google, apple). Creates account if first login.
- **Auth**: None
- **Rate limited**: Yes
- **Path params**: `provider` — string (`google` | `apple`)
- **Request** (`OAuthRequest`):
  ```json
  { "id_token": "string" }
  ```
- **Response** `200` (`TokenResponse`): Same as register response

### `POST /api/v1/auth/logout`
Revoke refresh token.
- **Auth**: Required
- **Request** (`LogoutRequest`):
  ```json
  { "refresh_token": "string" }
  ```
- **Response** `204`: No content

---

## User Profile Endpoints

Router: `src/auth/router.py` (users_router) — prefix `/api/v1/users`

### `GET /api/v1/users/me`
Get current user's profile.
- **Auth**: Required
- **Response** `200` (`UserProfileResponse`):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "display_name": "string",
    "avatar_url": "string | null",
    "timezone": "string",
    "daily_goal": 10,
    "created_at": "datetime"
  }
  ```

### `PATCH /api/v1/users/me`
Update current user's profile. Partial update — only provided fields change.
- **Auth**: Required
- **Request** (`UserUpdateRequest`):
  ```json
  {
    "display_name": "string (optional, 1-100 chars)",
    "avatar_url": "string | null (optional)",
    "timezone": "string (optional, max 50 chars)",
    "daily_goal": "int (optional, 1-120)"
  }
  ```
- **Response** `200` (`UserProfileResponse`): Same as GET response with updated values

---

## Course Endpoints

Router: `src/courses/router.py` — prefix `/api/v1/courses`

### `GET /api/v1/courses`
List all available courses.
- **Auth**: Required
- **Response** `200` (`CourseListResponse`):
  ```json
  {
    "courses": [
      {
        "id": "uuid",
        "language_from": "en",
        "language_to": "es",
        "title": "Spanish for English Speakers",
        "description": "string | null",
        "total_units": 20,
        "thumbnail_url": "string | null",
        "content_version": "v1.2.3"
      }
    ]
  }
  ```

### `GET /api/v1/courses/{course_id}`
Get course detail with units, lessons, and user progress.
- **Auth**: Required
- **Path params**: `course_id` — UUID
- **Response** `200` (`CourseDetailResponse`):
  ```json
  {
    "id": "uuid",
    "title": "string",
    "units": [
      {
        "order": 1,
        "title": "Basics 1",
        "lessons": [
          {
            "id": "string",
            "order": 1,
            "title": "Greetings",
            "type": "standard | review | checkpoint",
            "status": "locked | available | completed",
            "best_score": 95,
            "exercise_count": 10
          }
        ]
      }
    ],
    "enrollment": {
      "enrolled_at": "datetime",
      "current_unit": 3,
      "current_lesson": 2,
      "overall_progress": 0.35
    }
  }
  ```
- **Notes**: `enrollment` is `null` if user is not enrolled. `status` is computed from user progress.

### `POST /api/v1/courses/{course_id}/enroll`
Enroll current user in a course.
- **Auth**: Required
- **Path params**: `course_id` — UUID
- **Response** `201` (`EnrollResponse`):
  ```json
  { "enrollment_id": "uuid", "enrolled_at": "datetime" }
  ```
- **Errors**: `409 already enrolled`

---

## Lesson Endpoints

Router: `src/lessons/router.py` — prefix `/api/v1/lessons`

### `GET /api/v1/lessons/{lesson_id}`
Get lesson metadata and content URL.
- **Auth**: Required
- **Path params**: `lesson_id` — string (not UUID; matches content JSON IDs)
- **Query params**: `course_id` — UUID (required)
- **Response** `200` (`LessonOut`):
  ```json
  {
    "id": "string",
    "title": "Greetings",
    "content_url": "string (S3/local URL to lesson JSON)",
    "exercise_count": 10,
    "estimated_minutes": 5
  }
  ```
- **Notes**: `content_url` points to S3 or local content. Client downloads and caches this JSON containing full exercise data.

### `POST /api/v1/lessons/{lesson_id}/submit`
Submit a single exercise answer for server-side validation.
- **Auth**: Required
- **Path params**: `lesson_id` — string
- **Query params**: `course_id` — UUID (required)
- **Request** (`ExerciseSubmitRequest`):
  ```json
  {
    "exercise_id": "string",
    "answer": "string | string[]",
    "time_seconds": 0
  }
  ```
- **Response** `200` (`ExerciseSubmitResponse`):
  ```json
  {
    "correct": true,
    "correct_answer": "string",
    "explanation": "string | null",
    "xp_earned": 2
  }
  ```
- **Notes**: Server validates answer using exercise-type-specific validators (6 types: multiple_choice, fill_blank, matching, listening, word_arrange, translation).

---

## Progress Endpoints

Router: `src/progress/router.py` — prefix `/api/v1`

**Note**: The progress router uses prefix `/api/v1` (not `/api/v1/progress`) because it also hosts the lesson complete endpoint.

### `POST /api/v1/lessons/{lesson_id}/complete`
Mark lesson as completed. Called after last exercise.
- **Auth**: Required
- **Path params**: `lesson_id` — string
- **Query params**: `course_id` — UUID (required)
- **Request** (`LessonCompleteRequest`):
  ```json
  {
    "score": 95,
    "time_seconds": 180,
    "mistakes": 1,
    "perfect": false
  }
  ```
  - `score`: 0-100 (required)
  - `time_seconds`: >0 (required)
  - `mistakes`: >=0 (required)
  - `perfect`: bool (required)
- **Response** `200` (`LessonCompleteResponse`):
  ```json
  {
    "xp_earned": 15,
    "xp_breakdown": {
      "base": 10,
      "perfect_bonus": 0,
      "streak_bonus": 3,
      "speed_bonus": 2,
      "total": 15
    },
    "streak": { "current": 7, "is_new_record": false },
    "achievements_unlocked": [],
    "next_lesson": { "id": "string", "title": "string" }
  }
  ```
- **Notes**: XP breakdown includes base (10), perfect_bonus (5 if score==100), streak_bonus (min of streak count, 7), speed_bonus (0-3 based on time ratio).

### `GET /api/v1/progress/me`
Get current user's overall progress summary.
- **Auth**: Required
- **Response** `200` (`ProgressSummaryResponse`):
  ```json
  {
    "total_xp": 1250,
    "level": 8,
    "courses": [
      { "course_id": "uuid", "title": "string", "progress": 0.35, "current_streak": 7 }
    ],
    "today": { "lessons_completed": 2, "xp_earned": 30, "goal_met": true }
  }
  ```

### `GET /api/v1/progress/me/course/{course_id}`
Get detailed progress for a specific course.
- **Auth**: Required
- **Path params**: `course_id` — UUID
- **Response** `200` (`CourseProgressResponse`):
  ```json
  {
    "course_id": "uuid",
    "units_completed": 2,
    "units_total": 20,
    "lessons_completed": 15,
    "lessons_total": 100,
    "total_xp_in_course": 450,
    "words_learned": 120,
    "time_spent_minutes": 300
  }
  ```

---

## SRS / Review Endpoints

Router: `src/srs/router.py` — prefix `/api/v1/review`

### `GET /api/v1/review/next`
Get next batch of items due for review (spaced repetition).
- **Auth**: Required
- **Query params**:
  - `course_id` — UUID (optional, filter by course)
  - `limit` — int 1-100 (default 20)
- **Response** `200` (`ReviewNextResponse`):
  ```json
  {
    "items": [
      {
        "concept_id": "string",
        "concept_type": "vocabulary | grammar",
        "content_url": "string",
        "ease_factor": 2.5,
        "interval_days": 3,
        "review_count": 5
      }
    ],
    "total_due": 35
  }
  ```

### `POST /api/v1/review/submit`
Submit review result for SRS update (SM-2 algorithm).
- **Auth**: Required
- **Request** (`ReviewSubmitRequest`):
  ```json
  { "concept_id": "string", "quality": 3 }
  ```
  - `quality`: 0-5 (SM-2 scale: 0=total failure, 5=perfect recall)
- **Response** `200` (`ReviewSubmitResponse`):
  ```json
  {
    "new_interval_days": 7,
    "new_ease_factor": 2.6,
    "next_review_at": "datetime"
  }
  ```

---

## Streak Endpoints

Router: `src/streaks/router.py` — prefix `/api/v1/streaks`

### `GET /api/v1/streaks/me`
Get current user's streak info.
- **Auth**: Required
- **Response** `200` (`StreakResponse`):
  ```json
  {
    "current": 7,
    "longest": 23,
    "today_completed": true,
    "freeze_available": true,
    "freeze_remaining": 2
  }
  ```

---

## Not Yet Implemented

The following endpoints from the original design are **not yet built** (planned for future phases):

- `GET /api/v1/leaderboard/weekly` — Leaderboard rankings (Phase 5: Gamification)
- `GET /api/v1/subscription/status` — Subscription status (Phase 4: Monetization)
- `POST /api/v1/subscription/verify` — Purchase verification (Phase 4: Monetization)
- `POST /api/v1/webhooks/revenuecat` — RevenueCat webhook (Phase 4: Monetization)

**Note**: The `subscriptions` module has a database model (`src/subscriptions/models.py`) but no router or service yet.

---

## Common Response Patterns

### Error Response
```json
{ "detail": "Human-readable error message", "code": "MACHINE_READABLE_CODE" }
```
Custom exceptions use `AppException` (defined in `src/core/exceptions.py`).

### Standard Status Codes
| Code | Usage |
|------|-------|
| 200 | Success (with body) |
| 201 | Created |
| 204 | Success (no body) |
| 400 | Bad request / business logic error |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |
