# Test IDs Reference for Detox E2E Tests

> This document lists all `testID` props that need to be added to components
> for Detox tests to find and interact with UI elements.
> **FE devs**: Add these `testID` props to the corresponding components.

---

## Auth Screens

### Login Screen — `app/(auth)/login.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `login-screen` | Root `SafeAreaView` | auth.test.ts |
| `login-mascot` | `<Mascot>` component | auth.test.ts |
| `login-error-banner` | Error `<View>` wrapper (the `errorBanner` styled view) | auth.test.ts |
| `login-signup-link` | "Sign Up" `<Text>` inside the `<Link>` | auth.test.ts |
| `google-login-button` | Google button inside `<SocialLoginButtons>` | auth.test.ts |
| `apple-login-button` | Apple button inside `<SocialLoginButtons>` | auth.test.ts |

### Login AuthForm — `src/components/auth/AuthForm.tsx` (mode="login")

| testID | Element | Used In |
|--------|---------|---------|
| `login-email-input` | Email `<Input>` (or TextInput) | auth.test.ts, lesson.test.ts, navigation.test.ts, video.test.ts |
| `login-password-input` | Password `<Input>` (or TextInput) | auth.test.ts, lesson.test.ts, navigation.test.ts, video.test.ts |
| `login-submit-button` | Login `<Button>` | auth.test.ts, lesson.test.ts, navigation.test.ts, video.test.ts |

### Signup Screen — `app/(auth)/signup.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `signup-screen` | Root `SafeAreaView` | auth.test.ts, onboarding.test.ts |
| `signup-error-banner` | Error `<View>` wrapper | auth.test.ts |
| `signup-login-link` | "Log In" `<Text>` inside the `<Link>` | auth.test.ts |

### Signup AuthForm — `src/components/auth/AuthForm.tsx` (mode="signup")

| testID | Element | Used In |
|--------|---------|---------|
| `signup-name-input` | Display name `<Input>` | auth.test.ts, onboarding.test.ts |
| `signup-email-input` | Email `<Input>` | auth.test.ts, onboarding.test.ts |
| `signup-password-input` | Password `<Input>` | auth.test.ts, onboarding.test.ts |
| `signup-submit-button` | Register `<Button>` | auth.test.ts, onboarding.test.ts |

---

## Onboarding Screens

### Welcome — `src/screens/onboarding/Welcome.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `onboarding-welcome-screen` | Root `SafeAreaView` | auth.test.ts, onboarding.test.ts |
| `onboarding-mascot` | `<Mascot>` component | onboarding.test.ts |
| `onboarding-get-started-button` | "Get Started" `<Button>` | onboarding.test.ts |

### Language/Subject Select — `src/screens/onboarding/LanguageSelect.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `onboarding-subject-screen` | Root `SafeAreaView` (step === 'subject') | onboarding.test.ts |
| `subject-english-card` | English `<TouchableOpacity>` card | onboarding.test.ts |
| `subject-math-card` | Math `<TouchableOpacity>` card | onboarding.test.ts |
| `math-category-screen` | Root `SafeAreaView` (step === 'math-category') | onboarding.test.ts |
| `math-category-back-button` | Back arrow `<TouchableOpacity>` on math categories | onboarding.test.ts |
| `math-category-sat` | SAT Prep `<TouchableOpacity>` row | onboarding.test.ts |
| `math-category-olympiad` | Olympiad `<TouchableOpacity>` row | onboarding.test.ts |
| `math-category-eyesh` | EYESH `<TouchableOpacity>` row | onboarding.test.ts |
| `math-category-class` | Class 1-12 `<TouchableOpacity>` row | onboarding.test.ts |
| `class-select-screen` | Root `SafeAreaView` (step === 'class-select') | onboarding.test.ts |
| `class-grade-{N}` | Individual class grade `<TouchableOpacity>` (N = 1..12) | onboarding.test.ts |

### Goal Select — `src/screens/onboarding/GoalSelect.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `onboarding-goal-screen` | Root `SafeAreaView` | onboarding.test.ts |
| `goal-casual-option` | Casual (5 min) option | onboarding.test.ts |
| `goal-regular-option` | Regular (10 min) option | onboarding.test.ts |
| `goal-serious-option` | Serious (15 min) option | onboarding.test.ts |
| `goal-intense-option` | Intense (20 min) option | onboarding.test.ts |

