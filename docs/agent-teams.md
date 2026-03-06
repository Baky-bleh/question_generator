# Agent Teams Configuration

> Copy-paste spawn prompts for each phase. Adjust based on current state.
> Always read `docs/phase-status.md` to check prerequisites before spawning a team.

## Prompt Optimization Rules

### What Makes a Good Spawn Prompt
Each teammate starts with a BLANK conversation — they only know what's in CLAUDE.md
and what you put in the spawn prompt. A bad prompt = wasted tokens.

**Every spawn prompt must include:**
1. **Project context** — what this project is, one paragraph
2. **What already exists** — which files/modules are built, reference specific doc files
3. **Exact file ownership** — which directories this agent owns, which it must NOT touch
4. **Dependencies** — which other teammate's work this agent needs to wait for
5. **Tasks with acceptance criteria** — not "build auth" but "build JWT auth that passes these specific tests"
6. **Anti-patterns** — what this agent should NOT do (prevents common mistakes)

### Prompt Template
```
Spawn teammate "{name}" with this context:

PROJECT: LinguaLeap — a Duolingo-style language learning app.
Stack: FastAPI (Python) backend, React Native + Expo mobile, Next.js web.
Full project context: read CLAUDE.md, docs/conventions.md

WHAT EXISTS: [describe current state, or say "nothing — greenfield"]
Reference: docs/phase-status.md for full status

YOUR ROLE: [one sentence]
YOUR FILES (you OWN these — only you edit them):
  - path/to/dir/
  - path/to/file.py
DO NOT TOUCH:
  - path/to/other/
DEPENDS ON: [teammate name] must finish [specific deliverable] first

TASKS:
1. [Task] → DONE WHEN: [specific acceptance criteria]
2. [Task] → DONE WHEN: [specific acceptance criteria]
...

ANTI-PATTERNS (do NOT do these):
- [common mistake to avoid]
- [another thing not to do]

When you finish a task that changes API endpoints or DB schema, add to your
commit message: CHANGELOG_ENTRY: [describe the change]
```

---

## Mascot Character System

