# Architecture

> Last synced: Phase 1 (Backend Core) — 2026-03-05

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
1. Sets up CORS middleware
2. Adds request ID middleware
3. Registers custom exception handler (`AppException`)
4. Dynamically imports and registers all routers

### Dependency Injection
`src/core/deps.py` provides FastAPI dependencies:
- `get_db()` — async SQLAlchemy session
- `get_redis()` — async Redis connection
- `get_settings()` — app configuration

### Authentication Flow
- `src/auth/deps.py` provides `get_current_user` dependency
- JWT access tokens (15 min) + refresh tokens (30 days)
- Refresh token hashes stored in `refresh_tokens` table for revocation
- OAuth2 via id_token verification (Google, Apple)
- Rate limiting on auth endpoints via Redis (`src/middleware/rate_limit.py`)

## Data Flow Patterns

### Pattern 1: Lesson Delivery (Read-Heavy)
1. Client requests lesson → API returns lesson metadata + content URL
2. Content is loaded via `ContentLoader` from local filesystem (`CONTENT_DIR`) or S3
3. Client gets `content_url` pointing to lesson JSON
4. Client renders exercises locally from JSON

### Pattern 2: Exercise Submission
1. User answers exercise → client sends answer to API with `course_id` query param
2. API loads exercise from content JSON, dispatches to type-specific validator
3. 6 validator types: multiple_choice, fill_blank, matching, listening, word_arrange, translation
4. Returns correct/incorrect + correct answer + explanation + XP

### Pattern 3: Lesson Completion (Write)
1. Client calls `POST /lessons/{id}/complete` with score, time, mistakes
2. API creates `LessonCompletion` record
3. API calculates XP via `xp.py` (base 10 + perfect bonus 5 + streak bonus 0-7 + speed bonus 0-3)
4. API creates `XPEvent` record
5. API updates streak via `StreakService` (timezone-aware using user's timezone)
6. Returns XP breakdown, streak info, next lesson

### Pattern 4: Subscription Check (Read, Every Request)
1. Middleware reads user subscription status from Redis cache
2. If cache miss → query PostgreSQL → populate Redis (TTL 5 min)
3. Sets feature flags on request context: `show_ads`, `has_premium`, `streak_freeze_available`

**Note**: Subscription service not yet implemented (Phase 4). Model exists.

### Pattern 5: Offline Sync (Mobile Only — Phase 2)
1. On wifi: mobile pre-downloads next 5 lessons to SQLite
2. Offline: user completes lessons, stored in local queue
3. On reconnect: client pushes queued completions to API
4. Conflict resolution: server wins for XP (anti-cheat), client wins for completion status

## Service Boundaries

| Service | Directory | Status | Owns | Depends On |
|---------|-----------|--------|------|-----------|
| Auth | `src/auth/` | ✅ Built | User identity, tokens, sessions | PostgreSQL, Redis |
| Courses | `src/courses/` | ✅ Built | Course catalog, enrollment | PostgreSQL, ContentLoader |
| Lessons | `src/lessons/` | ✅ Built | Exercise serving, answer validation | ContentLoader, Courses |
| Progress | `src/progress/` | ✅ Built | Completion records, XP calculation | PostgreSQL, Redis, Streaks |
| SRS | `src/srs/` | ✅ Built | Review scheduling (SM-2), ease factors | PostgreSQL |
| Streaks | `src/streaks/` | ✅ Built | Daily activity, freeze logic | Redis, PostgreSQL |
| Subscriptions | `src/subscriptions/` | ⚠️ Model only | Payment state, feature flags | PostgreSQL, Redis, RevenueCat |
| Gamification | `src/gamification/` | 🔲 Not started | Leaderboards, achievements, leagues | Redis, PostgreSQL, Progress |
| Notifications | `src/notifications/` | 🔲 Not started | Push triggers, scheduling | FCM, Auth, Streaks |

## Content Pipeline

Course content lives in `/content/` and is loaded by `ContentLoader`:

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
        ├── manifest.json       # Course metadata
        └── units/
            ├── 1/lessons/      # 5 lessons
            └── 2/lessons/      # 5 lessons
```

In development, content is served from the local filesystem via `CONTENT_DIR` setting. In production, content is uploaded to S3 and served via CDN.

## Key Technical Decisions

See `docs/decisions.md` for full ADRs. Summary:

- **Static content on filesystem/S3**: Course JSON is built offline, served via CDN or filesystem. DB only stores metadata/versions.
- **Server-side answer validation**: Never trust client. API checks answers via type-specific validators and awards XP.
- **Redis for hot reads**: Streaks, rate limiting, session cache. PostgreSQL is source of truth.
- **TimestampMixin pattern**: Shared `id` (UUID), `created_at`, `updated_at` for most models. `XPEvent` and `Achievement` opt out for append-only semantics.
- **RevenueCat for subscriptions**: Unifies Apple IAP, Google Play Billing, Stripe into one webhook (Phase 4).
- **Expo Router for mobile navigation**: File-based routing, matches Next.js mental model (Phase 2).
- **Monorepo**: Single repo with `/api`, `/mobile`, `/web`, `/shared`, `/content`.

## External Service Integration

| Service | Purpose | Auth Method | Status |
|---------|---------|-------------|--------|
| PostgreSQL (Supabase) | Primary database | Connection string | ✅ Configured |
| Redis (Upstash) | Cache, rate limiting, streaks | Connection string | ✅ Configured |
| AWS S3 | Content storage | IAM credentials | ✅ Configured (local fallback) |
| Google OAuth | Social login | Client ID/Secret | ✅ Implemented |
| Apple OAuth | Social login | Client ID/Key | ✅ Implemented |
| RevenueCat | Subscription management | API key + SDK | 🔲 Phase 4 |
| Google AdMob | Mobile ads | App ID | 🔲 Phase 4 |
| Google AdSense | Web ads | Publisher ID | 🔲 Phase 4 |
| Firebase (FCM) | Push notifications | Service account key | 🔲 Phase 5 |
| CloudFront | CDN for content | Public/signed URLs | 🔲 Production setup |
