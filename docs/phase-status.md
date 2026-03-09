# Phase Status

> Last synced: 2026-03-06 by doc-sync agent
> This document tracks what's built, what's in progress, and what's next.
> New agents: READ THIS FIRST to understand the current state of the project.

## Current Phase: 2 — Mobile App (IN PROGRESS)

## Phase Order

| Phase | Name | Status |
|-------|------|--------|
| Phase 1 | Backend Core (language) | ✅ COMPLETE |
| Phase 2 | Mobile App (language + mascot) | 🔄 IN PROGRESS |
| Phase 3A | Math Backend (video tables, endpoints, VideoStorage) | 🔲 NOT STARTED |
| Phase 3B | Math Mobile (video player, quiz flow, skill tree update) | 🔲 NOT STARTED |
| Phase 4 | Web App (language + math — full product) | 🔲 NOT STARTED |
| Phase 5 | Monetization (ads, subscriptions, RevenueCat) | 🔲 NOT STARTED |
| Phase 6 | Gamification (leaderboards, achievements, leagues) | 🔲 NOT STARTED |
| Phase 7 | QA, Polish & Launch | 🔲 NOT STARTED |

---

## Phase 0 — Foundation & Planning ✅ COMPLETE
**Weeks 1-2 | No code**

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Course curriculum design | ✅ Done | See `/content/schemas/` for exercise type definitions |
| Exercise JSON schemas | ✅ Done | 7 schemas: multiple_choice, fill_blank, matching, listening, word_arrange, translation, course_manifest |
| Monorepo structure | ✅ Done | `/api`, `/mobile`, `/web`, `/shared`, `/content`, `/infra` |
| CLAUDE.md + doc structure | ✅ Done | This documentation system |
| Docker Compose (local) | ✅ Done | PostgreSQL + Redis + API (`infra/docker-compose.yml`) |
| CI pipeline (GitHub Actions) | ✅ Done | Lint + type check + test on PR |
| Design system (Figma) | ✅ Done | Colors, typography, component sketches |
| Sample course content | ✅ Done | 1 course (es-en), 2 units, 10 lessons as JSON |

---

## Phase 1 — Backend Core ✅ COMPLETE
**Weeks 3-6 | FastAPI + PostgreSQL + Redis**

### Agent Team: Backend Foundation (4 agents + lead)

| Agent | Owns | Status | Key Deliverables |
|-------|------|--------|-----------------|
| Infrastructure Agent | `src/core/`, `alembic/` | ✅ Done | DB models (11 tables), migrations, Redis setup, project scaffold, main.py, middleware |
| Auth Agent | `src/auth/`, `src/middleware/` | ✅ Done | JWT auth, OAuth2 (Google/Apple), rate limiting, refresh token rotation |
| Content Engine Agent | `src/courses/`, `src/lessons/` | ✅ Done | Content loader, course/lesson endpoints, exercise validators (6 types), S3-ready |
| Progress & SRS Agent | `src/progress/`, `src/srs/`, `src/streaks/` | ✅ Done | Completion tracking, XP calculation, SM-2 algorithm, streak service |

### Acceptance Criteria

- [x] All core API endpoints implemented: Auth (5), Users (2), Courses (3), Lessons (2), Progress (3), SRS (2), Streaks (1) = 18 endpoints
- [x] Server-side exercise answer validation for all 6 exercise types (multiple_choice, fill_blank, matching, listening, word_arrange, translation)
- [x] JWT auth with refresh token rotation
- [x] Google + Apple OAuth2 login (via id_token verification)
- [x] SRS (SM-2) algorithm produces correct intervals
- [x] Streak system with timezone-aware tracking and auto-freeze consumption
- [x] XP calculation with base + bonus (perfect, streak, speed)
- [x] Tests for all modules (17 test files)
- [x] Alembic migrations (`001_initial_schema.py`, `002_add_daily_goal_to_users.py`)
- [x] Docker Compose starts full backend stack
- [ ] OpenAPI spec auto-generates (FastAPI built-in, not explicitly tested)

### What Was Built

