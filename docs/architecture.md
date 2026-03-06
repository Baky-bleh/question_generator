# Architecture

> Last synced: 2026-03-06 by doc-sync agent

## System Overview

LinguaLeap is a client-server application with one backend API serving two client apps (mobile + web). Course content is treated as static assets (S3/CDN or local filesystem), while user-specific data flows through the API to PostgreSQL and Redis.

```
┌─────────────┐    ┌─────────────┐
│  Mobile App  │    │   Web App    │
│ React Native │    │   Next.js    │
│   + Expo     │    │              │
└──────┬───────┘    └──────┬───────┘
       │                   │
       │   HTTPS / JSON    │
       └────────┬──────────┘
                │
         ┌──────▼──────┐
         │  FastAPI     │
         │  Backend     │
         │  (Python)    │
         └──┬───┬───┬──┘
            │   │   │
     ┌──────┘   │   └──────┐
     ▼          ▼          ▼
┌─────────┐ ┌───────┐ ┌─────────┐
│PostgreSQL│ │ Redis │ │  S3/CDN │
│(Supabase)│ │(Upstash│ │(Content)│
└─────────┘ └───────┘ └─────────┘
```

## Backend Architecture (Phase 1)

The FastAPI backend uses a modular structure. Each domain has its own directory under `api/src/` with consistent file organization:

```
src/{domain}/
├── models.py      # SQLAlchemy models
├── schemas.py     # Pydantic request/response schemas
├── service.py     # Business logic
├── router.py      # FastAPI endpoint definitions
└── (extras)       # Domain-specific files (validators, algorithms, etc.)
```

### App Factory
`src/main.py` uses a factory pattern (`create_app()`) that:
1. Sets up CORS middleware (allow all origins in development)
2. Adds request ID middleware (X-Request-ID header on every response)
3. Registers custom exception handler (`AppException`)
4. Dynamically imports and registers all routers (graceful fallback if module not ready)
5. Mounts `/content` as static files from `CONTENT_DIR` if directory exists

### Dependency Injection
`src/core/deps.py` provides FastAPI dependencies:
- `get_db()` — async SQLAlchemy session (auto-commit on success, rollback on error)
- `get_redis()` — async Redis connection (decode_responses=True)
- `get_settings()` — app configuration (singleton)
- `get_user_features()` — stub returning trial defaults (Phase 4 will implement fully)

Type aliases for convenience: `DbSession`, `RedisClient`, `CurrentSettings`, `UserFeatures`

### Authentication Flow
- `src/auth/deps.py` provides `get_current_user` dependency
- Uses `HTTPBearer` scheme to extract token from `Authorization: Bearer <token>` header
- JWT access tokens (HS256, 15 min) + refresh tokens (URL-safe random, 30 days)
- Refresh token hashes (SHA-256) stored in `refresh_tokens` table for revocation
- Refresh endpoint rotates tokens (revokes old, issues new access token)
- OAuth2 via id_token verification (Google uses google-auth library, Apple uses python-jose)
- Rate limiting on auth endpoints via Redis (`src/middleware/rate_limit.py` — 10 req / 15 min per IP)

## Data Flow Patterns

### Pattern 1: Lesson Delivery (Read-Heavy)
1. Client requests lesson → API loads course from DB to get slug
2. `ContentLoader` loads manifest from local filesystem (`CONTENT_DIR/courses/{slug}/manifest.json`)
3. API returns `LessonOut` with `content_url` pointing to static-mounted lesson JSON
4. Client downloads lesson JSON and renders exercises locally

### Pattern 2: Exercise Submission
1. User answers exercise → client sends answer to API with `course_id` query param
2. API loads exercise from content JSON via `ContentLoader`
3. Dispatches to type-specific validator in `src/lessons/validators/`
4. 6 validator types: multiple_choice, fill_blank, matching, listening, word_arrange, translation
5. Returns correct/incorrect + correct answer + explanation + XP (2 per correct answer)

