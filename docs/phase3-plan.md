# Phase 3A Plan: Math Backend

> Agent team: **math-backend** | 3 teammates | Phase 3A — Math Backend (video tables, endpoints, VideoStorage)

## Context
Phase 3A adds Khan Academy-style math courses to LinguaLeap. Users watch video lessons, reach 80% watch progress, quiz unlocks, quiz reuses existing exercise system. This requires new DB tables, a video storage abstraction, new API endpoints, math content, and a new exercise validator.

## Team: math-backend (3 teammates)

### Teammate 1: "video-infra" (starts IMMEDIATELY)
**Role**: Database models, migration, VideoStorage, config, static files mount

**Files to create/modify**:
- `api/src/video/__init__.py` (new, empty)
- `api/src/video/models.py` (new — VideoLesson with str PK, VideoProgress with UUID PK via TimestampMixin)
- `api/src/video/storage.py` (new — VideoStorage ABC, LocalVideoBackend, MuxVideoBackend stub)
- `api/src/courses/models.py` (add course_type + content_mode columns with server_default)
- `api/alembic/versions/003_add_video_tables.py` (new migration)
- `api/src/core/config.py` (add VIDEO_BACKEND, VIDEO_LOCAL_DIR, MUX_* settings)
- `api/src/main.py` (mount static files for videos, add video router to imports)
- `api/tests/conftest.py` (import new models so test DB creates tables)
- `content/videos/` (create dir + generate sample mp4s with ffmpeg)

**Key patterns to follow**:
- Models: `Base + TimestampMixin`, `Mapped[T]`, `mapped_column()` — see `api/src/courses/models.py`
- Config: Pydantic BaseSettings fields — see `api/src/core/config.py`
- Router registration: `("src.video.router", "router")` tuple in `_register_routers()` — see `api/src/main.py`
- VideoLesson.id is `String(100)` PK (NOT UUID) — must define created_at/updated_at manually instead of using TimestampMixin

**Gate 1**: Unblocks video-api and parts of math-content. Done when models exist, migration runs, LocalVideoBackend returns working URLs, static mount serves mp4s.

### Teammate 2: "video-api" (WAITS for video-infra Gate 1)
**Role**: Video endpoints, watch progress, quiz gating, course endpoint updates

**Files to create/modify**:
- `api/src/video/schemas.py` (new — VideoLessonOut, VideoProgressUpdateRequest/Response, VideoLessonSummaryOut)
- `api/src/video/service.py` (new — VideoLessonService with get_video_lesson, update_progress, get_quiz)
- `api/src/video/router.py` (new — 3 endpoints under /api/v1/video-lessons)
- `api/src/courses/service.py` (modify get_course_detail to branch on content_mode)
- `api/src/courses/schemas.py` (add course_type, content_mode to CourseOut; add VideoLessonSummaryOut)
- `api/tests/test_video/` (new — test_router.py, test_service.py)

**Key patterns to follow**:
- Service DI: `__init__(self, db: AsyncSession, ...)` — see `api/src/courses/service.py`
- Router: `APIRouter(prefix=..., tags=...)`, `Depends(get_current_user)` — see `api/src/lessons/router.py`
- Schemas: Pydantic v2, `model_config = {"from_attributes": True}` — see `api/src/courses/schemas.py`
- Quiz gating: check `video_progress.watch_percent >= video_lesson.watch_threshold_percent`
- Progress anti-cheat: never allow watch_percent to decrease

**Critical details**:
- GET /{id}/quiz returns 403 ForbiddenError if threshold not met
- Quiz exercises loaded via ContentLoader from `content/courses/{slug}/quizzes/{quiz_id}.json`
- Existing POST /lessons/{quiz_id}/submit handles quiz answer submission (no new endpoints)
- Course detail for video_quiz mode returns video_lessons grouped by unit_order