---

## Tab Navigation

### Tab Bar — `app/(tabs)/_layout.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `tab-home` | Home tab `Tabs.Screen` (add to `tabBarTestID`) | navigation.test.ts, lesson.test.ts, video.test.ts |
| `tab-learn` | Learn tab `Tabs.Screen` | navigation.test.ts, lesson.test.ts, video.test.ts |
| `tab-profile` | Profile tab `Tabs.Screen` | navigation.test.ts |
| `tab-review` | Review tab `Tabs.Screen` | navigation.test.ts |

---

## Home Screen

### HomeScreen — `src/screens/home/HomeScreen.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `home-screen` | Root `SafeAreaView` | auth.test.ts, navigation.test.ts, lesson.test.ts, video.test.ts |
| `home-greeting` | Greeting `<Text>` ("Good morning!") | navigation.test.ts |
| `home-mascot` | `<Mascot>` component wrapper `<View>` | navigation.test.ts |
| `home-daily-progress` | `<DailyProgress>` wrapper `<View>` | navigation.test.ts |
| `home-streak-widget` | `<StreakWidget>` wrapper `<View>` | navigation.test.ts |
| `home-continue-button` | "Continue Learning" `<Button>` | navigation.test.ts |

---

## Learn / Skill Tree

### SkillTree — `src/screens/learn/SkillTree.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `skill-tree-screen` | Root container | lesson.test.ts, navigation.test.ts, video.test.ts |
| `unit-card-{N}` | Unit card at index N | navigation.test.ts |

### LessonNode — `src/screens/learn/LessonNode.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `lesson-node-{N}` | Tappable lesson node at index N | lesson.test.ts |

### VideoLessonNode — `src/screens/learn/VideoLessonNode.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `video-lesson-node-{N}` | Tappable video lesson node at index N | video.test.ts |

---

## Lesson Player

### LessonIntro — `src/screens/lesson/LessonIntro.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `lesson-intro-screen` | Root container | lesson.test.ts |
| `lesson-intro-title` | Lesson title `<Text>` | lesson.test.ts |
| `lesson-intro-exercise-count` | Exercise count `<Text>` | lesson.test.ts |
| `lesson-intro-start-button` | "Start Lesson" `<Button>` | lesson.test.ts |

### Lesson Exercise Screen — `app/(lesson)/[id].tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `exercise-screen` | Root `SafeAreaView` (during exercise phase) | lesson.test.ts |
| `lesson-progress-bar` | `<LessonProgressBar>` component | lesson.test.ts |
| `hearts-display` | `<HeartsDisplay>` component | lesson.test.ts |
| `exercise-renderer` | `<ExerciseRenderer>` wrapper | lesson.test.ts |
| `lesson-close-button` | Close/X `<Button>` in header | lesson.test.ts |

### ExerciseRenderer — `src/components/lesson/ExerciseRenderer.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `exercise-check-button` | "Check" / Submit answer `<Button>` | lesson.test.ts |

### MultipleChoice — `src/components/lesson/MultipleChoice.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `mc-option-{N}` | Multiple choice option at index N | lesson.test.ts |

### FillBlank — `src/components/lesson/FillBlank.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `fill-blank-input` | Text input for fill-in-the-blank | lesson.test.ts |

### NumberInput — `src/components/lesson/NumberInput.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `number-input-field` | Numeric text input | lesson.test.ts |

### AnswerFeedback — `src/components/lesson/AnswerFeedback.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `answer-feedback` | Root container | lesson.test.ts |
| `feedback-continue-button` | "Continue" `<Button>` | lesson.test.ts |

### LessonResults — `src/screens/lesson/LessonResults.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `lesson-results-screen` | Root container | lesson.test.ts |
| `results-xp-earned` | XP earned display | lesson.test.ts |
| `results-continue-button` | "Continue" `<Button>` back to skill tree | lesson.test.ts |

---

## Profile Screen