**Infrastructure** (`src/core/`):
- `config.py` — Settings via pydantic-settings (DB, Redis, JWT, S3, OAuth, Content, App)
- `database.py` — Async SQLAlchemy engine, session factory, `Base`, `TimestampMixin`
- `redis.py` — Redis connection (async, decode_responses=True)
- `deps.py` — FastAPI dependency injection (get_db, get_redis, get_settings, get_user_features stub)
- `exceptions.py` — `AppException` hierarchy (NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, ValidationError)
- `middleware.py` — CORS setup, request ID middleware (X-Request-ID header)
- `main.py` — App factory with dynamic router registration, static content mount

**Auth** (`src/auth/`):
- `models.py` — User, UserAuthProvider, RefreshToken
- `schemas.py` — RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, OAuthRequest, TokenResponse, RefreshResponse, UserProfileResponse, UserUpdateRequest
- `security.py` — bcrypt password hashing, JWT (HS256) creation/verification, SHA-256 token hashing
- `service.py` — register, authenticate, refresh_token (with rotation), revoke_token, oauth_login (Google/Apple)
- `deps.py` — get_current_user dependency (Bearer token -> JWT decode -> DB lookup)
- `router.py` — 7 endpoints: register, login, refresh, logout, oauth/{provider}, GET /users/me, PATCH /users/me

**Courses** (`src/courses/`):
- `models.py` — Course
- `schemas.py` — CourseOut, CourseListResponse, CourseDetailResponse, EnrollResponse, UnitOut, LessonSummaryOut, EnrollmentOut
- `service.py` — list_courses (published only), get_course_detail (with progress merge from manifest), enroll
- `router.py` — 3 endpoints (list, detail, enroll)

**Lessons** (`src/lessons/`):
- `content_loader.py` — Load manifest and lesson JSON from local filesystem (S3-ready design)
- `schemas.py` — LessonOut, ExerciseSubmitRequest, ExerciseSubmitResponse
- `service.py` — get_lesson (returns content_url), submit_answer (validates via type-specific validators)
- `router.py` — 2 endpoints (get lesson, submit exercise)
- `validators/` — 6 exercise type validators: multiple_choice, fill_blank, matching, listening, word_arrange, translation. Each returns `ValidatorResult(correct, correct_answer, explanation)`.

**Progress** (`src/progress/`):
- `models.py` — UserCourseEnrollment, LessonCompletion, XPEvent, Achievement
- `schemas.py` — LessonCompleteRequest/Response, ProgressSummaryResponse, CourseProgressResponse, TodayStats, CourseProgressSummary, NextLesson, StreakInfo
- `xp.py` — XP calculation engine: base=10, perfect_bonus=5, streak_bonus=0-7, speed_bonus=0-3
- `service.py` — complete_lesson (creates completion + XP event + streak check-in + enrollment advance), get_progress_summary, get_course_progress
- `router.py` — 3 endpoints (complete lesson, progress summary, course progress)

**SRS** (`src/srs/`):
- `models.py` — SRSItem
- `schemas.py` — ReviewItemOut, ReviewNextResponse, ReviewSubmitRequest, ReviewSubmitResponse
- `sm2.py` — SM-2 algorithm (quality 0-5, ease factor, interval, repetitions)
- `service.py` — get_due_items (ordered by next_review_at), submit_review (SM-2 update)
- `router.py` — 2 endpoints (next items, submit review)

**Streaks** (`src/streaks/`):
- `models.py` — Streak
- `schemas.py` — StreakResponse
- `service.py` — get_streak (Redis-first, DB fallback), check_in (timezone-aware, auto-freeze consumption on 1-day gap)
- `router.py` — 1 endpoint (get my streak)

**Subscriptions** (`src/subscriptions/`):
- `models.py` — Subscription (model only, no API yet)

**Rate Limiting** (`src/middleware/`):
- `rate_limit.py` — Redis-based auth endpoint rate limiting (10 req / 15 min per IP)

**Content Pipeline** (`content/`):
- `build.py` — Content build and validation script
- `schemas/` — 7 JSON schemas for exercise types + course manifest
- `courses/es-en/` — Sample Spanish course: 2 units, 10 lessons (5 per unit)