### Teammate 3: "math-content" (starts IMMEDIATELY for content + validator)
**Role**: number_input exercise type, math course content, build.py updates

**Files to create/modify**:
- `content/schemas/number_input.json` (new JSON Schema)
- `api/src/lessons/validators/number_input.py` (new — validate_number_input function)
- `api/src/lessons/validators/__init__.py` (add number_input to _VALIDATORS dispatcher)
- `content/courses/algebra-basics/manifest.json` (new math course manifest)
- `content/courses/algebra-basics/quizzes/*.json` (6 quiz files with math exercises)
- `content/build.py` (add number_input type, math course validation)
- `api/tests/test_lessons/test_validators.py` (add TestNumberInput class)

**Key patterns to follow**:
- Validator: `(exercise_data, user_answer) -> ValidatorResult` — see `api/src/lessons/validators/multiple_choice.py`
- Dispatcher: add to `_VALIDATORS` dict — see `api/src/lessons/validators/__init__.py`
- Schema: JSON Schema draft 2020-12 — see `content/schemas/multiple_choice.json`
- Tests: class-based grouping, call `validate_answer()` — see `api/tests/test_lessons/test_validators.py`

## Dependency Graph
```
video-infra (immediate)     math-content (immediate)
  |                           |
  T1-T7 (models, migration,  T1-T5 (schema, validator,
   storage, config, mount,     manifest, quizzes, tests)
   sample videos)              |
  |                           T6 (build.py update)
  |=== GATE 1 ===|            |
  |               |            |
  video-api       |            |
  T1-T5 (schemas, service,    |
   router, course mods,       |
   tests)                     |
  |                           |
  === ALL COMPLETE ============
```

## Critical Design Decisions
- `VIDEO_BACKEND=local` for development — NO Mux integration in this phase
- VideoStorage abstraction: LocalVideoBackend serves mp4 from `content/videos/` via FastAPI static files mount. MuxVideoBackend is a stub with `NotImplementedError`.
- `video_url` column stores full URL string — format changes per backend
- Quiz exercises use EXISTING exercise JSON format and EXISTING lesson endpoints (`POST /lessons/{quiz_id}/submit` and `/complete`). No new quiz endpoints needed.
- `course_type` column on courses: `'language'` (default) | `'math'`
- `content_mode` column on courses: `'exercise'` (default) | `'video_quiz'`
- All `lesson_id`, `exercise_id`, `quiz_id` are `str` (VARCHAR), not UUID

## Verification (after all agents complete)
1. `cd api && python -m pytest tests/` — all existing + new tests pass
2. `python content/build.py` — validates es-en + algebra-basics courses
3. `uvicorn src.main:app` — server starts without import errors
4. `curl http://localhost:8000/static/videos/sample1.mp4` — serves video
5. `GET /api/v1/courses` — returns both language and math courses
6. `POST /video-lessons/{id}/progress` with 83% → `quiz_unlocked: true`
7. `GET /video-lessons/{id}/quiz` → returns exercises (or 403 if < threshold)

## Potential Pitfalls
- **Course slug**: Existing code derives slug from `language_to-language_from`. Math courses need convention (e.g., `language_from="en"`, `language_to="math"`) or a new `content_slug` column
- **Unique constraint**: `uq_course_language_pair` on courses table may block multiple math courses — may need to be dropped or made conditional
- **FK type mismatch**: video_lessons.id is VARCHAR, video_progress.video_lesson_id must also be VARCHAR FK
- **ContentLoader for quizzes**: Need a `load_quiz()` method or path convention for `quizzes/{quiz_id}.json`

---

# Phase 3B Plan: Math Mobile

> Agent team: **math-mobile** | 3 teammates | Phase 3B — Video player, quiz flow, skill tree update

