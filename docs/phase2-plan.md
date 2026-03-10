Plan: Write docs/phase2-plan.md

 Context

 Phase 1 backend is complete (16 endpoints + GET/PATCH /users/me = 18 endpoints, 189 tests, 11 DB models).
 Backend fixes applied: full content_url URLs, static file serving, SRS content_url populated.
 Phase 2 spawns 5 mobile agents. This task writes a single comprehensive plan file.

 Action

 Write docs/phase2-plan.md with the full content below. No other files modified.

 ---
 Full Content for docs/phase2-plan.md

 # Phase 2: Mobile App — Implementation Plan

 ## Context

 LinguaLeap is a Duolingo-style language learning platform. Phase 1 (Backend Core) is complete:
 18 API endpoints, 11 DB models, 6 exercise validators, 189 tests passing, Docker Compose stack running.
 The API serves at http://localhost:8000 with OpenAPI spec at /openapi.json and static content at /content.

 Phase 2 spawns a 5-agent team to build the React Native + Expo mobile app:
 ux-designer, data-layer, nav-auth, lesson-player, home-progress.

 This plan maps every file to an agent, resolves gaps, defines dependency order,
 specifies cross-agent contracts, and flags overload risks.

 ---

 ## 1. Gaps & Conflicts

 ### Must Resolve Before Spawning

 | # | Issue | Resolution |
 |---|-------|------------|
 | G1 | `docs/api-contracts.md` doesn't document `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `display_name` in `TokenResponse`, or `course_id` query param on `/complete`. | Agents read actual code, not just docs.
 Note in spawn prompts: "API has 18 endpoints — docs show 16. Also check router files directly." Doc-sync agent fixes after Phase 2. |
 | G2 | No password reset endpoint — `forgot-password.tsx` listed in agent-teams.md but no `POST /auth/forgot-password` exists. | Remove `forgot-password.tsx` from nav-auth scope. Replace with "Forgot password?" link
 that shows a "Coming soon" toast. |
 | G3 | No push notification backend (FCM is Phase 5) — `notifications.ts` in data-layer scope. | data-layer registers push token via expo-notifications and stores it locally. No server-side sending. Token ready for
 Phase 5 FCM integration. |
 | G4 | No hearts/lives backend — `HeartsDisplay.tsx` in lesson-player scope but no hearts table or endpoint. | Client-only display. Hardcode unlimited hearts during trial period. Hearts system is a monetization feature
 (Phase 4/5). HeartsDisplay shows the UI but hearts never decrement. |
 | G5 | SRS `content_url` points to course manifest (`manifest.json`), not to individual concept content. Mobile needs to render review exercises. | Mobile uses `concept_id` to look up the specific exercise from cached
 lesson content. The manifest URL helps identify the course. data-layer maintains a local concept-to-exercise mapping built during lesson downloads. |
 | G6 | Lesson `content_url` is a full URL (e.g. `http://localhost:8000/content/courses/es-en/units/1/lessons/1.json`). Mobile must fetch this separately to get exercises. | data-layer fetches content_url after getting
 lesson metadata. For offline: pre-download and cache in SQLite. ExerciseRenderer consumes the downloaded JSON, not the API response directly. |
 | G7 | `POST /lessons/{id}/submit` and `POST /lessons/{id}/complete` both require `course_id` as a query parameter. Mobile must track which course the user is currently in. | progressStore tracks `currentCourseId`.
 Lesson player receives courseId via navigation params. All lesson API calls include `?course_id={uuid}`. |
 | G8 | `shared/` and `mobile/` directories don't exist. No package.json, no Expo project, no TypeScript config. | data-layer scaffolds the entire Expo project as Task 0 before any other agent starts. Installs all npm
 dependencies. Creates tsconfig path aliases. |
 | G9 | Mascot asset files don't exist. ux-designer must create 10 SVG states from scratch. | ux-designer creates simple, expressive SVGs (< 5KB each). Use a friendly animal character. Placeholder SVGs are acceptable for
  Phase 2 — polish in Phase 6 QA. |
 | G10 | `shared/types/` doesn't exist. No TypeScript types for API responses. | data-layer generates types from OpenAPI spec using orval. Also manually creates `shared/types/` with exercise content types (LessonContent,
  Exercise union) that aren't in the API spec. |
 | G11 | `PATCH /users/me` accepts `daily_goal` (1-120 int) but it's unclear if this is minutes or XP. Onboarding GoalSelect shows 5/10/15/20 min options. | Treat daily_goal as minutes. GoalSelect stores the chosen
 value. SettingsScreen allows adjustment. home-progress compares `today.xp_earned` against a minutes-to-XP conversion (1 min ~ 2 XP). |
 | G12 | `UserProfileResponse` includes `daily_goal` and `timezone` but `ProgressSummaryResponse.today.goal_met` is a boolean. The backend decides goal logic. | Mobile trusts the backend's `goal_met` boolean for display.
  Also uses `daily_goal` from profile to show progress ring (XP earned / goal target). |

 ---

 ## 2. Files By Agent

 ### Agent: UX-DESIGNER (32 files)

 Design system, component library, mascot. No other agent creates UI primitives.

 Theme tokens

 mobile/src/theme/colors.ts              # ColorPalette interface, lightColors, darkColors
 mobile/src/theme/typography.ts           # Typography interface, font families + sizes
 mobile/src/theme/spacing.ts              # Spacing scale: xs=4, sm=8, md=12, base=16, lg=24, xl=32, xxl=48
 mobile/src/theme/shadows.ts              # Elevation levels: sm, md, lg
 mobile/src/theme/index.ts               # Barrel export + useTheme() hook

 UI Components

 mobile/src/components/ui/Button.tsx      # variant: primary|secondary|outline|ghost, size, loading, disabled
 mobile/src/components/ui/Card.tsx        # variant: elevated|outlined, padding, onPress
 mobile/src/components/ui/Input.tsx       # label, error, secureTextEntry, keyboardType
 mobile/src/components/ui/Badge.tsx       # variant: xp|streak|level|count|status
 mobile/src/components/ui/ProgressBar.tsx # progress 0-1, animated, showLabel, color
 mobile/src/components/ui/Modal.tsx       # visible, onClose, title, dismissOnBackdrop
 mobile/src/components/ui/Toast.tsx       # message, variant: success|error|info + showToast()
 mobile/src/components/ui/BottomSheet.tsx # visible, onClose, snapPoints
 mobile/src/components/ui/index.ts        # Barrel export

 Mascot

 mobile/src/components/mascot/Mascot.tsx         # state: MascotState, size: sm|md|lg, message
 mobile/src/components/mascot/MascotAnimated.tsx  # Reanimated enter/exit/transition animations
 mobile/src/components/mascot/MascotStatic.tsx    # SVG fallback renderer
 mobile/src/components/mascot/useMascotState.ts   # Derives MascotState from app context
 mobile/src/components/mascot/mascotAssets.ts     # State-to-SVG-import mapping
 mobile/src/components/mascot/index.ts            # Barrel export

 Mascot SVG assets (10 files)

 mobile/assets/mascot/idle.svg
 mobile/assets/mascot/happy.svg
 mobile/assets/mascot/celebrating.svg
 mobile/assets/mascot/encouraging.svg
 mobile/assets/mascot/thinking.svg
 mobile/assets/mascot/sad.svg
 mobile/assets/mascot/sleeping.svg
 mobile/assets/mascot/angry.svg
 mobile/assets/mascot/waving.svg
 mobile/assets/mascot/teaching.svg

 Shared mascot types

 shared/mascot/types.ts                  # MascotState type union (10 states)
 shared/mascot/constants.ts              # MASCOT_CONFIG: Record<MascotState, MascotStateConfig>

 Key exports consumed by other agents:
 - `useTheme()` → { colors, typography, spacing, shadows, isDark }
 - `<Button>`, `<Card>`, `<Input>`, `<Badge>`, `<ProgressBar>`, `<Modal>`, `<Toast>`, `<BottomSheet>`
 - `<Mascot state={...} size={...} message={...} />`
 - `useMascotState(context)` → { state: MascotState, message: string }
 - `showToast(message, variant)` — imperative toast API

 ---

 ### Agent: DATA-LAYER (28 files)

 API client, state management, offline, sync. Scaffolds the Expo project.

 Project scaffold (Task 0 — before all other agents)

 mobile/package.json                     # All dependencies
 mobile/tsconfig.json                    # Path aliases: @/ -> src/, @lingualeap/ -> ../shared/
 mobile/babel.config.js                  # Reanimated plugin
 mobile/app.json                         # Expo config
 mobile/.env                             # API_BASE_URL=http://localhost:8000

 Shared types (generated + manual)

 shared/types/auth.ts                    # TokenResponse, RefreshResponse, User, UserProfileResponse, UserUpdateRequest
 shared/types/courses.ts                 # Course, CourseDetail, Unit, LessonSummary, Enrollment
 shared/types/lessons.ts                 # Lesson, LessonContent, Exercise (discriminated union), ExerciseType
 shared/types/progress.ts                # ExerciseSubmitRequest/Response, LessonCompleteRequest/Response, XPBreakdown, ProgressSummary, CourseProgress
 shared/types/review.ts                  # ReviewItem, ReviewNextResponse, ReviewResponse
 shared/types/streaks.ts                 # StreakInfo
 shared/types/index.ts                   # Barrel export

 API client

 shared/api-client/generated.ts          # orval-generated typed client from OpenAPI spec
 shared/api-client/index.ts              # Re-exports with custom config

 Services

 mobile/src/services/api.ts              # QueryClient config, apiClient with auth interceptor + 401 refresh
 mobile/src/services/auth.ts             # SecureStore token management, refresh logic, hydrate on launch
 mobile/src/services/offline.ts          # SQLite schema, prefetchLessons(), getCachedLesson()
 mobile/src/services/sync.ts             # Queue lesson completions, flushQueue() on reconnect
 mobile/src/services/notifications.ts    # expo-notifications token registration, deep link handler

 Stores

 mobile/src/stores/authStore.ts          # user, isAuthenticated, isLoading, login/logout/hydrate actions
 mobile/src/stores/progressStore.ts      # currentCourseId, dailyXP, dailyGoal, streak, addXP/resetDaily
 mobile/src/stores/settingsStore.ts      # theme, notificationsEnabled, soundEnabled, hapticEnabled, hasCompletedOnboarding

 Hooks

 mobile/src/hooks/useAuth.ts             # Convenience wrapper: authStore + navigation
 mobile/src/hooks/useOnlineStatus.ts     # NetInfo wrapper: { isOnline, isWifi }
 mobile/src/hooks/queries/queryKeys.ts   # Centralized query key factory
 mobile/src/hooks/queries/useCourses.ts  # useCoursesQuery, useCourseDetailQuery
 mobile/src/hooks/queries/useLesson.ts   # useLessonQuery, useLessonContentQuery (fetches content_url)
 mobile/src/hooks/queries/useSubmitAnswer.ts   # useSubmitAnswerMutation
 mobile/src/hooks/queries/useCompleteLesson.ts # useCompleteLessonMutation (invalidates progress + streak)
 mobile/src/hooks/queries/useProgress.ts       # useProgressQuery, useCourseProgressQuery
 mobile/src/hooks/queries/useReview.ts         # useSRSQuery, useSubmitReviewMutation
 mobile/src/hooks/queries/useStreak.ts         # useStreakQuery
 mobile/src/hooks/queries/useUser.ts           # useUserProfileQuery, useUpdateUserMutation

 Key exports consumed by other agents:
 - All `use*Query` and `use*Mutation` hooks
 - `queryKeys` object for cache invalidation
 - `useAuthStore`, `useProgressStore`, `useSettingsStore`
 - `useAuth()` → { user, isAuthenticated, isLoading, login, register, oauthLogin, logout }
 - `useOnlineStatus()` → { isOnline, isWifi }
 - `getCachedLesson(lessonId)`, `prefetchLessons(courseId, lessonIds)`
 - All shared types from `@lingualeap/types`

 ---

 ### Agent: NAV-AUTH (14 files)

 Expo Router setup, auth screens, onboarding. First screens the user sees.

 Navigation structure

 mobile/app/_layout.tsx                  # Root layout: auth check, redirect logic, providers (QueryClient, theme)
 mobile/app/index.tsx                    # Entry redirect: onboarding → auth → tabs

 Auth screens

 mobile/app/(auth)/_layout.tsx           # Auth group layout (no tab bar)
 mobile/app/(auth)/login.tsx             # Email + password + social login buttons
 mobile/app/(auth)/signup.tsx            # Display name + email + password + confirm

 Onboarding screens

 mobile/src/screens/onboarding/Welcome.tsx        # Mascot waving + "Let's learn!" + Get Started
 mobile/src/screens/onboarding/LanguageSelect.tsx # Grid of language flags, stores selection
 mobile/src/screens/onboarding/GoalSelect.tsx     # 5/10/15/20 min daily goal cards, calls PATCH /users/me

 Auth components

 mobile/src/components/auth/SocialLoginButtons.tsx # Google + Apple OAuth buttons (expo-auth-session)
 mobile/src/components/auth/AuthForm.tsx           # Reusable email/password form with validation

 Onboarding route files

 mobile/app/(onboarding)/_layout.tsx              # Onboarding group layout (no back button)
 mobile/app/(onboarding)/welcome.tsx              # Routes to Welcome screen
 mobile/app/(onboarding)/language.tsx             # Routes to LanguageSelect
 mobile/app/(onboarding)/goal.tsx                 # Routes to GoalSelect

 Navigation flow:
 1. App launch → `_layout.tsx` calls `authStore.hydrate()`
 2. If not authenticated → `(auth)/login`
 3. If authenticated but `!hasCompletedOnboarding` → `(onboarding)/welcome`
 4. If authenticated + onboarded → `(tabs)/home`

 ---

 ### Agent: LESSON-PLAYER (18 files)

 The core learning experience. Most complex agent.

 Lesson route

 mobile/app/(lesson)/_layout.tsx         # Modal stack layout (covers tabs)
 mobile/app/(lesson)/[id].tsx            # Lesson screen: loads content, renders exercises

 Exercise components

 mobile/src/components/lesson/ExerciseRenderer.tsx  # Dispatches to correct component by exercise.type
 mobile/src/components/lesson/MultipleChoice.tsx     # 4 tappable cards, highlight selected
 mobile/src/components/lesson/FillBlank.tsx           # Sentence with gap, text input
 mobile/src/components/lesson/Matching.tsx             # Two columns, tap to match pairs
 mobile/src/components/lesson/Listening.tsx            # Audio play button + answer input (expo-av)
 mobile/src/components/lesson/WordArrange.tsx          # Draggable word tiles (reanimated + gesture-handler)
 mobile/src/components/lesson/Translation.tsx          # Free-form text input

 Lesson UI components

 mobile/src/components/lesson/LessonProgressBar.tsx # Animated progress bar at top
 mobile/src/components/lesson/AnswerFeedback.tsx    # Green/red banner + mascot + correct answer
 mobile/src/components/lesson/HeartsDisplay.tsx     # Hearts UI (unlimited in trial, visual only)
 mobile/src/components/lesson/ExerciseTransition.tsx # Reanimated slide-out/slide-in between exercises

 Screens

 mobile/src/screens/lesson/LessonIntro.tsx    # Mascot teaching + title + exercise count + "Start"
 mobile/src/screens/lesson/LessonResults.tsx  # Mascot celebrating/encouraging + XP counter + streak + "Continue"

 Hooks

 mobile/src/hooks/useLesson.ts           # Fetches lesson metadata + content JSON, returns exercises
 mobile/src/hooks/useLessonPlayer.ts     # State machine: current index, answers, score, hearts, time, submit flow

 ExerciseRenderer dispatch:
 exercise.type → Component
 ─────────────────────────
 multiple_choice → MultipleChoice
 fill_blank      → FillBlank
 matching        → Matching
 listening       → Listening
 word_arrange    → WordArrange
 translation     → Translation

 All exercise components implement:
 ```typescript
 interface ExerciseComponentProps<T extends Exercise> {
   exercise: T;
   onAnswer: (answer: string | string[]) => void;
   disabled: boolean;  // true while awaiting API response
 }

 ---
 Agent: HOME-PROGRESS (19 files)

 Main app screens: home, skill tree, profile, settings.

 # Tab navigator
 mobile/app/(tabs)/_layout.tsx           # 3 tabs: Home, Learn, Profile (with icons)
 mobile/app/(tabs)/home.tsx              # Routes to HomeScreen
 mobile/app/(tabs)/learn.tsx             # Routes to SkillTree
 mobile/app/(tabs)/profile.tsx           # Routes to ProfileScreen

 # Home screen
 mobile/src/screens/home/HomeScreen.tsx      # Mascot greeting + daily progress + streak + continue button
 mobile/src/screens/home/DailyProgress.tsx   # Circular progress ring: XP earned / daily goal
 mobile/src/screens/home/StreakWidget.tsx     # Fire icon + count + "days" + glow if at risk

 # Learn screen (skill tree)
 mobile/src/screens/learn/SkillTree.tsx      # FlatList of units, each with lesson nodes
 mobile/src/screens/learn/UnitCard.tsx       # Unit header + horizontal row of LessonNodes
 mobile/src/screens/learn/LessonNode.tsx     # Circular node: locked/available/completed/current states

 # Profile screen
 mobile/src/screens/profile/ProfileScreen.tsx    # Avatar + name + XP + level + stats + achievements
 mobile/src/screens/profile/StatsCard.tsx         # Lessons completed, words learned, time spent
 mobile/src/screens/profile/SettingsScreen.tsx    # Theme, notifications, daily goal, sound, sign out

 # Progress components (reusable)
 mobile/src/components/progress/XPBadge.tsx       # XP count with star icon
 mobile/src/components/progress/StreakFire.tsx     # Animated fire icon with count
 mobile/src/components/progress/LevelIndicator.tsx # Level number with progress ring to next level

 # Settings route
 mobile/app/(tabs)/settings.tsx          # Routes to SettingsScreen (pushed from profile)

 # Review screen (SRS)
 mobile/app/(tabs)/review.tsx            # Routes to review session using SRS query
 mobile/src/screens/review/ReviewSession.tsx # Simplified exercise renderer for SRS review items

 ---
 3. Dependency Order With Gates

 TIME ──────────────────────────────────────────────────────────────►

 DATA-LAYER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   T0: Scaffold Expo project (npx create-expo-app, install ALL deps)
   T1: tsconfig.json + babel.config.js + path aliases
   T2: shared/types/ (all TypeScript types from OpenAPI + content)
   T3: shared/api-client/ (orval codegen from /openapi.json)
   ════════════ GATE 1: Project exists, types + API client ready ═══
   T4: mobile/src/services/api.ts (QueryClient, auth interceptor)
   T5: mobile/src/services/auth.ts (SecureStore, token refresh)
   T6: mobile/src/stores/ (authStore, progressStore, settingsStore)
   T7: mobile/src/hooks/useAuth.ts, useOnlineStatus.ts
   T8: mobile/src/hooks/queries/ (all query + mutation hooks)
   ════════════ GATE 2: Data layer ready (stores + hooks usable) ═══
   T9: mobile/src/services/offline.ts (SQLite cache)
   T10: mobile/src/services/sync.ts (offline queue + flush)
   T11: mobile/src/services/notifications.ts (token registration)

 UX-DESIGNER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Waits for GATE 1 only (needs node_modules to import RN types)
   T1: shared/mascot/types.ts + constants.ts
   T2: mobile/src/theme/ (colors, typography, spacing, shadows)
   T3: mobile/src/components/ui/ (all 8 components)
   T4: mobile/assets/mascot/ (10 SVG files)
   T5: mobile/src/components/mascot/ (Mascot, MascotAnimated, MascotStatic)
   T6: mobile/src/components/mascot/useMascotState.ts
   ════════════ GATE 3: UI components + mascot ready ═══════════════

 NAV-AUTH ─ ─ ─ (waits for Gate 2 + Gate 3) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
   T1: mobile/app/_layout.tsx (root layout + providers)
   T2: mobile/app/index.tsx (entry redirect)
   T3: mobile/app/(auth)/_layout.tsx + login.tsx + signup.tsx
   T4: mobile/src/components/auth/ (SocialLoginButtons, AuthForm)
   T5: mobile/app/(onboarding)/ + onboarding screens (Welcome, LanguageSelect, GoalSelect)

 LESSON-PLAYER ─ (waits for Gate 2 + Gate 3) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
   * Can start ExerciseRenderer types/interfaces before Gate 3
   T1: mobile/src/hooks/useLesson.ts + useLessonPlayer.ts
   T2: mobile/app/(lesson)/_layout.tsx + [id].tsx
   T3: ExerciseRenderer.tsx + MultipleChoice.tsx (simplest first)
   T4: FillBlank.tsx + Translation.tsx (text input exercises)
   T5: Matching.tsx (tap-to-match state machine)
   T6: Listening.tsx (expo-av audio)
   T7: WordArrange.tsx (drag-and-drop — hardest)
   T8: LessonProgressBar.tsx + AnswerFeedback.tsx + HeartsDisplay.tsx
   T9: ExerciseTransition.tsx (slide animations)
   T10: LessonIntro.tsx + LessonResults.tsx

 HOME-PROGRESS ─ (waits for Gate 2 + Gate 3) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
   T1: mobile/app/(tabs)/_layout.tsx
   T2: HomeScreen.tsx + DailyProgress.tsx + StreakWidget.tsx
   T3: SkillTree.tsx + UnitCard.tsx + LessonNode.tsx
   T4: mobile/app/(tabs)/home.tsx + learn.tsx + profile.tsx
   T5: ProfileScreen.tsx + StatsCard.tsx
   T6: SettingsScreen.tsx + mobile/app/(tabs)/settings.tsx
   T7: XPBadge.tsx + StreakFire.tsx + LevelIndicator.tsx
   T8: ReviewSession.tsx + mobile/app/(tabs)/review.tsx

 Dependency Graph

               ┌──────────────┐
               │  DATA-LAYER  │
               │   T0-T3      │
               └──────┬───────┘
                      │
                ══ GATE 1 ══ (project scaffolded, types ready)
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           │           │
   ┌──────────────┐   │           │
   │ UX-DESIGNER  │   │           │
   │   T1-T6      │   │           │
   └──────┬───────┘   │           │
          │           │           │
          │    ┌──────▼───────┐   │
          │    │  DATA-LAYER  │   │
          │    │   T4-T8      │   │
          │    └──────┬───────┘   │
          │           │           │
          ══ GATE 3 ══ GATE 2 ══ │
               │           │      │
     ┌─────────┼─────┬─────┘      │
     │         │     │            │
     ▼         ▼     ▼            │
 ┌────────┐ ┌─────────────┐ ┌────▼───────────┐
 │NAV-AUTH│ │LESSON-PLAYER│ │ HOME-PROGRESS  │
 │ T1-T5  │ │   T1-T10    │ │    T1-T8       │
 └────────┘ └─────────────┘ └────────────────┘
                                      │
                               ┌──────▼───────┐
                               │  DATA-LAYER  │
                               │   T9-T11     │
                               │  (offline)   │
                               └──────────────┘

 What Can Start Immediately

 ┌───────────────┬───────────────────────────────────────────────────────────────────────────┐
 │     Agent     │                         Immediate Work (no gates)                         │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ data-layer    │ T0-T3: scaffold project, generate types, generate API client              │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ ux-designer   │ Nothing — needs node_modules from Gate 1                                  │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ nav-auth      │ Nothing — needs Gate 2 + Gate 3                                           │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ lesson-player │ Can design interfaces/types on paper, but needs Gate 1 to write .ts files │
 ├───────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ home-progress │ Nothing — needs Gate 2 + Gate 3                                           │
 └───────────────┴───────────────────────────────────────────────────────────────────────────┘

 What Needs Both Gate 2 AND Gate 3

 All screen-building agents (nav-auth, lesson-player, home-progress) need both:
 - Gate 2 (data-layer): to call API hooks and read stores
 - Gate 3 (ux-designer): to use Button, Input, Card, Mascot components

 ---
 4. Agent Load Analysis

 ┌───────────────┬───────┬───────┬─────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │     Agent     │ Files │ Tasks │ Complexity  │                                                         Verdict                                                         │
 ├───────────────┼───────┼───────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ ux-designer   │ 32    │ 6     │ Medium      │ OK — high file count but most are small SVGs and simple themed components. Mechanical work.                             │
 ├───────────────┼───────┼───────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data-layer    │ 28    │ 11    │ High        │ HEAVIEST — scaffolds project, generates types, builds API client, stores, query hooks, offline, sync. Critical path.    │
 ├───────────────┼───────┼───────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ nav-auth      │ 14    │ 5     │ Low-Medium  │ OK — lightest agent. Auth screens + onboarding are straightforward forms.                                               │
 ├───────────────┼───────┼───────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ lesson-player │ 18    │ 10    │ Very High   │ HARDEST SINGLE TASKS — WordArrange drag-and-drop and Matching state machine are the most complex components in the app. │
 ├───────────────┼───────┼───────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ home-progress │ 19    │ 8     │ Medium-High │ OK — SkillTree is moderately complex. ReviewSession reuses lesson-player patterns.                                      │
 └───────────────┴───────┴───────┴─────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Hardest Single Tasks (ranked)

 1. lesson-player: WordArrange.tsx (9/10) — Drag-and-drop word tiles using react-native-gesture-handler + reanimated. Dynamic drop zone sizing based on text width. Snap-to-slot animations. Undo by tapping placed tiles.
 2. data-layer: offline.ts + sync.ts (8/10) — SQLite schema design, pre-download strategy, queue-and-flush with conflict resolution (server wins XP, client wins completion). Partial sync failure handling.
 3. lesson-player: Matching.tsx (7/10) — Two-column tap-to-match. State machine tracks selected item, formed pairs, correct/incorrect feedback per pair. Animated line connections.
 4. home-progress: SkillTree.tsx (7/10) — FlatList of units with 4 lesson node states (locked/available/completed/current). Pulse animation on current. Scroll-to-current on load. Shake animation on locked tap.
 5. data-layer: auth.ts + 401 interceptor (6/10) — Token refresh with request queuing. Race condition prevention (single refresh mutex). SecureStore async integration.

 Overload Mitigation

 data-layer is overloaded but cannot be split — every other agent depends on its output. Mitigation:
 1. T0-T3 (scaffold + types + codegen) is fast mechanical work.
 2. T9-T11 (offline + sync + notifications) can happen AFTER screen agents start (they only need T4-T8).
 3. Offline sync (T10) is the only truly hard task — everything else follows established patterns.

 lesson-player has the hardest work but manageable file count. Mitigation:
 1. Build MultipleChoice first to establish the full exercise → submit → feedback cycle.
 2. Build text-input exercises next (FillBlank, Translation — similar pattern).
 3. Build Matching before WordArrange (complex state but no gestures).
 4. Build WordArrange last with full Reanimated + Gesture Handler investment.

 ---
 5. Cross-Agent Contracts

 5.1 UX-DESIGNER Exports → Other Agents Import

 Theme Hook:
 // mobile/src/theme/index.ts
 function useTheme(): {
   colors: ColorPalette;     // lightColors or darkColors based on settings
   typography: Typography;
   spacing: typeof spacing;
   shadows: typeof shadows;
   isDark: boolean;
 }

 Component Props (exact interfaces):

 // Button.tsx
 interface ButtonProps {
   variant: 'primary' | 'secondary' | 'outline' | 'ghost';
   size?: 'sm' | 'md' | 'lg';
   onPress: () => void;
   loading?: boolean;
   disabled?: boolean;
   fullWidth?: boolean;
   leftIcon?: React.ReactNode;
   children: React.ReactNode;
 }

 // Card.tsx
 interface CardProps {
   variant?: 'elevated' | 'outlined';
   padding?: 'none' | 'sm' | 'md' | 'lg';
   onPress?: () => void;
   disabled?: boolean;
   children: React.ReactNode;
   style?: ViewStyle;
 }

 // Input.tsx
 interface InputProps {
   label?: string;
   placeholder?: string;
   value: string;
   onChangeText: (text: string) => void;
   secureTextEntry?: boolean;
   error?: string;
   autoFocus?: boolean;
   keyboardType?: KeyboardTypeOptions;
   returnKeyType?: ReturnKeyTypeOptions;
   onSubmitEditing?: () => void;
   maxLength?: number;
   disabled?: boolean;
 }

 // Badge.tsx
 interface BadgeProps {
   variant: 'xp' | 'streak' | 'level' | 'count' | 'status';
   value: string | number;
   size?: 'sm' | 'md';
   icon?: React.ReactNode;
 }

 // ProgressBar.tsx
 interface ProgressBarProps {
   progress: number;              // 0 to 1
   height?: number;               // default 8
   color?: string;
   animated?: boolean;            // default true
   showLabel?: boolean;
   style?: ViewStyle;
 }

 // Modal.tsx
 interface ModalProps {
   visible: boolean;
   onClose: () => void;
   title?: string;
   children: React.ReactNode;
   showCloseButton?: boolean;
   dismissOnBackdrop?: boolean;
 }

 // Toast.tsx
 interface ToastProps {
   message: string;
   variant: 'success' | 'error' | 'info';
   visible: boolean;
   duration?: number;
   onDismiss: () => void;
 }
 function showToast(message: string, variant: 'success' | 'error' | 'info'): void;

 // BottomSheet.tsx
 interface BottomSheetProps {
   visible: boolean;
   onClose: () => void;
   snapPoints?: number[];
   children: React.ReactNode;
 }

 // Mascot.tsx
 interface MascotProps {
   state: MascotState;
   size?: 'sm' | 'md' | 'lg';    // sm=60, md=120, lg=200
   message?: string;              // speech bubble, omit for none
   animated?: boolean;            // default true
   onPress?: () => void;
   style?: ViewStyle;
 }

 // useMascotState.ts
 type MascotContext =
   | { screen: 'home' }
   | { screen: 'lesson'; lastAnswerCorrect?: boolean }
   | { screen: 'results'; score: number; isPerfect: boolean }
   | { screen: 'review' }
   | { screen: 'profile' };

 function useMascotState(context: MascotContext): {
   state: MascotState;
   message: string;
 }

 5.2 DATA-LAYER Exports → Other Agents Import

 Zustand Store Shapes:

 // authStore.ts
 interface AuthState {
   user: User | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   login: (email: string, password: string) => Promise<void>;
   register: (email: string, password: string, displayName: string) => Promise<void>;
   oauthLogin: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
   logout: () => Promise<void>;
   hydrate: () => Promise<void>;
 }

 // progressStore.ts
 interface ProgressState {
   currentCourseId: string | null;
   dailyXP: number;
   dailyGoal: number;
   streak: { current: number; longest: number; todayCompleted: boolean } | null;
   setCurrentCourse: (courseId: string) => void;
   addXP: (amount: number) => void;
   setStreak: (streak: StreakInfo) => void;
   setDailyGoal: (goal: number) => void;
   resetDaily: () => void;
 }

 // settingsStore.ts
 interface SettingsState {
   theme: 'light' | 'dark' | 'system';
   notificationsEnabled: boolean;
   soundEnabled: boolean;
   hapticEnabled: boolean;
   hasCompletedOnboarding: boolean;
   selectedLanguageTo: string | null;
   setTheme: (theme: 'light' | 'dark' | 'system') => void;
   toggleNotifications: () => void;
   toggleSound: () => void;
   toggleHaptic: () => void;
   completeOnboarding: () => void;
   setLanguage: (lang: string) => void;
 }

 Query Key Factory:

 // queryKeys.ts
 const queryKeys = {
   courses: {
     all: ['courses'] as const,
     detail: (id: string) => ['courses', id] as const,
   },
   lessons: {
     detail: (id: string, courseId: string) => ['lessons', id, courseId] as const,
     content: (id: string) => ['lessons', 'content', id] as const,
   },
   progress: {
     summary: ['progress', 'summary'] as const,
     course: (courseId: string) => ['progress', 'course', courseId] as const,
   },
   review: {
     next: (courseId?: string) => ['review', 'next', courseId] as const,
   },
   streak: {
     me: ['streak', 'me'] as const,
   },
   user: {
     profile: ['user', 'profile'] as const,
   },
 } as const;

 React Query Hooks:

 // Return types for each hook
 useCoursesQuery()                              → UseQueryResult<Course[]>
 useCourseDetailQuery(courseId)                  → UseQueryResult<CourseDetail>
 useLessonQuery(lessonId, courseId)              → UseQueryResult<Lesson>
 useLessonContentQuery(contentUrl)              → UseQueryResult<LessonContent>
 useSubmitAnswerMutation()                      → UseMutationResult<ExerciseSubmitResponse, Error, {lessonId, courseId, body}>
 useCompleteLessonMutation()                    → UseMutationResult<LessonCompleteResponse, Error, {lessonId, courseId, body}>
 useProgressQuery()                             → UseQueryResult<ProgressSummary>
 useCourseProgressQuery(courseId)                → UseQueryResult<CourseProgress>
 useSRSQuery(courseId?, limit?)                  → UseQueryResult<ReviewNextResponse>
 useSubmitReviewMutation()                      → UseMutationResult<ReviewResponse, Error, {conceptId, quality}>
 useStreakQuery()                                → UseQueryResult<StreakInfo>
 useUserProfileQuery()                          → UseQueryResult<UserProfileResponse>
 useUpdateUserMutation()                        → UseMutationResult<UserProfileResponse, Error, UserUpdateRequest>

 Offline/Sync:

 // offline.ts
 function prefetchLessons(courseId: string, lessonIds: string[]): Promise<void>;
 function getCachedLesson(lessonId: string): Promise<LessonContent | null>;
 function isLessonCached(lessonId: string): Promise<boolean>;

 // sync.ts
 function queueLessonCompletion(data: LessonCompleteRequest & { lessonId: string; courseId: string }): Promise<void>;
 function flushQueue(): Promise<{ synced: number; failed: number }>;
 function getPendingCount(): Promise<number>;

 // useOnlineStatus.ts
 function useOnlineStatus(): { isOnline: boolean; isWifi: boolean };

 5.3 Import Map (who imports what)

 ┌───────────────┬────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │   Consumer    │                      From ux-designer                      │                                                             From data-layer                                                             │
 ├───────────────┼────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ nav-auth      │ Button, Input, Card, Modal, Mascot, useTheme               │ useAuth, useAuthStore, useSettingsStore, useUpdateUserMutation                                                                          │
 ├───────────────┼────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ lesson-player │ Button, Input, Card, ProgressBar, BottomSheet, Mascot,     │ useSubmitAnswerMutation, useCompleteLessonMutation, useLessonQuery, useLessonContentQuery, queryKeys, useOnlineStatus, getCachedLesson, │
 │               │ useMascotState, useTheme                                   │  useProgressStore                                                                                                                       │
 ├───────────────┼────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ home-progress │ Button, Card, Badge, ProgressBar, Modal, Toast, Mascot,    │ useCoursesQuery, useCourseDetailQuery, useProgressQuery, useCourseProgressQuery, useStreakQuery, useSRSQuery, useUserProfileQuery,      │
 │               │ useMascotState, useTheme                                   │ useProgressStore, useAuthStore, useSettingsStore, queryKeys                                                                             │
 └───────────────┴────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 ---
 6. NPM Dependencies

 All installed by data-layer as part of Task 0.

 Expo Core

 ┌────────────────────┬─────────┐
 │      Package       │ Version │
 ├────────────────────┼─────────┤
 │ expo               │ ~52.0.0 │
 ├────────────────────┼─────────┤
 │ expo-router        │ ~4.0.0  │
 ├────────────────────┼─────────┤
 │ expo-status-bar    │ ~2.0.0  │
 ├────────────────────┼─────────┤
 │ expo-splash-screen │ ~0.29.0 │
 ├────────────────────┼─────────┤
 │ expo-constants     │ ~17.0.0 │
 ├────────────────────┼─────────┤
 │ expo-linking       │ ~7.0.0  │
 └────────────────────┴─────────┘

 Auth & Security

 ┌───────────────────┬─────────┐
 │      Package      │ Version │
 ├───────────────────┼─────────┤
 │ expo-auth-session │ ~6.0.0  │
 ├───────────────────┼─────────┤
 │ expo-secure-store │ ~14.0.0 │
 ├───────────────────┼─────────┤
 │ expo-web-browser  │ ~14.0.0 │
 ├───────────────────┼─────────┤
 │ expo-crypto       │ ~14.0.0 │
 └───────────────────┴─────────┘

 Media

 ┌────────────┬─────────┐
 │  Package   │ Version │
 ├────────────┼─────────┤
 │ expo-av    │ ~15.0.0 │
 ├────────────┼─────────┤
 │ expo-image │ ~2.0.0  │
 └────────────┴─────────┘

 Storage & Offline

 ┌─────────────────────────────────┬─────────┐
 │             Package             │ Version │
 ├─────────────────────────────────┼─────────┤
 │ expo-sqlite                     │ ~15.0.0 │
 ├─────────────────────────────────┼─────────┤
 │ expo-file-system                │ ~18.0.0 │
 ├─────────────────────────────────┼─────────┤
 │ @react-native-community/netinfo │ ~11.4.0 │
 └─────────────────────────────────┴─────────┘

 Notifications

 ┌────────────────────┬─────────┐
 │      Package       │ Version │
 ├────────────────────┼─────────┤
 │ expo-notifications │ ~0.29.0 │
 ├────────────────────┼─────────┤
 │ expo-device        │ ~7.0.0  │
 └────────────────────┴─────────┘

 UI & Animation

 ┌────────────────────────────────┬─────────┐
 │            Package             │ Version │
 ├────────────────────────────────┼─────────┤
 │ react-native-reanimated        │ ~3.16.0 │
 ├────────────────────────────────┼─────────┤
 │ react-native-gesture-handler   │ ~2.20.0 │
 ├────────────────────────────────┼─────────┤
 │ react-native-svg               │ ~15.8.0 │
 ├────────────────────────────────┼─────────┤
 │ react-native-svg-transformer   │ ~1.5.0  │
 ├────────────────────────────────┼─────────┤
 │ react-native-safe-area-context │ ~4.12.0 │
 ├────────────────────────────────┼─────────┤
 │ react-native-screens           │ ~4.1.0  │
 ├────────────────────────────────┼─────────┤
 │ lottie-react-native            │ ~7.1.0  │
 ├────────────────────────────────┼─────────┤
 │ @expo/vector-icons             │ ~14.0.0 │
 └────────────────────────────────┴─────────┘

 Data & State

 ┌───────────────────────────────────────────┬─────────┐
 │                  Package                  │ Version │
 ├───────────────────────────────────────────┼─────────┤
 │ @tanstack/react-query                     │ ~5.62.0 │
 ├───────────────────────────────────────────┼─────────┤
 │ zustand                                   │ ~5.0.0  │
 ├───────────────────────────────────────────┼─────────┤
 │ @react-native-async-storage/async-storage │ ~2.1.0  │
 └───────────────────────────────────────────┴─────────┘

 API Client Generation (devDependency)

 ┌─────────┬─────────┐
 │ Package │ Version │
 ├─────────┼─────────┤
 │ orval   │ ~7.3.0  │
 └─────────┴─────────┘

 Dev Dependencies

 ┌───────────────────────────────┬─────────┐
 │            Package            │ Version │
 ├───────────────────────────────┼─────────┤
 │ typescript                    │ ~5.6.0  │
 ├───────────────────────────────┼─────────┤
 │ eslint                        │ ~9.0.0  │
 ├───────────────────────────────┼─────────┤
 │ prettier                      │ ~3.4.0  │
 ├───────────────────────────────┼─────────┤
 │ jest                          │ ~29.7.0 │
 ├───────────────────────────────┼─────────┤
 │ @testing-library/react-native │ ~12.8.0 │
 └───────────────────────────────┴─────────┘

 Install command (data-layer runs this):
 npx create-expo-app@latest mobile --template expo-template-blank-typescript
 cd mobile
 npx expo install expo-router expo-status-bar expo-splash-screen expo-constants \
   expo-linking expo-auth-session expo-secure-store expo-web-browser expo-crypto \
   expo-av expo-image expo-sqlite expo-file-system expo-notifications expo-device \
   react-native-reanimated react-native-gesture-handler react-native-svg \
   react-native-safe-area-context react-native-screens lottie-react-native \
   @expo/vector-icons
 npm install @tanstack/react-query zustand @react-native-async-storage/async-storage \
   @react-native-community/netinfo react-native-svg-transformer
 npm install -D orval typescript eslint prettier jest @testing-library/react-native

 ---
 7. Verification Plan

 Smoke Test Flow — iOS Simulator

 1. App launch → splash screen → login screen (unauthenticated)
 2. Register → enter name/email/password → account created → onboarding starts
 3. Onboarding → Welcome (mascot waving) → LanguageSelect (pick Spanish) → GoalSelect (pick 10 min) → home screen
 4. Home screen → mascot greeting → daily progress shows 0 XP → streak shows 0 → "Continue Learning" button
 5. Learn tab → skill tree shows Spanish course → Unit 1 visible → Lesson 1 is "available" (pulsing) → Lessons 2+ are "locked"
 6. Tap Lesson 1 → LessonIntro (mascot teaching, "Greetings", 8 exercises) → tap "Start"
 7. Exercise 1 (multiple_choice) → 4 answer cards → tap correct → green banner + mascot happy → auto-advance
 8. Exercise 2 (fill_blank) → text input → type answer → submit → feedback
 9. Complete all 8 exercises → LessonResults → mascot celebrating → XP counter animates → streak updated → "Continue"
 10. Back to skill tree → Lesson 1 shows completed (gold checkmark) → Lesson 2 now "available"
 11. Profile tab → shows display name, total XP, level, stats
 12. Settings → toggle dark mode → theme changes → toggle notifications → sign out → returns to login

 Smoke Test Flow — Android Emulator

 Same as iOS, plus:
 - Back button behavior (Android hardware back) on all screens
 - Gesture navigation compatibility (swipe back)
 - Keyboard handling on input screens (no overlap)

 Offline Verification

 1. Enable airplane mode on device
 2. Open a previously loaded lesson → should render from SQLite cache
 3. Complete the lesson → should queue locally
 4. Check that "1 pending" indicator shows somewhere
 5. Disable airplane mode → queue flushes → XP updates

 Animation Checklist

 ┌──────────────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
 │              Animation               │            Screen            │           Library            │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Mascot bounce-in on appear           │ All mascot instances         │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Mascot state transition (cross-fade) │ Lesson feedback              │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Progress bar fill                    │ Lesson player top bar        │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Answer feedback slide-up             │ Lesson player                │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Exercise slide-out / slide-in        │ Between exercises            │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ XP counter increment                 │ Results screen               │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Streak fire glow                     │ Home screen (streak at risk) │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Lesson node pulse                    │ Skill tree (current lesson)  │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Lesson node shake                    │ Skill tree (tap locked node) │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Word tile drag-and-snap              │ WordArrange exercise         │ Gesture Handler + Reanimated │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Card press scale                     │ MultipleChoice answers       │ Reanimated                   │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ Dark mode transition                 │ Settings toggle              │ LayoutAnimation              │
 ├──────────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
 │ ```                                  │                              │                              │
 └──────────────────────────────────────┴──────────────────────────────┴──────────────────────────────┘