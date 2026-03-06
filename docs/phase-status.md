# Phase Status

> Last synced: Phase 1 (Backend Core) — 2026-03-05
> This document tracks what's built, what's in progress, and what's next.
> New agents: READ THIS FIRST to understand the current state of the project.

## Current Phase: 1 — Backend Core (COMPLETE)

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

- [x] All core API endpoints implemented: Auth (5), Courses (3), Lessons (2), Progress (3), SRS (2), Streaks (1) = 16 endpoints
- [x] Server-side exercise answer validation for all 6 exercise types (multiple_choice, fill_blank, matching, listening, word_arrange, translation)
- [x] JWT auth with refresh token rotation
- [x] Google + Apple OAuth2 login (via id_token verification)
- [x] SRS (SM-2) algorithm produces correct intervals
- [x] Streak system with timezone-aware tracking
- [x] XP calculation with base + bonus (perfect, streak, speed)
- [x] Integration tests for all modules (17 test files, ~180 tests passing)
- [x] Alembic migration (`001_initial_schema.py`) creates all 11 tables
- [x] Docker Compose starts full backend stack
- [ ] OpenAPI spec auto-generates (FastAPI built-in, not explicitly tested)

### What Was Built

**Infrastructure** (`src/core/`):
- `config.py` — Settings via pydantic-settings (DB, Redis, JWT, S3, OAuth, Content)
- `database.py` — Async SQLAlchemy engine, session factory, `Base`, `TimestampMixin`
- `redis.py` — Redis connection
- `deps.py` — FastAPI dependency injection (get_db, get_redis, get_settings)
- `exceptions.py` — `AppException` + handler
- `middleware.py` — CORS setup, request ID middleware
- `main.py` — App factory, router registration

**Auth** (`src/auth/`):
- `models.py` — User, UserAuthProvider, RefreshToken
- `schemas.py` — RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest, OAuthRequest, TokenResponse, RefreshResponse
- `service.py` — register, authenticate, refresh_token, revoke_token, oauth_login
- `deps.py` — get_current_user dependency
- `router.py` — 5 endpoints (register, login, refresh, logout, oauth)

**Courses** (`src/courses/`):
- `models.py` — Course
- `schemas.py` — CourseOut, CourseListResponse, CourseDetailResponse, EnrollResponse, UnitOut, LessonSummaryOut, EnrollmentOut
- `service.py` — list_courses, get_course_detail, enroll
- `router.py` — 3 endpoints (list, detail, enroll)

**Lessons** (`src/lessons/`):
- `content_loader.py` — Load lesson JSON from filesystem/S3
- `schemas.py` — LessonOut, ExerciseSubmitRequest, ExerciseSubmitResponse
- `service.py` — get_lesson, submit_answer
- `router.py` — 2 endpoints (get lesson, submit exercise)
- `validators/` — 6 exercise type validators (multiple_choice, fill_blank, matching, listening, word_arrange, translation)

**Progress** (`src/progress/`):
- `models.py` — UserCourseEnrollment, LessonCompletion, XPEvent, Achievement
- `schemas.py` — LessonCompleteRequest/Response, ProgressSummaryResponse, CourseProgressResponse
- `xp.py` — XP calculation engine (base + perfect + streak + speed bonuses)
- `service.py` — complete_lesson, get_progress_summary, get_course_progress
- `router.py` — 3 endpoints (complete lesson, progress summary, course progress)

**SRS** (`src/srs/`):
- `models.py` — SRSItem
- `schemas.py` — ReviewItemOut, ReviewNextResponse, ReviewSubmitRequest, ReviewSubmitResponse
- `service.py` — get_due_items, submit_review (SM-2 algorithm)
- `router.py` — 2 endpoints (next items, submit review)

**Streaks** (`src/streaks/`):
- `models.py` — Streak
- `schemas.py` — StreakResponse
- `service.py` — get_streak, record_activity (timezone-aware)
- `router.py` — 1 endpoint (get my streak)

**Subscriptions** (`src/subscriptions/`):
- `models.py` — Subscription (model only, no API yet)

**Rate Limiting** (`src/middleware/`):
- `rate_limit.py` — Redis-based auth endpoint rate limiting

**Content Pipeline** (`content/`):
- `build.py` — Content build and validation script
- `schemas/` — 7 JSON schemas for exercise types + course manifest
- `courses/es-en/` — Sample Spanish course: 2 units, 10 lessons, ~60 exercises

**Tests** (`tests/`):
- `test_auth/` — test_security.py, test_service.py, test_rate_limit.py, test_router.py
- `test_courses/` — test_service.py, test_router.py
- `test_lessons/` — test_validators.py, test_service.py, test_router.py
- `test_progress/` — test_xp.py, test_service.py, test_router.py
- `test_srs/` — test_sm2.py, test_service.py, test_router.py
- `test_streaks/` — test_service.py, test_router.py

### What Was NOT Built (Deferred)

- `src/gamification/` — Leaderboards, leagues, achievement triggers (Phase 5)
- `src/notifications/` — Push notification triggers (Phase 5)
- `src/subscriptions/service.py` + `router.py` — Subscription API, RevenueCat webhook (Phase 4)
- Leaderboard endpoint (`GET /api/v1/leaderboard/weekly`) — Phase 5
- Subscription endpoints (`GET /subscription/status`, `POST /subscription/verify`) — Phase 4
- Webhook endpoint (`POST /webhooks/revenuecat`) — Phase 4

---

## Phase 2 — Mobile App 🔲 NOT STARTED
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

## Phase 3 — Web App 🔲 NOT STARTED
**Weeks 11-13 | Next.js**

### Prerequisites from Phase 1 + 2
- ✅ All API endpoints working
- 🔲 Shared API client generated and tested from mobile phase
- 🔲 Component patterns established (can reference mobile implementations)

---

## Phase 4 — Monetization 🔲 NOT STARTED
**Weeks 14-16 | RevenueCat + AdMob + Stripe**

### Prerequisites
- ✅ Full auth flow on all platforms (backend done; client pending Phase 2/3)
- ✅ Backend subscription model in DB

---

## Phase 5 — Gamification 🔲 NOT STARTED
**Weeks 17-19 | Redis + Backend + Client UI**

### Prerequisites
- ✅ XP system working end-to-end
- ✅ Redis connected and working for streaks

---

## Phase 6 — QA & Launch 🔲 NOT STARTED
**Weeks 20-22+**

### Prerequisites
- 🔲 All features implemented
- 🔲 Basic test coverage exists (backend coverage done)

---

## Changelog

> Entries added by doc-sync agent after each session. Most recent first.

| Date | Phase | Agent | Change Summary |
|------|-------|-------|---------------|
| 2026-03-05 | 1 | Doc Sync | Phase 1 complete: 16 API endpoints, 11 DB models, 6 exercise validators, 17 test files (~180 tests). All core backend services built. |
| 2026-03-05 | 0 | Setup | Initial project documentation created |