## Context
Phase 3A built the backend: video tables, 3 API endpoints (`GET /video-lessons/{id}`, `POST /video-lessons/{id}/progress`, `GET /video-lessons/{id}/quiz`), VideoStorage abstraction, course_type/content_mode on courses, number_input validator. Phase 3B adds the mobile experience so users can watch videos, take quizzes, and see math courses in the skill tree.

## 1. Gaps & Conflicts

### Shared Types vs API Contracts
- `shared/types/courses.ts` → `Course` interface is **MISSING** `course_type` and `content_mode` fields (api-contracts.md shows them in CourseListResponse)
- `shared/types/courses.ts` → `LessonSummary.type` is `"standard" | "review" | "checkpoint"` — **MISSING** `"video"` (api-contracts.md shows `type: "video"` for video_quiz courses)
- `shared/types/courses.ts` → `LessonSummary` **MISSING** video fields: `duration_seconds`, `thumbnail_url`, `watch_percent`, `quiz_unlocked`, `quiz_id` (all present in api-contracts.md CourseDetailResponse)
- `shared/types/lessons.ts` → `ExerciseType` union **MISSING** `"number_input"` (backend has 7 validators, mobile only has 6 exercise types)
- `shared/types/video.ts` → **DOES NOT EXIST** — need `VideoLessonDetailResponse`, `VideoProgressUpdateRequest`, `VideoProgressResponse` types

### API Client
- `shared/api-client/index.ts` → **NO** `videoLessons` namespace — must add `get`, `updateProgress`, `getQuiz` methods
- Client is hand-written (not auto-generated from OpenAPI) — no spec regeneration needed, just add methods manually

### expo-av
- **Already installed**: `expo-av: ^16.0.8` in `mobile/package.json` — no install needed

### Lesson Component Exports
- `ExerciseRenderer`, `AnswerFeedback`, `LessonProgressBar`, `HeartsDisplay`, `ExerciseTransition` → all **named exports**, individually importable ✅
- `ExerciseRenderer` switch handles 6 types — **MISSING** `"number_input"` case
- `ExerciseComponentProps` interface is **exported** from `ExerciseRenderer.tsx` — quiz-flow can reuse it

### SkillTree / UnitCard / LessonNode
- `SkillTree` → renders `FlatList<Unit>` of `UnitCard` — **no content_mode prop**, no branching for course type. No changes needed (delegates to UnitCard).
- `UnitCard` → renders `LessonNode` for every lesson — **no type check**. Must add branching: `lesson.type === "video"` → render `VideoLessonNode` instead.
- `LessonNode` → accepts `LessonSummary`, renders circular node with lock/play/check icons. **No video handling**. Routes to `/(lesson)/${lesson.id}` — note: does NOT pass `courseId` as URL param (existing gap).

### Zustand Stores
- `progressStore` → tracks `currentCourseId`, `dailyXP`, `dailyGoal`, `streak`. **No video progress fields needed** — video watch state is server-managed, queried via react-query, not local state. XP from quiz completion already flows through `useCompleteLessonMutation → addXP`.

### API Client Regeneration
- Not needed. Client is hand-written. video-player agent adds `videoLessons` namespace manually.

## 2. Files by Agent

### Teammate 1: "video-player" (starts IMMEDIATELY — no dependencies)
**Role**: Shared types, API client extensions, video playback screen, progress reporting

