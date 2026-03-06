Phase 1: Backend Foundation — Implementation Plan                     
                                     
 Context

 LinguaLeap is a Duolingo-style language learning platform. Phase 0 (planning/docs) is complete. Zero code exists — fully greenfield. We're spawning a 4-agent team to build the entire FastAPI
 backend: auth, courses, lessons, progress, SRS, and streaks. This plan maps every file to an agent, resolves doc conflicts, defines dependency order, and flags overload risks.

 ---
 1. Gaps & Conflicts Between Docs

 Must Resolve Before Spawning

 ┌─────┬───────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  #  │                               Issue                               │                                                      Resolution                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │     │ POST /lessons/{id}/complete listed under Lesson Endpoints in      │                                                                                                                       │
 │ G1  │ api-contracts.md but returns XP/streak data. agent-teams.md       │ Progress agent owns it. Route lives in src/progress/router.py with prefix /api/v1 and path                            │
 │     │ assigns it to progress agent, but content agent owns              │ /lessons/{lesson_id}/complete. Content agent does NOT implement it.                                                   │
 │     │ src/lessons/router.py.                                            │                                                                                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ G2  │ Leaderboard endpoint (GET /leaderboard/weekly) has no DB table,   │ Out of scope for Phase 1. Gamification is Phase 5. xp_events table exists for future leaderboard queries.             │
 │     │ only Redis sorted set. No agent assigned.                         │                                                                                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │     │ Subscription endpoints (GET /subscription/status, POST            │ Out of scope for Phase 1. Infra creates the subscriptions model. Service/router deferred to Phase 4. Stub             │
 │ G3  │ /subscription/verify, POST /webhooks/revenuecat) — no agent       │ get_user_features() in deps.py returns trial features.                                                                │
 │     │ assigned.                                                         │                                                                                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ G4  │ streaks.freeze_used_today in DB but no freeze API endpoint.       │ By design. Freeze consumption is automatic (on first daily check-in). No manual endpoint needed. Freeze granting tied │
 │     │                                                                   │  to subscription (Phase 4).                                                                                           │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ G5  │ lesson_id is VARCHAR(100) in DB (from content JSON) but API paths │ Use str not uuid.UUID for all lesson_id path params and DB columns. Same for exercise_id and concept_id.              │
 │     │  look like UUIDs.                                                 │                                                                                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │     │ GET /courses/{id} returns nested units/lessons with status        │ Content agent builds a ContentLoader that reads course manifests (JSON files listing units/lessons). Course detail    │
 │ G6  │ (locked/available/completed). But course structure lives on S3,   │ endpoint merges manifest with user's lesson_completions to compute status.                                            │
 │     │ not DB.                                                           │                                                                                                                       │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ G7  │ complete_lesson response includes achievements_unlocked and       │ Return achievements_unlocked: [] (Phase 5). For next_lesson, progress service reads course manifest via               │
 │     │ next_lesson.                                                      │ ContentLoader.                                                                                                        │
 ├─────┼───────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │     │ Content agent needs to query lesson_completions (progress model)  │ No circular service deps. Both agents import models directly from infra-owned files (e.g. from src.progress.models    │
 │ G8  │ for course detail. Progress agent needs ContentLoader (content)   │ import LessonCompletion), never through each other's service classes. Progress agent imports ContentLoader from       │
 │     │ for next_lesson.                                                  │ src.lessons.content_loader (content-owned file) to read manifests. Explicit spawn instruction: tell both agents these │
 │     │                                                                   │  exact import paths so they don't accidentally create service-to-service coupling.                                    │
 └─────┴───────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 ---
 2. Files By Agent

 Agent: INFRA (30 files)

 Foundation — all other agents depend on this.

 api/pyproject.toml                          # All dependencies
 api/.env.example                            # Env var template
 api/src/__init__.py
 api/src/main.py                             # FastAPI app factory, lifespan, router registration (see note below)
 api/src/core/__init__.py
 api/src/core/config.py                      # Settings(BaseSettings) — all env vars
 api/src/core/database.py                    # async engine, session factory, Base, TimestampMixin, get_db()
 api/src/core/redis.py                       # Redis pool, get_redis() dependency
 api/src/core/deps.py                        # get_db, get_current_user (placeholder), get_redis, get_settings, get_user_features (stub)
 api/src/core/exceptions.py                  # AppException, NotFoundError, ConflictError, UnauthorizedError + handler
 api/src/core/middleware.py                  # CORS config, request ID middleware
 api/src/auth/__init__.py
 api/src/auth/models.py                      # User, UserAuthProvider, RefreshToken
 api/src/courses/__init__.py
 api/src/courses/models.py                   # Course
 api/src/progress/__init__.py
 api/src/progress/models.py                  # UserCourseEnrollment, LessonCompletion, XPEvent, Achievement
 api/src/srs/__init__.py
 api/src/srs/models.py                       # SRSItem
 api/src/streaks/__init__.py
 api/src/streaks/models.py                   # Streak
 api/src/subscriptions/__init__.py
 api/src/subscriptions/models.py             # Subscription
 api/src/lessons/__init__.py
 api/src/middleware/__init__.py
 api/alembic.ini
 api/alembic/env.py                          # Async Alembic env with Base.metadata
 api/alembic/versions/001_initial_schema.py  # All 11 tables
 api/tests/__init__.py
 api/tests/conftest.py                       # test_db, async_client, create_test_user, test_redis fixtures
 infra/docker-compose.yml                    # postgres:16, redis:7, api service

 Router registration in main.py:
 Infra creates main.py with a create_app() factory. Since routers don't exist yet when infra runs, use lazy imports with try/except:
 def create_app() -> FastAPI:
     app = FastAPI(title="LinguaLeap API", version="0.1.0")
     # ... middleware, exception handlers, lifespan ...
     _register_routers(app)
     return app

 def _register_routers(app: FastAPI) -> None:
     router_modules = [
         "src.auth.router",
         "src.courses.router",
         "src.lessons.router",
         "src.progress.router",
         "src.srs.router",
         "src.streaks.router",
     ]
     for module_path in router_modules:
         try:
             module = importlib.import_module(module_path)
             app.include_router(module.router)
         except ImportError:
             pass  # Router not yet created by its agent
 Each agent simply creates their router.py with a router = APIRouter(...) — it gets picked up automatically. No agent needs to edit main.py.

 Key classes/functions:
 - Settings(BaseSettings) — DATABASE_URL, REDIS_URL, JWT_SECRET_KEY, JWT_ACCESS/REFRESH expiry, S3_*, OAUTH_*, CONTENT_DIR
 - Base(DeclarativeBase), TimestampMixin (id UUID PK, created_at, updated_at)
 - get_db() -> AsyncGenerator[AsyncSession]
 - get_redis() -> Redis
 - get_user_features() -> dict — stub returning trial defaults (show_ads: False, has_premium: True, streak_freeze: True). Progress agent uses this to check streak_freeze availability without needing
 Phase 4's subscription system.
 - AppException(Exception) with status_code + detail, registered as exception handler
 - All 11 SQLAlchemy models matching docs/database-schema.md exactly

 Agent: AUTH (11 files)

 api/src/auth/schemas.py         # RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, RefreshResponse, OAuthRequest, LogoutRequest
 api/src/auth/security.py        # hash_password(), verify_password(), create_access_token(), create_refresh_token(), decode_access_token(), hash_token()
 api/src/auth/service.py         # AuthService class
 api/src/auth/router.py          # 5 endpoints: register, login, refresh, logout, oauth/{provider}
 api/src/auth/deps.py            # get_current_user(token, db, settings) -> User
 api/src/middleware/rate_limit.py # RateLimiter class + rate_limit_auth dependency (Redis-based, 10/min/IP)
 api/tests/test_auth/__init__.py
 api/tests/test_auth/test_router.py    # Integration tests for all 5 endpoints
 api/tests/test_auth/test_service.py   # Unit tests for AuthService
 api/tests/test_auth/test_security.py  # JWT + password hashing tests
 api/tests/test_auth/test_rate_limit.py

 Key classes/functions:
 - AuthService.__init__(db, redis)
 - AuthService.register(email, password, display_name) -> TokenResponse
 - AuthService.authenticate(email, password) -> TokenResponse
 - AuthService.refresh_token(refresh_token) -> RefreshResponse
 - AuthService.revoke_token(refresh_token, user_id) -> None
 - AuthService.oauth_login(provider, id_token) -> TokenResponse
 - get_current_user(token, db, settings) -> User — extracts Bearer, validates JWT, loads User from DB

 Endpoints:

 ┌────────┬───────────────────────────────┬────────┬─────────────────┐
 │ Method │             Path              │ Status │    Response     │
 ├────────┼───────────────────────────────┼────────┼─────────────────┤
 │ POST   │ /api/v1/auth/register         │ 201    │ TokenResponse   │
 ├────────┼───────────────────────────────┼────────┼─────────────────┤
 │ POST   │ /api/v1/auth/login            │ 200    │ TokenResponse   │
 ├────────┼───────────────────────────────┼────────┼─────────────────┤
 │ POST   │ /api/v1/auth/refresh          │ 200    │ RefreshResponse │
 ├────────┼───────────────────────────────┼────────┼─────────────────┤
 │ POST   │ /api/v1/auth/logout           │ 204    │ —               │
 ├────────┼───────────────────────────────┼────────┼─────────────────┤
 │ POST   │ /api/v1/auth/oauth/{provider} │ 200    │ TokenResponse   │
 └────────┴───────────────────────────────┴────────┴─────────────────┘

 Agent: CONTENT (37 files)

 # Content pipeline (no project deps — can start immediately)
 content/schemas/multiple_choice.json
 content/schemas/fill_blank.json
 content/schemas/matching.json
 content/schemas/listening.json
 content/schemas/word_arrange.json
 content/schemas/translation.json
 content/schemas/course_manifest.json
 content/courses/es-en/manifest.json           # 2 units × 5 lessons, IDs + titles + order
 content/courses/es-en/units/1/lessons/1.json  # Sample lessons (10 files total)
 content/courses/es-en/units/1/lessons/2.json
 content/courses/es-en/units/1/lessons/3.json
 content/courses/es-en/units/1/lessons/4.json
 content/courses/es-en/units/1/lessons/5.json
 content/courses/es-en/units/2/lessons/1.json
 content/courses/es-en/units/2/lessons/2.json
 content/courses/es-en/units/2/lessons/3.json
 content/courses/es-en/units/2/lessons/4.json
 content/courses/es-en/units/2/lessons/5.json
 content/build.py                              # Validate JSON against schemas, generate versioned manifest

 # Validators (pure functions — no project deps)
 api/src/lessons/validators/__init__.py        # ValidatorResult dataclass + validate_answer() dispatcher
 api/src/lessons/validators/multiple_choice.py
 api/src/lessons/validators/fill_blank.py
 api/src/lessons/validators/matching.py
 api/src/lessons/validators/listening.py
 api/src/lessons/validators/word_arrange.py
 api/src/lessons/validators/translation.py

 # API layer (needs infra gate)
 api/src/courses/schemas.py                    # CourseOut, CourseListResponse, CourseDetailResponse, UnitOut, LessonSummaryOut, EnrollResponse
 api/src/courses/service.py                    # CourseService: list, detail (merges manifest + progress), enroll
 api/src/courses/router.py                     # 3 endpoints
 api/src/lessons/schemas.py                    # LessonOut, ExerciseSubmitRequest, ExerciseSubmitResponse
 api/src/lessons/service.py                    # LessonService: get_lesson, submit_answer
 api/src/lessons/router.py                     # 2 endpoints (GET + POST /submit only — NOT /complete)
 api/src/lessons/content_loader.py             # ContentLoader: load lesson JSON from filesystem/S3

 # Tests
 api/tests/test_courses/__init__.py
 api/tests/test_courses/test_router.py
 api/tests/test_courses/test_service.py
 api/tests/test_lessons/__init__.py
 api/tests/test_lessons/test_router.py
 api/tests/test_lessons/test_service.py
 api/tests/test_lessons/test_validators.py     # 30+ tests (5+ per validator × 6 types)

 Key classes/functions:
 - ContentLoader.__init__(settings) — loads from CONTENT_DIR (local) or S3 (prod)
 - ContentLoader.load_lesson(course_slug, unit_order, lesson_order) -> dict
 - ContentLoader.load_manifest(course_slug) -> dict
 - CourseService.list_courses() -> list[Course]
 - CourseService.get_course_detail(course_id, user_id) -> CourseDetailResponse — merges manifest + user progress
 - CourseService.enroll(course_id, user_id) -> UserCourseEnrollment
 - LessonService.get_lesson(lesson_id, course_id) -> LessonOut
 - LessonService.submit_answer(lesson_id, exercise_id, answer, user_id) -> ExerciseSubmitResponse
 - validate_answer(exercise_type, exercise_data, user_answer) -> ValidatorResult — dispatcher
 - 6 individual validators: validate_multiple_choice(), validate_fill_blank(), etc.

 Endpoints:

 ┌────────┬────────────────────────────────────┬────────┬────────────────────────┐
 │ Method │                Path                │ Status │        Response        │
 ├────────┼────────────────────────────────────┼────────┼────────────────────────┤
 │ GET    │ /api/v1/courses                    │ 200    │ CourseListResponse     │
 ├────────┼────────────────────────────────────┼────────┼────────────────────────┤
 │ GET    │ /api/v1/courses/{course_id}        │ 200    │ CourseDetailResponse   │
 ├────────┼────────────────────────────────────┼────────┼────────────────────────┤
 │ POST   │ /api/v1/courses/{course_id}/enroll │ 201    │ EnrollResponse         │
 ├────────┼────────────────────────────────────┼────────┼────────────────────────┤
 │ GET    │ /api/v1/lessons/{lesson_id}        │ 200    │ LessonOut              │
 ├────────┼────────────────────────────────────┼────────┼────────────────────────┤
 │ POST   │ /api/v1/lessons/{lesson_id}/submit │ 200    │ ExerciseSubmitResponse │
 └────────┴────────────────────────────────────┴────────┴────────────────────────┘

 Agent: PROGRESS (22 files)

 api/src/progress/schemas.py        # LessonCompleteRequest, LessonCompleteResponse, XPBreakdown, ProgressSummaryResponse, CourseProgressResponse, TodayStats
 api/src/progress/xp.py             # calculate_xp() pure function -> XPBreakdown
 api/src/progress/service.py        # ProgressService: complete_lesson, get_summary, get_course_progress
 api/src/progress/router.py         # 3 endpoints (including POST /lessons/{id}/complete)
 api/src/srs/sm2.py                 # sm2_algorithm() pure function -> SM2Result
 api/src/srs/schemas.py             # ReviewItemOut, ReviewNextResponse, ReviewSubmitRequest, ReviewSubmitResponse
 api/src/srs/service.py             # SRSService: get_due_items, submit_review
 api/src/srs/router.py              # 2 endpoints
 api/src/streaks/schemas.py         # StreakResponse
 api/src/streaks/service.py         # StreakService: get_streak, check_in, Redis cache read/write, freeze logic
 api/src/streaks/router.py          # 1 endpoint
 api/tests/test_progress/__init__.py
 api/tests/test_progress/test_router.py
 api/tests/test_progress/test_service.py
 api/tests/test_progress/test_xp.py      # XP calculation: all bonus combos
 api/tests/test_srs/__init__.py
 api/tests/test_srs/test_sm2.py          # SM-2 standard test vectors
 api/tests/test_srs/test_router.py
 api/tests/test_srs/test_service.py
 api/tests/test_streaks/__init__.py
 api/tests/test_streaks/test_service.py   # Timezone edge cases, freeze logic
 api/tests/test_streaks/test_router.py

 Key classes/functions:
 - calculate_xp(score, time_seconds, streak_count, expected_time=300) -> XPBreakdown — base=10, perfect_bonus=5, streak_bonus=min(streak,7), speed_bonus=0-3
 - sm2_algorithm(quality, ease_factor, interval, repetitions) -> SM2Result — standard SM-2
 - ProgressService.complete_lesson(user_id, lesson_id, request) -> LessonCompleteResponse — creates LessonCompletion + XPEvent, calls StreakService.check_in, updates enrollment position, updates
 Redis leaderboard, returns XP breakdown + streak + next_lesson
 - ProgressService.get_progress_summary(user_id) -> ProgressSummaryResponse
 - ProgressService.get_course_progress(user_id, course_id) -> CourseProgressResponse
 - SRSService.get_due_items(user_id, course_id, limit) -> ReviewNextResponse
 - SRSService.submit_review(user_id, concept_id, quality) -> ReviewSubmitResponse
 - StreakService.check_in(user_id, user_timezone) -> StreakInfo — timezone-aware, auto-freeze
 - StreakService.get_streak(user_id) -> StreakResponse — Redis-first, DB fallback

 Endpoints:

 ┌────────┬────────────────────────────────────────┬────────┬─────────────────────────┐
 │ Method │                  Path                  │ Status │        Response         │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ POST   │ /api/v1/lessons/{lesson_id}/complete   │ 200    │ LessonCompleteResponse  │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ GET    │ /api/v1/progress/me                    │ 200    │ ProgressSummaryResponse │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ GET    │ /api/v1/progress/me/course/{course_id} │ 200    │ CourseProgressResponse  │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ GET    │ /api/v1/review/next                    │ 200    │ ReviewNextResponse      │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ POST   │ /api/v1/review/submit                  │ 200    │ ReviewSubmitResponse    │
 ├────────┼────────────────────────────────────────┼────────┼─────────────────────────┤
 │ GET    │ /api/v1/streaks/me                     │ 200    │ StreakResponse          │
 └────────┴────────────────────────────────────────┴────────┴─────────────────────────┘

 ---
 3. Dependency Order

 Phase 1 ─────►  Phase 2 ─────────────────►  Phase 3 ──────►
                  (parallel after gate)

 INFRA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  T1: pyproject.toml
  T2: config.py
  T3: database.py (Base, TimestampMixin, get_db)
  T4: redis.py
  T5: exceptions.py, middleware.py
  T6: ALL models (11 tables across 6 model files)
  T7: deps.py (get_current_user placeholder)
  ════════════ GATE 1: T1-T7 done ═══════════════════════════
  T8: alembic setup + initial migration
  T9: conftest.py (test fixtures)
  T10: main.py (include all routers, wire middleware)
  ════════════ GATE 2: T8-T9 done (tests runnable) ═════════

 AUTH ─ ─ ─ (waits for Gate 1) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  * security.py can start before Gate 1 (pure crypto, no project imports)
  T1: schemas.py
  T2: security.py (JWT + password hashing)
  T3: service.py
  T4: deps.py (get_current_user real impl)
  T5: router.py
  T6: rate_limit.py
  ════════════ AUTH GATE: T4 done (get_current_user works) ══
  T7: tests (needs Gate 2)

 CONTENT ─ ─ (waits for Gate 1 for API layer) ─ ─ ─ ─ ─ ─ ─
  * These can start IMMEDIATELY (zero project deps):
  T1: content/schemas/*.json (7 JSON schemas)
  T2: content/courses/es-en/ (10 lesson files + manifest)
  T3: content/build.py
  T4: validators/ (6 pure functions + dispatcher)
  * These need Gate 1:
  T5: content_loader.py
  T6: courses schemas + service + router
  T7: lessons schemas + service + router
  * Tests need Gate 2 + Auth Gate:
  T8: all tests

 PROGRESS ─ ─ (waits for Gate 1 + redis) ─ ─ ─ ─ ─ ─ ─ ─ ─
  * These can start IMMEDIATELY (pure functions):
  T1: xp.py (calculate_xp)
  T2: sm2.py (sm2_algorithm)
  * These need Gate 1:
  T3: all schemas
  T4: streaks/service.py (needs Redis)
  T5: progress/service.py (needs StreakService + ContentLoader)
  T6: srs/service.py
  T7: all routers (needs Auth Gate for get_current_user)
  * Tests need Gate 2 + Auth Gate:
  T8: all tests

 Critical path: Infra Gate 1 → Auth deps.py → Integration tests

 Parallel opportunities:
 - Content T1-T4 and Progress T1-T2 can start simultaneously with Infra (zero deps)
 - Auth security.py can start simultaneously with Infra
 - After Gate 1, auth/content/progress API layers proceed in parallel

 ---
 4. Task Count & Agent Load

 ┌──────────┬───────┬───────┬────────────┬────────────┬──────────────────────────────────────────────────────────────────────┐
 │  Agent   │ Files │ Tasks │ Est. Tests │ Complexity │                               Verdict                                │
 ├──────────┼───────┼───────┼────────────┼────────────┼──────────────────────────────────────────────────────────────────────┤
 │ Infra    │ 30    │ 10    │ ~5         │ Medium     │ OK — boilerplate-heavy but straightforward. Critical path.           │
 ├──────────┼───────┼───────┼────────────┼────────────┼──────────────────────────────────────────────────────────────────────┤
 │ Auth     │ 11    │ 7     │ ~18        │ Medium     │ OK — OAuth verification is the hardest part.                         │
 ├──────────┼───────┼───────┼────────────┼────────────┼──────────────────────────────────────────────────────────────────────┤
 │ Content  │ 37    │ 8     │ ~45        │ High       │ OVERLOADED — most files, widest scope (pipeline + API + validators). │
 ├──────────┼───────┼───────┼────────────┼────────────┼──────────────────────────────────────────────────────────────────────┤
 │ Progress │ 22    │ 8     │ ~35        │ High       │ OK — intellectually hard (SM-2, timezone, Redis) but manageable.     │
 └──────────┴───────┴───────┴────────────┴────────────┴──────────────────────────────────────────────────────────────────────┘

 Content Agent Mitigation

 Content has ~37 files across 3 distinct domains: content pipeline, exercise validators, and API endpoints. Recommendations:

 1. Leverage parallelism within the agent: Content schemas + sample data + build.py + validators have zero project dependencies. The agent should complete all of these first, then move to API layer.
 2. Keep validators simple: Each is a pure function < 30 lines. The volume (6 files) is misleading — these are small.
 3. Course detail endpoint is the hardest single task: Merging manifest + user progress requires careful query design. This should be last.

 The content agent is busy but not critically overloaded — the work is distributed across simple, independent pieces. No agent split needed if the agent manages its ordering well.

 ---
 5. Unassigned / Deferred Work

 ┌─────────────────────────────────────────┬─────────────────────────────┬─────────┐
 │                  Item                   │            Owner            │  Phase  │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ GET /leaderboard/weekly                 │ Unassigned                  │ Phase 5 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ GET /subscription/status                │ Unassigned                  │ Phase 4 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ POST /subscription/verify               │ Unassigned                  │ Phase 4 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ POST /webhooks/revenuecat               │ Unassigned                  │ Phase 4 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ Subscription router/service/schemas     │ Unassigned                  │ Phase 4 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ Achievement checking engine             │ Unassigned                  │ Phase 5 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ Push notifications (src/notifications/) │ Unassigned                  │ Phase 2 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ get_user_features() full impl           │ Unassigned                  │ Phase 4 │
 ├─────────────────────────────────────────┼─────────────────────────────┼─────────┤
 │ OpenAPI spec validation                 │ Infra (built-in to FastAPI) │ Phase 1 │
 └─────────────────────────────────────────┴─────────────────────────────┴─────────┘

 Stubs needed in Phase 1:
 - get_user_features() in deps.py → returns {show_ads: False, has_premium: True, streak_freeze: True} (trial defaults)
 - achievements_unlocked: [] in complete_lesson response
 - subscriptions model created but no router/service

 ---
 6. Verification Plan

 After all agents complete:

 1. docker compose up starts PostgreSQL + Redis + API with no errors
 2. alembic upgrade head creates all 11 tables
 3. pytest api/tests/ -v passes all tests with 85%+ coverage
 4. Manual smoke test flow:
   - POST /auth/register → get tokens
   - GET /courses → see Spanish course
   - POST /courses/{id}/enroll → enroll
   - GET /courses/{id} → see units with lesson status
   - GET /lessons/{id} → get content_url
   - POST /lessons/{id}/submit → validate answer
   - POST /lessons/{id}/complete → get XP breakdown + streak
   - GET /progress/me → see summary
   - GET /review/next → get due SRS items
   - POST /review/submit → update SRS state
   - GET /streaks/me → see streak count
 5. GET /openapi.json returns valid OpenAPI 3.x spec with all endpoints documented