**Tests** (`api/tests/`):
- `test_auth/` — test_security.py, test_service.py, test_rate_limit.py, test_router.py
- `test_courses/` — test_service.py, test_router.py
- `test_lessons/` — test_validators.py, test_service.py, test_router.py
- `test_progress/` — test_xp.py, test_service.py, test_router.py
- `test_srs/` — test_sm2.py, test_service.py, test_router.py
- `test_streaks/` — test_service.py, test_router.py

### What Was NOT Built (Deferred)

- `src/gamification/` — Leaderboards, leagues, achievement triggers (Phase 6)
- `src/notifications/` — Push notification triggers (Phase 6)
- `src/subscriptions/service.py` + `router.py` — Subscription API, RevenueCat webhook (Phase 5)
- Leaderboard endpoint (`GET /api/v1/leaderboard/weekly`) — Phase 6
- Subscription endpoints (`GET /subscription/status`, `POST /subscription/verify`) — Phase 5
- Webhook endpoint (`POST /webhooks/revenuecat`) — Phase 5

---

## Phase 2 — Mobile App 🔄 IN PROGRESS
**Weeks 7-10 | React Native + Expo**

### Prerequisites from Phase 1
- ✅ All auth endpoints working
- ✅ Lesson content delivery working (content URLs)
- ✅ Progress and SRS endpoints working
- ✅ OpenAPI spec available for client generation (FastAPI auto-generates)

### Agent Team: Mobile App Core (4 agents + lead)

| Agent | Owns | Status | Key Deliverables |
|-------|------|--------|-----------------|
| Navigation & Auth Agent | `app/(auth)/`, `src/screens/onboarding/` | 🔲 | Onboarding, login/signup, Expo Router setup |
| Lesson Player Agent | `src/components/lesson/`, `src/screens/lesson/` | 🔲 | Exercise renderer, answer submission, animations |
| Home & Progress Agent | `src/screens/home/`, `src/screens/profile/` | 🔲 | Skill tree, course overview, progress dashboard |
| Data & Offline Agent | `src/services/` | 🔲 | API client, SQLite cache, sync, push notifications |

### Acceptance Criteria
- [ ] User can sign up, log in, select a language
- [ ] Skill tree displays with correct locked/available/completed states
- [ ] Lesson player renders all 6 exercise types
- [ ] Lesson completion shows XP breakdown and streak update
- [ ] Offline mode works for pre-downloaded lessons
- [ ] Push notifications fire for streak reminders
- [ ] App runs on both iOS simulator and Android emulator

---

## Phase 3A — Math Backend 🔲 NOT STARTED
**Video tables, endpoints, VideoStorage abstraction**

Details TBD — plan will be created before this phase starts.

See `docs/video-architecture.md` for the video system design.

---

## Phase 3B — Math Mobile 🔲 NOT STARTED
**Video player, quiz flow, skill tree update**

Details TBD — plan will be created before this phase starts.

---

## Phase 4 — Web App 🔲 NOT STARTED
**Language + math — full product on Next.js**

Details TBD — plan will be created before this phase starts.

---

## Phase 5 — Monetization 🔲 NOT STARTED
**Ads, subscriptions, RevenueCat**

Details TBD — plan will be created before this phase starts.

---

## Phase 6 — Gamification 🔲 NOT STARTED
**Leaderboards, achievements, leagues**

Details TBD — plan will be created before this phase starts.

---

## Phase 7 — QA, Polish & Launch 🔲 NOT STARTED

Details TBD — plan will be created before this phase starts.

---

## Changelog

> Entries added by doc-sync agent after each session. Most recent first.

| Date | Phase | Agent | Change Summary |
|------|-------|-------|---------------|
| 2026-03-06 | 1 | Doc Sync | Re-synced all docs after Phase 1 completion. 18 API endpoints, 11 DB tables, 6 exercise validators, 17 test files. Corrected error response format, Redis data structures, endpoint count. |
| 2026-03-05 | 1 | Doc Sync | Phase 1 complete: 16 API endpoints, 11 DB models, 6 exercise validators, 17 test files (~180 tests). All core backend services built. |
| 2026-03-05 | 0 | Setup | Initial project documentation created |