LinguaLeap has a mascot character (like Duolingo's Duo owl). This character appears
throughout the app in different emotional states and drives engagement.

### Character States (SVG/Lottie Animations)
| State | Trigger | Usage |
|-------|---------|-------|
| `idle` | Default | Home screen, waiting states |
| `happy` | Correct answer | Lesson player, celebrations |
| `celebrating` | Perfect score, streak milestone | Results screen, achievements |
| `encouraging` | Wrong answer (first attempt) | Lesson player feedback |
| `thinking` | User is taking long | During exercise, loading |
| `sad` | Streak lost, multiple wrong answers | Streak break notification |
| `sleeping` | Inactive user | Push notification, return screen |
| `angry` | Long absence (5+ days) | Re-engagement notification |
| `waving` | First visit of the day | Home screen greeting |
| `teaching` | New concept introduction | Lesson intro, tooltips |

### File Structure
```
shared/
  mascot/
    types.ts              ← MascotState type, animation triggers
    constants.ts          ← State-to-asset mapping
mobile/
  src/components/mascot/
    Mascot.tsx            ← Main component (accepts state prop)
    MascotAnimated.tsx    ← Lottie-based animated version
    MascotStatic.tsx      ← SVG fallback for low-end devices
    useMascotState.ts     ← Hook: derives mascot state from app context
web/
  src/components/mascot/
    Mascot.tsx            ← Web version (CSS animations or Lottie-web)
    useMascotState.ts     ← Same logic, web-adapted
assets/
  mascot/
    idle.json             ← Lottie animation files
    happy.json
    celebrating.json
    ... (one per state)
    static/               ← SVG fallback per state
```

### Integration Points
- **Lesson Player**: Mascot reacts to each answer (happy/encouraging)
- **Results Screen**: Mascot celebrates or encourages based on score
- **Home Screen**: Mascot greets based on time of day + streak status
- **Push Notifications**: Mascot state shown in notification images
- **Streak Break**: Sad/angry mascot shown when streak is lost
- **Empty States**: Mascot fills empty screens (no courses yet, etc.)

---

## Doc-Sync System

### The Problem
Agents finish work → docs become stale → next team has wrong context → bad output.

### The Solution: Doc-Sync Agent
After each team completes, run a single Doc-Sync Agent before starting the next phase.

```
You → plan mode (cheap) → spawn team → team works → team finishes
                                                         ↓
                                                  Stop hook runs
                                                         ↓
                                                  Doc-Sync agent
                                                         ↓
                                               Rewrites docs/ files
                                                         ↓
                                               Next team starts clean
```

### Doc-Sync Prompt (run between every phase)
```
Spawn a single teammate "doc-sync". This agent does NOT write application code.

PROJECT: LinguaLeap — read CLAUDE.md for full project index.

YOUR ROLE: Read the actual codebase and rewrite documentation to match reality.
YOUR FILES (you OWN these):
  - docs/api-contracts.md
  - docs/database-schema.md
  - docs/phase-status.md
  - docs/architecture.md
DO NOT TOUCH: Any file outside docs/

TASKS:
1. Scan api/src/ — find every router.py, read every @router decorator.
   → REWRITE docs/api-contracts.md with actual endpoints, actual Pydantic schemas.
   → DONE WHEN: every endpoint in code appears in doc, no phantom endpoints in doc.

2. Scan api/src/ — find every models.py, read every SQLAlchemy model.
   → REWRITE docs/database-schema.md with actual columns, types, constraints.
   → DONE WHEN: every table in code appears in doc with correct columns.

3. Scan mobile/app/, mobile/src/, web/app/, web/src/ — list every screen/component.
   → UPDATE docs/phase-status.md — mark deliverables complete/incomplete.
   → DONE WHEN: status reflects reality (✅ = code + tests exist, ⚠️ = code but no tests, 🔲 = not built).

4. Read git log -50 for CHANGELOG_ENTRY messages.
   → UPDATE changelog table in docs/phase-status.md.

5. Check docs/architecture.md — update if new services, integrations, or patterns were added.

ANTI-PATTERNS:
- Do NOT append to files — rewrite each file completely
- Do NOT document planned features as if they exist
- Do NOT remove sections for future phases — keep them with 🔲 status
```

---

## Phase 1: Backend Foundation

**Step 1: Plan first (cheap)**
```
Use plan mode. Read CLAUDE.md, docs/conventions.md, docs/api-contracts.md,
docs/database-schema.md. Create a detailed implementation plan for the backend
API. List every file that needs to be created, every function signature, every
test case. Do NOT write code yet.
```

**Step 2: Spawn team**
```
Create an agent team called "backend-foundation" for the LinguaLeap project.

PROJECT: LinguaLeap — a Duolingo-style language learning platform.
Backend: FastAPI + PostgreSQL + Redis. Read CLAUDE.md for full project structure.
Coding standards: docs/conventions.md (read this before writing any code)
API spec: docs/api-contracts.md (this is what we're building)
DB schema: docs/database-schema.md (this is our data model)
Current state: Greenfield — nothing is built yet. See docs/phase-status.md.

Spawn 4 teammates:

---

Teammate "infra" — Project Scaffold & Database Layer:
  YOUR ROLE: Set up the entire FastAPI project structure, database models,
  and test infrastructure. You are the foundation — other agents depend on you.
  YOUR FILES:
    - api/pyproject.toml
    - api/src/core/ (config.py, database.py, deps.py, exceptions.py, middleware.py)
    - api/src/main.py
    - api/alembic/ (alembic.ini, env.py, versions/)
    - api/docker/ (if needed)
    - api/tests/conftest.py
    - api/src/*/models.py (ALL model files across all modules)
  DO NOT TOUCH: router.py, service.py, or schemas.py in any module
  DEPENDS ON: Nothing — you go first

  TASKS:
  1. Create pyproject.toml with all dependencies:
     fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings,
     python-jose[cryptography], passlib[bcrypt], aioredis, boto3, httpx,
     pytest, pytest-asyncio, ruff
     → DONE WHEN: `pip install -e .` succeeds

  2. Create src/core/config.py — Pydantic BaseSettings reading from env vars.
     All config from docs/conventions.md environment variables section.
     → DONE WHEN: `Settings()` loads with defaults, overridable by env

  3. Create src/core/database.py — async SQLAlchemy engine, session factory,
     Base model with TimestampMixin (id UUID, created_at, updated_at).
     → DONE WHEN: `async with get_db() as session` works

  4. Create ALL models from docs/database-schema.md:
     users, user_auth_providers, refresh_tokens, subscriptions, courses,
     user_course_enrollments, lesson_completions, srs_items, streaks,
     xp_events, achievements
     Put each model in its module: src/auth/models.py, src/courses/models.py, etc.
     → DONE WHEN: All 11 tables defined with correct columns, types, constraints, indexes

  5. Create src/core/deps.py — get_db dependency, get_current_user (placeholder),
     get_redis dependency.
     → DONE WHEN: Dependencies are importable from src.core.deps

  6. Create src/core/exceptions.py — base AppException, common HTTP exceptions.
     → DONE WHEN: raise NotFoundError("User") returns proper 404 JSON

  7. Set up Redis connection in src/core/redis.py using aioredis.
     → DONE WHEN: Can set/get a key in tests

  8. Generate initial Alembic migration.
     → DONE WHEN: `alembic upgrade head` creates all tables

  9. Create tests/conftest.py with fixtures: test_db (fresh DB per test),
     async_client (httpx AsyncClient), create_test_user factory.
     → DONE WHEN: `pytest tests/` runs with 0 errors (even if 0 tests)

  ANTI-PATTERNS:
  - Do NOT use synchronous SQLAlchemy — everything async
  - Do NOT hardcode any config values — use Settings class
  - Do NOT create router or service files — other agents own those

---

Teammate "auth" — Authentication System:
  YOUR ROLE: Build the complete auth system — JWT tokens, OAuth, rate limiting.
  YOUR FILES:
    - api/src/auth/router.py
    - api/src/auth/service.py
    - api/src/auth/schemas.py
    - api/src/auth/deps.py
    - api/src/middleware/auth.py
    - api/src/middleware/rate_limit.py
    - api/tests/test_auth/
  DO NOT TOUCH: models.py (infra owns it), any file outside src/auth/ and src/middleware/
  DEPENDS ON: "infra" must finish tasks 1-5 first (models, DB session, deps)

  TASKS:
  1. Create src/auth/schemas.py — Pydantic models:
     LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, OAuthRequest
     → DONE WHEN: All schemas match docs/api-contracts.md auth section

  2. Create src/auth/service.py — AuthService class:
     - create_user(email, password, display_name) → User
     - authenticate(email, password) → User | None
     - create_access_token(user_id) → str (JWT, 15 min expiry)
     - create_refresh_token(user_id) → str (stored hash in DB, 30 day expiry)
     - verify_access_token(token) → user_id
     - rotate_refresh_token(old_token) → new TokenResponse
     - revoke_refresh_token(token) → None
     - oauth_login(provider, id_token) → TokenResponse (creates user if new)
     → DONE WHEN: Each method has at least 2 tests (happy + error path)

  3. Create src/auth/router.py — endpoints per docs/api-contracts.md:
     POST /register, POST /login, POST /refresh, POST /logout,
     POST /oauth/{provider}
     → DONE WHEN: All 5 endpoints return correct status codes and response shapes

  4. Create src/middleware/auth.py — get_current_user dependency:
     Extracts Bearer token, validates JWT, returns User from DB.
     → DONE WHEN: Protected endpoint returns 401 without token, 200 with valid token

  5. Create src/middleware/rate_limit.py — rate limiting for auth endpoints:
     10 requests per minute per IP on login/register.
     → DONE WHEN: 11th request within a minute returns 429

  6. Write integration tests in tests/test_auth/:
     - test_register_success, test_register_duplicate_email
     - test_login_success, test_login_wrong_password
     - test_refresh_token_rotation, test_refresh_expired_token
     - test_logout_revokes_token
     - test_protected_endpoint_requires_auth
     → DONE WHEN: All tests pass, 90%+ coverage on auth module

  ANTI-PATTERNS:
  - Do NOT store plain-text passwords — bcrypt only
  - Do NOT put secrets in code — read from Settings
  - Do NOT make tokens too long-lived — access: 15min, refresh: 30 days

---

Teammate "content" — Courses, Lessons & Exercise Validation:
  YOUR ROLE: Build course/lesson endpoints and the exercise answer validation engine.
  YOUR FILES:
    - api/src/courses/router.py, service.py, schemas.py
    - api/src/lessons/router.py, service.py, schemas.py
    - api/src/lessons/validators/ (one file per exercise type)
    - api/tests/test_courses/, api/tests/test_lessons/
    - content/schemas/ (JSON schema definitions)
    - content/courses/ (sample course JSON files)
    - content/build.py (content build & validation script)
  DO NOT TOUCH: models.py (infra owns it), auth/, progress/, srs/
  DEPENDS ON: "infra" must finish tasks 1-5 first

  TASKS:
  1. Create content/schemas/ — JSON Schema for each exercise type:
     multiple_choice.json, fill_blank.json, matching.json,
     listening.json, word_arrange.json, translation.json
     → DONE WHEN: jsonschema validates sample exercises against each schema

  2. Create content/courses/ — sample course "Spanish for English Speakers":
     2 units, 5 lessons each, 6-10 exercises per lesson, all 6 types represented.
     → DONE WHEN: `python content/build.py --validate` passes on all files

  3. Create content/build.py — content pipeline:
     Validates all course JSON against schemas, generates manifest.json with
     content version hash. (Skip actual S3 upload for now — just write to local output dir)
     → DONE WHEN: Script runs, validates, outputs manifest.json

  4. Create src/courses/schemas.py, service.py, router.py:
     GET /courses, GET /courses/{id}, POST /courses/{id}/enroll
     per docs/api-contracts.md
     → DONE WHEN: Endpoints return correct shapes, enrollment creates DB record

  5. Create src/lessons/schemas.py, service.py, router.py:
     GET /lessons/{id} (returns content_url), POST /lessons/{id}/submit
     → DONE WHEN: Submit validates answer server-side and returns correct/incorrect

  6. Create src/lessons/validators/ — one validator per exercise type:
     Each takes (exercise_data, user_answer) → (correct: bool, explanation: str)
     Handle edge cases: case sensitivity, whitespace, partial matches, alternate spellings
     → DONE WHEN: Each validator has 5+ test cases including edge cases

  7. Write tests for all endpoints + all validators.
     → DONE WHEN: 90%+ coverage on courses/ and lessons/ modules

  ANTI-PATTERNS:
  - Do NOT validate answers client-side — server only
  - Do NOT hardcode content — load from JSON files
  - Do NOT couple validators to HTTP layer — pure functions

---

Teammate "progress" — Progress Tracking, XP, SRS, Streaks:
  YOUR ROLE: Build the systems that make learning effective — progress tracking,
  spaced repetition, XP rewards, and streaks.
  YOUR FILES:
    - api/src/progress/router.py, service.py, schemas.py
    - api/src/srs/service.py, schemas.py, router.py
    - api/src/srs/sm2.py (SM-2 algorithm, pure function)
    - api/src/streaks/service.py, schemas.py, router.py
    - api/tests/test_progress/, api/tests/test_srs/, api/tests/test_streaks/
  DO NOT TOUCH: models.py (infra owns it), auth/, courses/, lessons/
  DEPENDS ON: "infra" must finish tasks 1-5, 7 first (models, DB, Redis)

  TASKS:
  1. Create src/progress/schemas.py, service.py, router.py:
     POST /lessons/{id}/complete (XP calculation with breakdown),
     GET /progress/me, GET /progress/me/course/{id}
     per docs/api-contracts.md
     → DONE WHEN: Completing a lesson creates records, awards correct XP

  2. Create XP calculation in service.py:
     base_xp = 10, perfect_bonus = 5 (if score == 100), speed_bonus = 0-3
     (based on time vs expected), streak_bonus = min(streak_days, 7)
     → DONE WHEN: XP breakdown matches expected values for 5+ test scenarios

  3. Create src/srs/sm2.py — pure function implementing SM-2 algorithm:
     Input: quality (0-5), current ease_factor, current interval, repetition_count
     Output: new ease_factor, new interval, new repetition_count
     → DONE WHEN: Passes standard SM-2 test vectors (quality 0 resets, quality 5 extends)

  4. Create src/srs/service.py, router.py:
     GET /review/next?course_id=X&limit=20 (items where next_review_at <= now),
     POST /review/submit (updates SRS state using sm2.py)
     → DONE WHEN: Review queue returns correct items, submit updates intervals

  5. Create src/streaks/service.py, router.py:
     GET /streaks/me, internal check_in() called on lesson completion.
     Timezone handling: use user's timezone from profile, compare to user's local date.
     → DONE WHEN: User in UTC+9 completing lesson at 23:30 local time gets today's credit

  6. Redis caching for streaks:
     On check-in: update Redis hash (streak:{user_id} → {count, last_date, freeze_remaining})
     On read: read from Redis, fallback to PostgreSQL on cache miss.
     Background: periodically persist Redis streaks to PostgreSQL.
     → DONE WHEN: Streak reads hit Redis, cache miss falls back to DB

  7. Streak freeze logic (premium feature):
     If user misses a day AND has freeze_remaining > 0: consume a freeze, maintain streak.
     Freeze check runs once per day per user (first request of the day).
     → DONE WHEN: Premium user with freeze survives 1 missed day, streak maintained

  8. Write thorough tests:
     SM-2 edge cases: quality=0 should reset, quality=5 should grow interval.
     Streak timezone: test users in different timezones crossing midnight.
     XP: test all bonus combinations.
     → DONE WHEN: All edge cases pass, 90%+ coverage

  ANTI-PATTERNS:
  - Do NOT use UTC for streak dates — use user's local timezone
  - Do NOT compute streaks from lesson_completions on every read — use cached count
  - Do NOT make SM-2 depend on database — keep it a pure function
```

---

## Phase 2: Mobile App + UI/UX Design

**Step 1: Plan first**
```
Use plan mode. Read CLAUDE.md, docs/conventions.md, docs/api-contracts.md,
docs/phase-status.md (check what Phase 1 built). Plan the mobile app:
list every screen, every component, every navigation route, every animation.
Include the mascot character system. Do NOT write code yet.
```

**Step 2: Spawn team (5 teammates)**
```
Create an agent team called "mobile-app" for the LinguaLeap project.

PROJECT: LinguaLeap — a Duolingo-style language learning platform.
Mobile: React Native + Expo SDK 52+ with Expo Router. TypeScript.
The backend API is FULLY BUILT and running at http://localhost:8000.
API reference: docs/api-contracts.md (read this — it's your API contract)
What Phase 1 built: docs/phase-status.md
Coding standards: docs/conventions.md

IMPORTANT — MASCOT CHARACTER:
LinguaLeap has a mascot character that appears throughout the app in different
emotional states (like Duolingo's Duo owl). See docs/agent-teams.md "Mascot
Character System" section for all states and integration points.
The mascot must be integrated into: lesson feedback, results screen,
home screen greeting, empty states, and streak notifications.

Spawn 5 teammates:

---

Teammate "ux-designer" — UI/UX Design System & Mascot:
  YOUR ROLE: Create the design system, component library foundation, mascot
  character component, and ensure visual consistency across all screens.
  You set the visual language — other agents consume your components.
  YOUR FILES:
    - mobile/src/theme/ (colors.ts, typography.ts, spacing.ts, shadows.ts)
    - mobile/src/components/ui/ (Button.tsx, Card.tsx, Input.tsx, Badge.tsx,
      ProgressBar.tsx, Modal.tsx, Toast.tsx, BottomSheet.tsx)
    - mobile/src/components/mascot/ (Mascot.tsx, MascotAnimated.tsx,
      MascotStatic.tsx, useMascotState.ts, mascotAssets.ts)
    - mobile/assets/mascot/ (SVG files for each state)
    - shared/mascot/ (types.ts, constants.ts)
  DO NOT TOUCH: screens/, services/, stores/, app/ routing
  DEPENDS ON: Nothing — you go first (other agents consume your components)

  TASKS:
  1. Create mobile/src/theme/ — design tokens:
     colors.ts: primary, secondary, success, error, warning, background, surface,
     text (with dark mode variants). Inspired by Duolingo's playful but clean palette.
     typography.ts: font families, sizes (heading1-3, body, caption, button).
     spacing.ts: consistent spacing scale (4, 8, 12, 16, 24, 32, 48).
     shadows.ts: elevation levels for cards.
     → DONE WHEN: All tokens are exported and typed, both light and dark variants

  2. Create mobile/src/components/ui/ — base component library:
     Button (primary, secondary, outline, ghost variants + loading state),
     Card (elevated, outlined variants),
     Input (text, password, with error state + label),
     Badge (XP, streak, level variants),
     ProgressBar (animated fill, optional percentage label),
     Modal, Toast (success, error variants), BottomSheet
     Every component uses theme tokens, NOT hardcoded colors/sizes.
     → DONE WHEN: Each component renders correctly, respects theme, has TypeScript props

  3. Create shared/mascot/types.ts — MascotState enum:
     'idle' | 'happy' | 'celebrating' | 'encouraging' | 'thinking' | 'sad' |
     'sleeping' | 'angry' | 'waving' | 'teaching'
     Create shared/mascot/constants.ts — state metadata (which animation file,
     fallback SVG, default message per state).
     → DONE WHEN: Types importable from shared package

  4. Create mobile/assets/mascot/ — SVG mascot for each state:
     Design a friendly, expressive character (animal or creature).
     Create 10 SVG variants, one per MascotState.
     Keep SVGs simple (< 5KB each) for performance.
     → DONE WHEN: All 10 SVGs exist and render in React Native

  5. Create mobile/src/components/mascot/Mascot.tsx:
     Main component: accepts `state: MascotState` and optional `size: 'sm' | 'md' | 'lg'`
     and optional `message: string` (speech bubble).
     MascotStatic.tsx — renders SVG based on state.
     MascotAnimated.tsx — uses Reanimated for enter/exit/transition animations
     (bounce in, scale pulse on state change, subtle idle breathing animation).
     → DONE WHEN: <Mascot state="happy" message="Great job!" /> renders correctly

  6. Create mobile/src/components/mascot/useMascotState.ts:
     Hook that derives MascotState from app context:
     - In lesson: based on last answer (correct → happy, wrong → encouraging)
     - On home: based on time of day + streak (morning → waving, streak at risk → sad)
     - On results: based on score (perfect → celebrating, < 50% → encouraging)
     → DONE WHEN: Hook returns correct state for 5+ test scenarios

  ANTI-PATTERNS:
  - Do NOT use hardcoded colors anywhere — always reference theme tokens
  - Do NOT make the mascot a PNG/raster image — use SVG for scalability
  - Do NOT create overly complex SVGs — keep them < 5KB per state
  - Do NOT make components platform-specific — they should work on iOS + Android

---

Teammate "data-layer" — API Client, State Management & Offline:
  YOUR ROLE: Build the data layer that all screens depend on — API client,
  caching, offline support, auth token management.
  YOUR FILES:
    - shared/api-client/ (generated TypeScript client)
    - shared/types/ (shared TypeScript types)
    - mobile/src/services/ (api.ts, auth.ts, offline.ts, sync.ts, notifications.ts)
    - mobile/src/stores/ (authStore.ts, progressStore.ts, settingsStore.ts)
    - mobile/src/hooks/useAuth.ts, useOnlineStatus.ts
  DO NOT TOUCH: components/, screens/, app/ routing, theme/
  DEPENDS ON: Nothing — you and ux-designer go first in parallel

  TASKS:
  1. Generate TypeScript API client from OpenAPI spec at http://localhost:8000/openapi.json
     using openapi-typescript-codegen or orval. Place in shared/api-client/.
     → DONE WHEN: `api.auth.login({email, password})` is typed and callable

  2. Set up React Query in mobile/src/services/api.ts:
     QueryClient config, default stale times, retry logic.
     Create typed query hooks: useCoursesQuery, useLessonQuery, useProgressQuery, etc.
     → DONE WHEN: Queries return typed data, loading/error states work

  3. Create mobile/src/services/auth.ts:
     Store tokens in expo-secure-store, auto-refresh on 401,
     clear tokens on logout, persist login state across app restart.
     → DONE WHEN: App restart with valid refresh token auto-logs in

  4. Create Zustand stores:
     authStore (user, isAuthenticated, login/logout actions),
     progressStore (current course, streak, daily XP),
     settingsStore (theme preference, notification settings, language)
     → DONE WHEN: Stores persist across navigation, reset on logout

  5. Create mobile/src/services/offline.ts:
     SQLite schema for cached lessons (expo-sqlite).
     Pre-download next 5 available lessons when on wifi.
     → DONE WHEN: Lessons load from SQLite when offline

  6. Create mobile/src/services/sync.ts:
     Queue lesson completions offline, push to API on reconnect.
     Conflict: server wins for XP (anti-cheat), client wins for completion.
     → DONE WHEN: Complete 3 lessons offline, go online, all sync correctly

  7. Create mobile/src/services/notifications.ts:
     Register for push via expo-notifications + FCM.
     Handle notification tap → deep link to correct screen.
     → DONE WHEN: Notification received + tap opens correct screen

  ANTI-PATTERNS:
  - Do NOT write raw fetch() calls — always use the generated API client
  - Do NOT store tokens in AsyncStorage — use expo-secure-store
  - Do NOT make sync logic complex — keep it simple (queue + flush)

---

Teammate "nav-auth" — Navigation & Authentication Screens:
  YOUR ROLE: Set up all app navigation and build the authentication flow screens.
  YOUR FILES:
    - mobile/app/_layout.tsx, app/index.tsx
    - mobile/app/(auth)/ (login.tsx, signup.tsx, forgot-password.tsx)
    - mobile/src/screens/onboarding/ (Welcome.tsx, LanguageSelect.tsx, GoalSelect.tsx)
    - mobile/src/components/auth/ (SocialLoginButtons.tsx, AuthForm.tsx)
  DO NOT TOUCH: (tabs)/, (lesson)/, services/, stores/, theme/
  DEPENDS ON: "ux-designer" (needs Button, Input, Card components)
             "data-layer" (needs authStore and auth service)

  TASKS:
  1. Set up Expo Router in app/_layout.tsx:
     Root layout with auth check → redirect to (auth)/login or (tabs)/home.
     Three route groups: (auth), (tabs), (lesson) as modal.
     → DONE WHEN: Unauthenticated user sees login, authenticated sees home

  2. Build onboarding flow (3 screens):
     Welcome (mascot waving + "Let's learn!" + Get Started button),
     LanguageSelect (grid of flags/languages),
     GoalSelect (5/10/15/20 min daily goal cards)
     → DONE WHEN: Flow completes and stores selections

  3. Build login screen:
     Email + password form, social login buttons (Google + Apple),
     "Don't have an account?" link to signup.
     Use ux-designer's Input and Button components.
     → DONE WHEN: Email login + Google OAuth work end-to-end

  4. Build signup screen:
     Display name, email, password, confirm password.
     Inline validation (email format, password strength, match).
     → DONE WHEN: Registration creates account and auto-logs in

  5. Implement auth guard:
     app/_layout.tsx checks authStore.isAuthenticated.
     If token expired and refresh fails → redirect to login.
     → DONE WHEN: Expired session gracefully redirects without crash

  6. Handle OAuth deep link callbacks:
     Expo AuthSession for Google + Apple sign-in.
     → DONE WHEN: Google sign-in works on iOS simulator + Android emulator

  ANTI-PATTERNS:
  - Do NOT build custom navigation — use Expo Router's file-based routing
  - Do NOT handle token logic in screens — delegate to auth service
  - Do NOT skip the mascot on onboarding — it's the user's first impression

---

Teammate "lesson-player" — Core Learning Experience:
  YOUR ROLE: Build the lesson player — the most important and complex screen.
  This is where users spend most of their time.
  YOUR FILES:
    - mobile/app/(lesson)/[id].tsx
    - mobile/src/components/lesson/ (ExerciseRenderer.tsx, MultipleChoice.tsx,
      FillBlank.tsx, Matching.tsx, Listening.tsx, WordArrange.tsx, Translation.tsx,
      LessonProgressBar.tsx, AnswerFeedback.tsx, HeartsDisplay.tsx)
    - mobile/src/screens/lesson/ (LessonResults.tsx, LessonIntro.tsx)
    - mobile/src/hooks/useLesson.ts, useLessonPlayer.ts
  DO NOT TOUCH: (tabs)/, (auth)/, services/ (use them, don't edit), theme/
  DEPENDS ON: "ux-designer" (needs UI components + Mascot)
             "data-layer" (needs API client + offline storage)

  TASKS:
  1. Create useLessonPlayer.ts hook — manages lesson state:
     current exercise index, answers given, score running total,
     hearts remaining, time elapsed. Handles next/submit flow.
     → DONE WHEN: Hook correctly tracks state through a 10-exercise lesson

  2. Create ExerciseRenderer.tsx — dynamically renders correct component
     based on exercise.type from the lesson JSON.
     → DONE WHEN: Given any of the 6 exercise types, renders the correct component

  3. Build exercise components (one file each):
     MultipleChoice — 4 tappable cards, highlight selected, submit button
     FillBlank — sentence with gap, text input, keyboard auto-focus
     Matching — two columns, tap to match pairs, connected when matched
     Listening — audio play button (expo-av), then answer options
     WordArrange — draggable word tiles (react-native-reanimated), snap to slots
     Translation — text input, free-form answer
     → DONE WHEN: Each component renders, accepts input, and reports answer to parent

  4. Build AnswerFeedback.tsx:
     Correct: green banner slides up + mascot "happy" + confetti particles
     Incorrect: red banner + correct answer shown + mascot "encouraging"
     Use Reanimated for smooth slide-in animation.
     → DONE WHEN: Both states animate smoothly with mascot integration

  5. Build LessonProgressBar.tsx — animated progress at top of screen.
     Shows current/total exercises, fills smoothly on each answer.
     → DONE WHEN: Bar fills proportionally, animates between exercises

  6. Build LessonResults.tsx — post-lesson summary:
     Mascot celebrating (perfect) or encouraging (< perfect).
     XP earned with animated counter, XP breakdown expandable.
     Streak update, "Continue" button to next lesson.
     → DONE WHEN: Results screen shows real data from API response

  7. Build LessonIntro.tsx — pre-lesson screen:
     Mascot "teaching" state, lesson title, exercise count,
     estimated time, "Start Lesson" button.
     → DONE WHEN: Intro displays, tapping Start loads exercises

  ANTI-PATTERNS:
  - Do NOT validate answers locally — send to API, show result from response
  - Do NOT block UI during API call — show optimistic feedback, confirm with API
  - Do NOT skip animations — they are core to the learning experience feel
  - Do NOT make exercises scrollable — one exercise fills the screen at a time

---

Teammate "home-progress" — Home, Course View & Profile:
  YOUR ROLE: Build the main app screens users see outside of lessons.
  YOUR FILES:
    - mobile/app/(tabs)/ (_layout.tsx, home.tsx, learn.tsx, profile.tsx)
    - mobile/src/screens/home/ (HomeScreen.tsx, DailyProgress.tsx, StreakWidget.tsx)
    - mobile/src/screens/learn/ (SkillTree.tsx, UnitCard.tsx, LessonNode.tsx)
    - mobile/src/screens/profile/ (ProfileScreen.tsx, StatsCard.tsx, SettingsScreen.tsx)
    - mobile/src/components/progress/ (XPBadge.tsx, StreakFire.tsx, LevelIndicator.tsx)
  DO NOT TOUCH: (auth)/, (lesson)/, services/, stores/, theme/
  DEPENDS ON: "ux-designer" (needs UI components + Mascot)
             "data-layer" (needs progressStore, API queries)

  TASKS:
  1. Set up tab navigator in app/(tabs)/_layout.tsx:
     3 tabs: Home (house icon), Learn (book icon), Profile (person icon)
     → DONE WHEN: Tabs render with icons, switching works

  2. Build HomeScreen:
     Mascot greeting (waving + time-based message: "Good morning!" etc.),
     DailyProgress card (XP today / daily goal, circular progress),
     StreakWidget (fire icon + count + "days" label, glows if at risk),
     "Continue Learning" button → navigates to current lesson.
     → DONE WHEN: Home shows real data from progressStore

  3. Build SkillTree (Learn tab):
     Vertical scrollable list of units.
     Each UnitCard contains a row of LessonNodes.
     LessonNode states: locked (gray, lock icon), available (colored, pulsing),
     completed (gold, checkmark), current (colored, play icon).
     Node tap → navigate to lesson (if available) or shake (if locked).
     → DONE WHEN: Tree reflects user progress, tapping available lesson opens it

  4. Build ProfileScreen:
     User avatar + display name, total XP badge, current level,
     StatsCard (lessons completed, words learned, time spent),
     achievement badges (placeholder grid),
     Settings button.
     → DONE WHEN: Profile shows real stats from API

  5. Build SettingsScreen:
     Notification preferences (toggle), daily goal adjustment,
     theme toggle (light/dark), sign out button.
     → DONE WHEN: Settings persist in settingsStore, sign out clears auth

  ANTI-PATTERNS:
  - Do NOT build a flat list for skill tree — it needs visual hierarchy (units → lessons)
  - Do NOT forget the mascot on the home screen — it's the first thing users see
  - Do NOT make home screen data-heavy on first load — use cached/optimistic data
```

---

## Phase 3–6 Teams

Follow the same prompt template pattern. Key additions for each phase:

**Phase 3 (Web)**: Add a "web-ux" teammate that adapts the mobile design system
for web. The mascot uses Lottie-web or CSS animations instead of Reanimated.
Include keyboard shortcuts for the lesson player.

**Phase 4 (Monetization)**: Add a "paywall-ux" teammate that designs the premium
upsell screens, ad placement UX, and the "your trial expires in X days" banners.
Mascot appears in subscription prompts ("Upgrade to keep me happy!").

**Phase 5 (Gamification)**: Add a "gamification-ux" teammate for leaderboard UI,
achievement animations, XP celebration screens, league promotion/demotion modals.
Heavy mascot integration — mascot reacts to every gamification event.

**Phase 6 (QA)**: Include a "ux-review" agent that audits visual consistency,
checks mascot appears in all required locations, validates dark mode support,
and tests responsive layouts on different screen sizes.

---

## Cost Management

| Approach | When | Relative Cost |
|----------|------|---------------|
| Plan mode | Before every team spawn | $ (cheap) |
| Subagents | Focused single tasks within a session | $$ |
| Agent team (3 agents) | Moderate parallel work | $$$ |
| Agent team (4-5 agents) | Full phase implementation | $$$$ |
| Agent team (5+ agents) | Complex phase with UX | $$$$$ |
| Doc-sync (1 agent) | Between phases | $$ |

**Rule of thumb**: Plan with plan mode (cheap), execute with teams (expensive),
sync docs with a single agent (moderate). Never run a team without planning first.

**Cost saving tip**: For Phase 1 (backend, your comfort zone), you might not need
the full team — you could work solo with subagents. Save the big team spawns for
Phase 2+ where you're learning React Native simultaneously.