### Pattern 3: Lesson Completion (Write)
1. Client calls `POST /api/v1/lessons/{id}/complete` with score, time, mistakes
2. API creates `LessonCompletion` record
3. API calculates XP via `xp.py` (base 10 + perfect bonus 5 + streak bonus 0-7 + speed bonus 0-3)
4. API creates `XPEvent` record
5. API updates streak via `StreakService.check_in()` (timezone-aware using user's timezone)
6. API advances enrollment position if lesson progresses the user
7. Returns XP breakdown, streak info, next lesson (resolved from manifest)

### Pattern 4: Streak Tracking (Redis + DB)
1. `StreakService.get_streak()` reads from Redis hash first (`streak:{user_id}`)
2. If cache miss → query PostgreSQL `streaks` table → populate Redis
3. `check_in()` uses user's local timezone to determine date
4. Consecutive day → increment; 1-day gap with freeze → auto-consume freeze and increment; else → reset to 1
5. Updates longest count if current exceeds it

### Pattern 5: Subscription Check (Read, Every Request)
1. Middleware reads user subscription status from Redis cache
2. If cache miss → query PostgreSQL → populate Redis (TTL 5 min)
3. Sets feature flags on request context: `show_ads`, `has_premium`, `streak_freeze_available`

**Note**: Subscription service not yet implemented (Phase 4). `get_user_features()` stub returns trial defaults.

### Pattern 6: Offline Sync (Mobile Only — Phase 2)
1. On wifi: mobile pre-downloads next 5 lessons to SQLite
2. Offline: user completes lessons, stored in local queue
3. On reconnect: client pushes queued completions to API
4. Conflict resolution: server wins for XP (anti-cheat), client wins for completion status

## Service Boundaries

| Service | Directory | Status | Owns | Depends On |
|---------|-----------|--------|------|-----------|
| Auth | `src/auth/` | ✅ Built | User identity, tokens, sessions, profiles | PostgreSQL, Redis |
| Courses | `src/courses/` | ✅ Built | Course catalog, enrollment | PostgreSQL, ContentLoader |
| Lessons | `src/lessons/` | ✅ Built | Exercise serving, answer validation | ContentLoader, Courses |
| Progress | `src/progress/` | ✅ Built | Completion records, XP calculation | PostgreSQL, Redis, Streaks |
| SRS | `src/srs/` | ✅ Built | Review scheduling (SM-2), ease factors | PostgreSQL, Courses |
| Streaks | `src/streaks/` | ✅ Built | Daily activity, freeze logic | Redis, PostgreSQL |
| Rate Limiting | `src/middleware/` | ✅ Built | Auth endpoint throttling | Redis |
| Subscriptions | `src/subscriptions/` | ⚠️ Model only | Payment state, feature flags | PostgreSQL, Redis, RevenueCat |
| Gamification | `src/gamification/` | 🔲 Not started | Leaderboards, achievements, leagues | Redis, PostgreSQL, Progress |
| Notifications | `src/notifications/` | 🔲 Not started | Push triggers, scheduling | FCM, Auth, Streaks |

## Content Pipeline

Course content lives in `/content/` and is loaded by `ContentLoader` (`src/lessons/content_loader.py`):

```
content/
├── build.py                    # Content build & validation
├── schemas/                    # JSON schemas for validation
│   ├── multiple_choice.json
│   ├── fill_blank.json
│   ├── matching.json
│   ├── listening.json
│   ├── word_arrange.json
│   ├── translation.json
│   └── course_manifest.json
└── courses/
    └── es-en/                  # Spanish for English speakers
        ├── manifest.json       # Course metadata + unit/lesson index
        └── units/
            ├── 1/lessons/      # 5 lessons (1.json - 5.json)
            └── 2/lessons/      # 5 lessons (1.json - 5.json)
```

`ContentLoader` methods:
- `load_manifest(course_slug)` — Load course manifest JSON
- `load_lesson(course_slug, unit_order, lesson_order)` — Load individual lesson JSON
- `list_course_slugs()` — List all available course directories with manifests

In development, content is served as static files via FastAPI's `StaticFiles` mount at `/content`. In production, content is uploaded to S3 and served via CDN.

## Key Technical Decisions

See `docs/decisions.md` for full ADRs. Summary:

- **Static content on filesystem/S3**: Course JSON is built offline, served via CDN or filesystem. DB only stores metadata/versions.
- **Server-side answer validation**: Never trust client. API checks answers via type-specific validators and awards XP.
- **Redis for hot reads**: Streaks, rate limiting. PostgreSQL is source of truth.
- **TimestampMixin pattern**: Shared `id` (UUID), `created_at`, `updated_at` for most models. `XPEvent` and `Achievement` opt out for append-only semantics.
- **RevenueCat for subscriptions**: Unifies Apple IAP, Google Play Billing, Stripe into one webhook (Phase 4).
- **Expo Router for mobile navigation**: File-based routing, matches Next.js mental model (Phase 2).
- **Monorepo**: Single repo with `/api`, `/mobile`, `/web`, `/shared`, `/content`.

## External Service Integration

| Service | Purpose | Auth Method | Status |
|---------|---------|-------------|--------|
| PostgreSQL (Supabase) | Primary database | Connection string (`DATABASE_URL`) | ✅ Configured |
| Redis (Upstash) | Cache, rate limiting, streaks | Connection string (`REDIS_URL`) | ✅ Configured |
| AWS S3 | Content storage | IAM credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) | ✅ Configured (local fallback) |
| Google OAuth | Social login | Client ID/Secret (`GOOGLE_OAUTH_CLIENT_ID`) | ✅ Implemented |
| Apple OAuth | Social login | Client ID (`APPLE_OAUTH_CLIENT_ID`) | ✅ Implemented |
| RevenueCat | Subscription management | API key + SDK | 🔲 Phase 4 |
| Google AdMob | Mobile ads | App ID | 🔲 Phase 4 |
| Google AdSense | Web ads | Publisher ID | 🔲 Phase 4 |
| Firebase (FCM) | Push notifications | Service account key | 🔲 Phase 5 |
| CloudFront | CDN for content | Public/signed URLs | 🔲 Production setup |