**NEW files to create**:
- `shared/types/video.ts` — `VideoLesson`, `VideoProgress`, `VideoLessonDetailResponse`, `VideoProgressUpdateRequest`, `VideoProgressResponse`
- `mobile/src/components/video/index.ts` — barrel export
- `mobile/src/components/video/VideoPlayer.tsx` — expo-av Video component with `onPlaybackStatusUpdate`, resume from `last_position_seconds`
- `mobile/src/components/video/VideoControls.tsx` — custom overlay: play/pause, seek bar, time display, speed (1x/1.25x/1.5x/2x), fullscreen. Auto-hides after 3s. Reanimated fade.
- `mobile/src/components/video/QuizUnlockBanner.tsx` — animated slide-up when `quiz_unlocked` flips to true. Mascot `happy` state + "Quiz Ready!" + navigate button
- `mobile/src/hooks/useVideoPlayer.ts` — manages: `isPlaying`, `positionSeconds`, `durationSeconds`, `watchPercent`, `playbackSpeed`, `isFullscreen`, `quizUnlocked`. 30s interval calls `useVideoProgressMutation`. Exposes: `play()`, `pause()`, `seek()`, `toggleFullscreen()`, `cycleSpeed()`
- `mobile/src/hooks/queries/useVideoLesson.ts` — `useVideoLessonQuery(id)`, `useVideoProgressMutation()`
- `mobile/app/(video)/_layout.tsx` — Stack with modal presentation (slide_from_bottom), matches `/(lesson)/_layout.tsx` pattern
- `mobile/app/(video)/[id].tsx` — video lesson screen: fetches via `useVideoLessonQuery`, renders VideoPlayer + title + description + teacher + quiz status section. "Take Quiz" button navigates to `/(video)/quiz?videoLessonId={id}&courseId={courseId}`

**EXISTING files to modify**:
- `shared/types/courses.ts` — add `course_type`, `content_mode` to `Course`; add `"video"` to `LessonSummary.type`; add optional `duration_seconds?`, `thumbnail_url?`, `watch_percent?`, `quiz_unlocked?`, `quiz_id?` to `LessonSummary`
- `shared/types/lessons.ts` — add `"number_input"` to `ExerciseType` union; add `NumberInputExercise` interface; add to `Exercise` discriminated union
- `shared/types/index.ts` — re-export `video.ts`
- `shared/api-client/index.ts` — add `videoLessons: { get, updateProgress, getQuiz }` namespace using existing `request<T>` helper
- `mobile/src/hooks/queries/queryKeys.ts` — add `videoLessons: { detail: (id) => ["videoLessons", id] }`
- `mobile/app/_layout.tsx` — add `(video)` Stack.Screen group (same pattern as `(lesson)`)

**Files to import from but NOT modify**:
- `mobile/src/components/mascot/` — Mascot component for QuizUnlockBanner
- `mobile/src/components/ui/` — Button, ProgressBar, Card
- `mobile/src/services/api.ts` — `apiClient` instance
- `mobile/src/theme/` — colors, typography, spacing

### Teammate 2: "quiz-flow" (WAITS for video-player Gate 1)
**Role**: NumberInput exercise component, quiz screen, quiz player hook

**Gate 1 dependency**: Needs from video-player: `shared/types/video.ts` exists, `apiClient.videoLessons.getQuiz()` exists, `/(video)/` route group exists, `NumberInputExercise` type in `shared/types/lessons.ts`

**NEW files to create**:
- `mobile/src/components/lesson/NumberInput.tsx` — numeric TextInput (`keyboardType="numeric"`), prompt display, submit button. Follows `ExerciseComponentProps` interface pattern.
- `mobile/src/components/quiz/index.ts` — barrel export
- `mobile/src/components/quiz/QuizIntro.tsx` — "Quiz" branding, exercise count, associated video title. Mascot `teaching` state + "Let's test what you learned!". "Start Quiz" + "Re-watch Video" buttons.
- `mobile/src/components/quiz/QuizLockBanner.tsx` — lock icon + "Watch more of the video to unlock" + progress toward threshold ("45% watched — need 80%"). Mascot `thinking` state.
- `mobile/src/hooks/useQuizPlayer.ts` — similar to `useLessonPlayer` but: no hearts system (Khan Academy style), uses `quiz_id` as `lessonId` for submit/complete mutations, phases: `"intro" | "exercise" | "feedback" | "results"`. Reuses `useSubmitAnswerMutation` and `useCompleteLessonMutation` from existing hooks.
- `mobile/src/hooks/queries/useQuiz.ts` — `useQuizQuery(videoLessonId)` fetches via `apiClient.videoLessons.getQuiz()`, handles 403 (locked) gracefully. Returns `{ exercises, isLocked, isLoading, error }`.
- `mobile/app/(video)/quiz.tsx` — quiz screen. Receives `videoLessonId`, `quizId`, `courseId` as params. Uses `useQuizQuery` for exercises, `useQuizPlayer` for state. Renders: QuizIntro → ExerciseRenderer + AnswerFeedback + LessonProgressBar → LessonResults.