### ProfileScreen — `src/screens/profile/ProfileScreen.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `profile-screen` | Root container | navigation.test.ts |
| `profile-display-name` | User name `<Text>` | navigation.test.ts |
| `profile-stats` | Stats section wrapper | navigation.test.ts |
| `profile-level-indicator` | `<LevelIndicator>` component | navigation.test.ts |
| `profile-xp-badge` | `<XPBadge>` component | navigation.test.ts |
| `profile-settings-button` | Settings gear/button | navigation.test.ts |

### SettingsScreen — `src/screens/profile/SettingsScreen.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `settings-screen` | Root container | navigation.test.ts |

---

## Review Screen

### ReviewSession — `src/screens/review/ReviewSession.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `review-screen` | Root container | navigation.test.ts |

---

## Video Lesson Screen

### VideoLessonScreen — `app/(video)/[id].tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `video-lesson-screen` | Root `<View>` (screen container) | video.test.ts |
| `video-back-button` | Back chevron `<TouchableOpacity>` | video.test.ts |
| `video-lesson-title` | Video title `<Text>` | video.test.ts |
| `video-teacher-name` | Teacher name `<Text>` | video.test.ts |

### VideoPlayer — `src/components/video/VideoPlayer.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `video-player` | Root video player wrapper | video.test.ts |
| `video-play-pause-button` | Play/Pause toggle button | video.test.ts |
| `video-playing-indicator` | Element visible when video is playing | video.test.ts |
| `video-paused-indicator` | Element visible when video is paused | video.test.ts |
| `video-speed-button` | Playback speed cycle button | video.test.ts |
| `video-progress-indicator` | Watch progress bar/ring | video.test.ts |

### VideoControls — `src/components/video/VideoControls.tsx`

> VideoControls may be integrated into VideoPlayer; assign testIDs on the actual rendered elements.

### QuizUnlockBanner — `src/components/video/QuizUnlockBanner.tsx`

| testID | Element | Used In |
|--------|---------|---------|
| `quiz-unlock-banner` | Root banner container | video.test.ts |
| `quiz-locked-indicator` | Locked state element (icon + "Watch X% to unlock") | video.test.ts |
| `quiz-threshold-text` | Threshold percentage text | video.test.ts |
| `quiz-unlocked-button` | "Start Quiz" button (visible when unlocked) | video.test.ts |

---

## Summary

**Total testIDs needed**: ~80

**Files that need testID additions** (sorted by priority):

1. `src/components/auth/AuthForm.tsx` — login/signup inputs + submit buttons
2. `app/(auth)/login.tsx` — screen wrapper, mascot, error, social, signup link
3. `app/(auth)/signup.tsx` — screen wrapper, error, login link
4. `src/screens/onboarding/Welcome.tsx` — screen, mascot, get-started button
5. `src/screens/onboarding/LanguageSelect.tsx` — screens, cards, categories, classes
6. `src/screens/onboarding/GoalSelect.tsx` — screen, goal options
7. `app/(tabs)/_layout.tsx` — tab bar items (`tabBarTestID` prop)
8. `src/screens/home/HomeScreen.tsx` — screen, greeting, widgets, button
9. `src/screens/learn/SkillTree.tsx` — screen
10. `src/screens/learn/LessonNode.tsx` — tappable nodes
11. `src/screens/learn/VideoLessonNode.tsx` — tappable video nodes
12. `src/screens/lesson/LessonIntro.tsx` — screen, title, count, start button
13. `app/(lesson)/[id].tsx` — exercise screen, header elements
14. `src/components/lesson/ExerciseRenderer.tsx` — renderer wrapper, check button
15. `src/components/lesson/MultipleChoice.tsx` — option items
16. `src/components/lesson/FillBlank.tsx` — input field
17. `src/components/lesson/NumberInput.tsx` — input field
18. `src/components/lesson/AnswerFeedback.tsx` — feedback, continue button
19. `src/screens/lesson/LessonResults.tsx` — screen, XP, continue button
20. `src/screens/profile/ProfileScreen.tsx` — screen, name, stats, settings button
21. `src/screens/profile/SettingsScreen.tsx` — screen
22. `src/screens/review/ReviewSession.tsx` — screen
23. `app/(video)/[id].tsx` — screen, back button, title, teacher name
24. `src/components/video/VideoPlayer.tsx` — player, controls, indicators
25. `src/components/video/QuizUnlockBanner.tsx` — banner, locked/unlocked states