**EXISTING files to modify**:
- `mobile/src/components/lesson/ExerciseRenderer.tsx` — add `import { NumberInput }` + `case "number_input": return <NumberInput {...props} />;`

**Files to import from but NOT modify**:
- `mobile/src/components/lesson/ExerciseRenderer.tsx` — imported by quiz screen (after quiz-flow's own modification)
- `mobile/src/components/lesson/AnswerFeedback.tsx` — reused in quiz screen
- `mobile/src/components/lesson/LessonProgressBar.tsx` — reused in quiz screen
- `mobile/src/components/lesson/ExerciseTransition.tsx` — reused in quiz screen
- `mobile/src/screens/lesson/LessonResults.tsx` — reused for quiz results
- `mobile/src/hooks/queries/useSubmitAnswer.ts` — reused by useQuizPlayer
- `mobile/src/hooks/queries/useCompleteLesson.ts` — reused by useQuizPlayer
- `mobile/src/components/mascot/` — Mascot for QuizIntro/QuizLockBanner
- `mobile/src/components/ui/` — Button, ProgressBar, Card

### Teammate 3: "skill-tree-update" (WAITS for video-player Gate 1)
**Role**: VideoLessonNode component, UnitCard branching for video lessons

**Gate 1 dependency**: Needs from video-player: updated `LessonSummary` type with `"video"` type and video fields, `/(video)/` route exists

**NEW files to create**:
- `mobile/src/screens/learn/VideoLessonNode.tsx` — rectangular card (visually distinct from circular LessonNode). Shows: thumbnail image (or play icon placeholder), duration badge ("12:30"), watch progress ring (`watch_percent`), quiz status indicator (lock/checkmark). Status-based: locked (greyed), available (primary accent + pulse animation), completed (gold). Navigates to `/(video)/${lesson.id}?courseId=${courseId}`. Reads `courseId` from `useProgressStore((s) => s.currentCourseId)`.

**EXISTING files to modify**:
- `mobile/src/screens/learn/UnitCard.tsx` — import `VideoLessonNode`; in `lessons.map()` add: `lesson.type === "video" ? <VideoLessonNode lesson={lesson} /> : <LessonNode lesson={lesson} />`. No other changes.

**Files to import from but NOT modify**:
- `mobile/src/screens/learn/LessonNode.tsx` — still renders for non-video lessons
- `mobile/src/stores/progressStore.ts` — `useProgressStore` for `currentCourseId`
- `mobile/src/theme/` — colors, typography, spacing
- `mobile/src/components/ui/` — ProgressBar (for watch progress ring)

## 3. Dependency Order

```
video-player (IMMEDIATE — Layer 0)
    │
    ├── T1: Create shared/types/video.ts
    ├── T2: Update shared/types/courses.ts + lessons.ts + index.ts
    ├── T3: Update shared/api-client/index.ts (add videoLessons namespace)
    ├── T4: Create useVideoLesson query hook + update queryKeys.ts
    ├── T5: Create useVideoPlayer hook
    ├── T6: Create VideoPlayer, VideoControls, QuizUnlockBanner components
    ├── T7: Create /(video)/_layout.tsx + [id].tsx route
    ├── T8: Update app/_layout.tsx with (video) group
    │
    ╠══ GATE 1 ══╣  (types + API client + route group exist)
    │            │
quiz-flow        skill-tree-update
(Layer 1)        (Layer 1 — parallel with quiz-flow)
    │                │
    ├── T1: NumberInput component      ├── T1: VideoLessonNode component
    ├── T2: Update ExerciseRenderer    ├── T2: Update UnitCard branching
    ├── T3: useQuiz query hook         │
    ├── T4: QuizIntro, QuizLockBanner  │
    ├── T5: useQuizPlayer hook         │
    ├── T6: /(video)/quiz.tsx route    │
    │                                  │
    ╚══════════ ALL COMPLETE ══════════╝
```

**Can all 3 start in parallel?** NO. video-player must go first because:
1. It creates `shared/types/video.ts` + updates `courses.ts`/`lessons.ts` — both other agents import these types
2. It adds `apiClient.videoLessons` namespace — quiz-flow calls `getQuiz()`
3. It creates the `/(video)/` route group — skill-tree-update navigates to it, quiz-flow adds `quiz.tsx` inside it

**quiz-flow and skill-tree-update CAN run in parallel** after Gate 1 — they touch zero overlapping files.

## 4. Existing Component Audit

### Phase 2 Components REUSED by Phase 3B (imported, not modified)

| Component | File | Used By |
|-----------|------|---------|
| `Mascot` | `mobile/src/components/mascot/Mascot.tsx` | video-player (QuizUnlockBanner), quiz-flow (QuizIntro, QuizLockBanner) |
| `Button` | `mobile/src/components/ui/Button.tsx` | video-player (video screen), quiz-flow (quiz screen) |
| `ProgressBar` | `mobile/src/components/ui/ProgressBar.tsx` | skill-tree-update (VideoLessonNode watch ring), quiz-flow (QuizLockBanner threshold) |
| `Card` | `mobile/src/components/ui/Card.tsx` | skill-tree-update (VideoLessonNode), video-player (video info card) |
| `AnswerFeedback` | `mobile/src/components/lesson/AnswerFeedback.tsx` | quiz-flow (quiz screen feedback overlay) |
| `LessonProgressBar` | `mobile/src/components/lesson/LessonProgressBar.tsx` | quiz-flow (quiz screen header) |
| `ExerciseTransition` | `mobile/src/components/lesson/ExerciseTransition.tsx` | quiz-flow (quiz exercise transitions) |
| `HeartsDisplay` | `mobile/src/components/lesson/HeartsDisplay.tsx` | NOT reused — quizzes have no hearts |
| `LessonResults` | `mobile/src/screens/lesson/LessonResults.tsx` | quiz-flow (quiz completion results) |
| `LessonNode` | `mobile/src/screens/learn/LessonNode.tsx` | skill-tree-update (still used for non-video lessons) |
| `useSubmitAnswerMutation` | `mobile/src/hooks/queries/useSubmitAnswer.ts` | quiz-flow (useQuizPlayer submits quiz answers) |
| `useCompleteLessonMutation` | `mobile/src/hooks/queries/useCompleteLesson.ts` | quiz-flow (useQuizPlayer completes quiz) |
| `useProgressStore` | `mobile/src/stores/progressStore.ts` | skill-tree-update (VideoLessonNode reads currentCourseId) |
| `useTheme` | `mobile/src/theme/` | All 3 agents |

### Phase 2 Components MODIFIED by Phase 3B

| Component | File | What Changes | Modified By |
|-----------|------|-------------|-------------|
| `ExerciseRenderer` | `mobile/src/components/lesson/ExerciseRenderer.tsx` | Add `case "number_input"` + import `NumberInput` | quiz-flow |
| `UnitCard` | `mobile/src/screens/learn/UnitCard.tsx` | Add `VideoLessonNode` import + type-based branching in `lessons.map()` | skill-tree-update |
| Root layout | `mobile/app/_layout.tsx` | Add `(video)` Stack.Screen group | video-player |

### Shared Files MODIFIED by Phase 3B

| File | What Changes | Modified By |
|------|-------------|-------------|
| `shared/types/courses.ts` | Add `course_type`, `content_mode` to Course; add `"video"` to LessonSummary.type; add video optional fields | video-player |
| `shared/types/lessons.ts` | Add `"number_input"` to ExerciseType; add NumberInputExercise | video-player |
| `shared/types/index.ts` | Re-export video types | video-player |
| `shared/api-client/index.ts` | Add `videoLessons` namespace with 3 methods | video-player |
| `mobile/src/hooks/queries/queryKeys.ts` | Add `videoLessons` key group | video-player |

## 5. NPM Dependencies

**No new packages needed.** All required packages already installed:
- `expo-av: ^16.0.8` — video playback (HLS + mp4)
- `react-native-reanimated: 4.2.1` — animations for controls, transitions
- `react-native-gesture-handler: ~2.30.0` — seek bar gestures
- `@tanstack/react-query: ^5.90.21` — video data fetching
- `react-native-svg: 15.15.3` — progress rings in VideoLessonNode
- `@expo/vector-icons: ^15.0.2` — play/pause/lock icons
- `zustand: ^5.0.11` — progressStore (read currentCourseId)

## 6. Verification Plan

### Full Video → Quiz Flow (simulator)
1. Start API: `cd api && uvicorn src.main:app`
2. Start mobile: `cd mobile && npx expo start --ios`
3. Enroll in "Algebra Basics" math course
4. Verify skill tree shows VideoLessonNode cards (thumbnails + durations) — not circular nodes
5. Tap first available video lesson → `/(video)/[id]` screen opens
6. Verify video plays from beginning (expo-av loads mp4 URL)
7. Verify custom controls: play/pause, seek, speed toggle, fullscreen
8. Watch past 80% → verify QuizUnlockBanner slides up with mascot
9. Tap "Take Quiz" → `/(video)/quiz` screen loads exercises
10. Verify ExerciseRenderer shows number_input exercises correctly
11. Complete quiz → LessonResults screen shows XP breakdown
12. Return to skill tree → video node shows completed state (checkmark)

### Regression: Language Flow Still Works
1. Switch to Spanish (es-en) course
2. Verify skill tree shows circular LessonNode (not video cards)
3. Complete an exercise lesson — full flow: intro → exercise → feedback → results
4. Verify progress, XP, streak all update correctly

### Both Course Types in Skill Tree
1. Verify `GET /api/v1/courses` returns both language and math courses
2. Switch between courses in the app
3. Language course → LessonNodes (circles)
4. Math course → VideoLessonNodes (rectangular cards with thumbnails)

### Edge Cases
- Resume video from last position (close + reopen video screen)
- Quiz locked state: try to take quiz before 80% → see QuizLockBanner
- Offline: video screen shows connection-required message (videos not cached)
- Quiz exercises cached after first fetch → works if connection drops mid-quiz

## Critical Design Decisions

- **Separate `/(video)/` route** — not branching inside `/(lesson)/[id]`. The video experience (playback + progress reporting + quiz gating) is fundamentally different from exercise-based lessons. Clean separation > single multipurpose screen.
- **Quiz via `/(video)/quiz.tsx`** — not reusing `/(lesson)/[id]`. Quiz exercises come from `GET /video-lessons/{id}/quiz`, not `GET /lessons/{id}`. Submission/completion DO reuse existing lesson endpoints (`POST /lessons/{quiz_id}/submit`). Dedicated quiz screen fetches differently but renders the same exercise components.
- **No hearts in quizzes** — Khan Academy style. Users can retry without penalty.
- **No progressStore changes** — video watch state is server-managed, queried via react-query. No Zustand additions needed.
- **VideoLessonNode reads courseId from progressStore** — avoids prop drilling through SkillTree → UnitCard → VideoLessonNode. Same approach as existing components.
