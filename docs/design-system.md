# Design System — LinguaLeap

> Kid-friendly, warm, playful. Duolingo energy meets Khan Academy depth.
> This guide is for FE agents building screens and components.

## Core Principles

1. **Warm, not cold.** Cream backgrounds, warm grays, soft shadows. Never cold blues/grays for surfaces.
2. **Playful, not chaotic.** Bouncy animations and bright accents, but consistent and predictable layouts.
3. **Readable first.** Kids have developing vision. Big text, high contrast, generous spacing.
4. **Encouraging, not punishing.** Green = correct, gentle red = try again. Never scary. Mascot always helps.
5. **Dark mode = nighttime adventure.** Soft navy, not black. Stars-and-moon vibe, not coding-terminal vibe.

---

## Color Usage Guide

### When to Use Each Color

| Color | Token | Use For | Never For |
|-------|-------|---------|-----------|
| **Primary green** | `primary` | Main CTA buttons, correct answers, progress bars, lesson completion | Error states, destructive actions |
| **Primary light** | `primaryLight` | Hover/highlight on green elements, progress bar backgrounds | Body text |
| **Secondary purple** | `secondary` | Achievements, badges, premium content, special events, rewards | Primary actions, navigation |
| **Accent blue** | `accent` | Links, info tooltips, interactive hints, video play buttons | Error states, success states |
| **XP Gold** | `xpGold` | XP counters, coin animations, reward pop-ups, level-up badges | Regular text, backgrounds |
| **Streak Orange** | `streakOrange` | Streak fire icon, streak counter, daily reminders | Error states (use `error` for errors) |
| **Error red** | `error` | Wrong answers, form validation errors, connection failures | Primary buttons, navigation, CTAs |
| **Warning amber** | `warning` | Streak about to break, low hearts, gentle alerts | Success feedback |

### Light vs Dark Mode

- **Light mode** uses warm cream (`#FFFDF7`) as the base background. Cards are white to float above it.
- **Dark mode** uses deep navy (`#1A1A2E`) as the base. Cards use slightly lighter navy (`#242445`).
- Never use pure black (`#000000`) or pure white (`#FFFFFF`) for text — use `text` and `textInverse` tokens.
- Colored elements (green buttons, gold badges) stay vibrant in dark mode — they're slightly brightened, not dimmed.

### Contrast Requirements

All text must meet WCAG AA (4.5:1 minimum contrast ratio):

| Text Token | Light BG Ratio | Dark BG Ratio | Usage |
|------------|---------------|---------------|-------|
| `text` | 14.2:1 | 13.3:1 | Primary body text, headings |
| `textSecondary` | 4.7:1 | 6.3:1 | Secondary labels, descriptions |
| `textTertiary` | 3.1:1 | 3.5:1 | Placeholders, decorative text only (not essential info) |

> `textTertiary` does NOT pass AA for normal text. Use only for non-essential hints and placeholders, or for large text (18px+/bold 14px+).

---

## Typography Guidelines

### Size Rules for Kids

- **Body text**: Always 16px (`body`). Never smaller for primary content.
- **Secondary info**: 14px (`bodySmall`) — acceptable for metadata, timestamps.
- **Captions**: 13px (`caption`) — absolute minimum. Only for badges, footnotes, timestamps.
- **Headings**: 20px+ — always bold (700+). Kids scan headings first.

### Weight Rules

- **No thin fonts.** Minimum 400 for body, 500 for small text, 600+ for headings.
- **Buttons always bold (700).** Kids need clear tap targets.

### Line Height

- Body: 1.5x (24px for 16px font) — gives reading room.
- Small text: generous (1.5x+) — prevents cramped feeling.
- Headings: tighter (1.3-1.4x) — acceptable because they're large.

---

## Spacing Patterns

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | Icon-to-text gap, tight internal padding |
| `sm` | 8px | Between related items (e.g., badge icon and label) |
| `md` | 12px | Card internal padding (compact), between form fields |
| `base` | 16px | Standard padding, between unrelated items, card padding |
| `lg` | 24px | Section spacing, between cards in a list |
| `xl` | 32px | Major section breaks, screen top/bottom padding |
| `xxl` | 48px | Hero spacing, mascot area, large breathing room |

### Common Patterns

```
Screen layout:
  SafeArea top padding:    xl (32px)
  Horizontal padding:      base (16px)
  Section gap:             lg (24px)
  Card internal padding:   base (16px)
  Card gap (in list):      md (12px)
  Bottom action area:      xl (32px) padding, pinned to bottom

Button:
  Horizontal padding:      lg (24px)
  Vertical padding:        md (12px)
  Border radius:           16px (rounded, friendly)
  Min touch target:        48px height (accessibility)

Input:
  Horizontal padding:      base (16px)
  Vertical padding:        md (12px)
  Border radius:           12px
  Min height:              48px
```

---

## Screen Layout Template

Every screen should follow this structure:

```
┌─────────────────────────────────────────┐
│ SafeAreaView (background color)         │
│ ┌─────────────────────────────────────┐ │
│ │ Header (optional)                   │ │
│ │  - Back arrow or close              │ │
│ │  - Title (heading3)                 │ │
│ │  - Right action (optional)          │ │
│ ├─────────────────────────────────────┤ │
│ │ ScrollView / FlatList               │ │
│ │  contentContainerStyle:             │ │
│ │    paddingHorizontal: base (16)     │ │
│ │    paddingBottom: xxl (48)          │ │
│ │                                     │ │
│ │  [Content here]                     │ │
│ │                                     │ │
│ ├─────────────────────────────────────┤ │
│ │ Bottom Action Bar (sticky)          │ │
│ │  paddingHorizontal: base (16)       │ │
│ │  paddingVertical: md (12)           │ │
│ │  [Primary CTA button, full width]   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- Header uses `surfaceElevated` background in light mode, `surface` in dark mode.
- Bottom action bar gets a top border (`borderLight`) and `surfaceElevated` background.
- Content area uses `background` color.

---

## Animation Guidelines

Import from `mobile/src/theme/animations.ts`. Key presets:

### When to Animate

| Scenario | Preset | Notes |
|----------|--------|-------|
| Button press | `SPRING.snappy` | Quick scale 0.95 on press, 1.0 on release |
| Correct answer | `FEEDBACK.correct` | Green flash + scale pop |
| Wrong answer | `FEEDBACK.incorrect` | Horizontal shake (never scary) |
| XP earned | `FEEDBACK.xpGain` | Gold coin floats up and fades |
| Mascot appears | `MASCOT.entrance` | Slides up with bounce |
| Mascot reacts | `MASCOT.pulse` or `MASCOT.celebrate` | Scale pulse on events |
| Screen enters | `TRANSITION.fadeIn` or `TRANSITION.slideUp` | 300ms, ease-out |
| List items | `TRANSITION.scaleIn` + `staggerDelay * index` | Stagger 50ms per item |
| Modal/sheet | `TRANSITION.slideUp` | Spring-based slide from bottom |

### Animation Don'ts

- No flashing/strobing (photosensitivity risk for kids).
- No rotation >15 degrees (can cause disorientation).
- No animations longer than 800ms for feedback (feels sluggish).
- No motion during active input (typing, dragging) — only on completion events.
- Respect `prefers-reduced-motion` — skip spring/bounce, use simple fade.

---

## Mascot Usage Guide

The fox mascot has 11 emotional states. Use them intentionally:

| State | When to Show | Screen / Context |
|-------|-------------|-----------------|
| **happy** | Default positive state | Home screen, profile |
| **waving** | First-time greeting, welcome back | Onboarding, daily first open |
| **teaching** | Explaining something new | Lesson intro, new concept, video intro |
| **thinking** | User is working on a problem | During exercise (before answer) |
| **encouraging** | After a wrong answer | "Try again!" feedback |
| **celebrating** | Correct answer, lesson complete | Answer feedback, results screen |
| **sad** | Lost all hearts, streak broken | Hearts empty, streak lost |
| **angry** | Never in normal flow | Reserved for future gamification edge cases |
| **sleeping** | Late-night reminder, idle | Streak reminder notification, long idle |
| **idle** | Background/ambient | Settings, loading states |
| **base** | Neutral fallback | Any context where no specific emotion fits |

### Mascot Placement Rules

- Mascot appears at the **top or center** of the screen, never at the bottom (too close to buttons).
- Mascot is **80-120px** tall depending on context (larger on results, smaller during exercises).
- Mascot always has **at least 16px** spacing from surrounding elements.
- During exercises, mascot is **small and off to the side** — don't distract from the question.
- On results/celebration screens, mascot is **centered and large** — it's the star.
- Mascot speech bubbles use `card` background with `border` outline, 12px border radius.

---

## Component-Specific Guidelines

### Buttons

- **Primary (green):** Main actions — "Continue", "Check", "Start Lesson". Uses `primary` color.
- **Secondary (outline):** Alternative actions — "Skip", "Later". Uses `border` outline + `text` color.
- **Danger (red):** Only for truly destructive actions (delete account). Uses `error` color. Rare.
- All buttons: 48px minimum height, 16px border radius, bold text, no thin outlines.
- Pressed state: scale to 0.95 with `SPRING.snappy`.

### Cards

- White in light mode (`card`), dark navy in dark mode (`card`).
- 16px border radius — rounded and friendly.
- `shadows.sm` for flat cards, `shadows.md` for interactive/tappable cards.
- 16px internal padding (`base`).

### Progress Bars

- Use `primary` (green) for the fill, `surface` for the track.
- Minimum 8px height (visible for kids).
- Rounded ends (border radius = half height).
- Animate fill changes with `DURATION.normal` + `EASING.easeOut`.

### Skill Tree / Lesson Nodes

- **Locked:** `disabled` background, `disabledText`, lock icon.
- **Available:** `primary` background, white icon, `shadows.md`, slight scale pulse to attract attention.
- **Completed:** `primary` background with checkmark, `shadows.sm` (settled, not elevated).
- **Current:** `primary` background + `secondary` glow ring (pulsing animation).

---

## Do's and Don'ts

### Do's
- Use generous touch targets (48px minimum) — kids have small, imprecise fingers.
- Use rounded corners everywhere (12-16px) — sharp corners feel unfriendly.
- Add bounce animations to rewards — it should feel like a celebration.
- Use the mascot for emotional moments — it guides the child through the experience.
- Test with both light and dark mode — every screen must look good in both.
- Use `textInverse` for text on colored backgrounds (buttons, badges).

### Don'ts
- Don't use red for primary actions — red = error in an education context.
- Don't use pure black (`#000000`) or pure white for backgrounds — use the theme tokens.
- Don't make text smaller than 13px — ever, anywhere, for any reason.
- Don't use thin font weights (<400) — kids need readable, sturdy letterforms.
- Don't auto-play sound or video without user intent.
- Don't show error messages without the encouraging mascot — always pair negative feedback with hope.
- Don't use complex gradients as backgrounds — they reduce text readability.
- Don't animate during active user input — only animate on state transitions.

---

## Shadow Usage

| Token | Use |
|-------|-----|
| `shadows.sm` | Static cards, completed items, subtle depth |
| `shadows.md` | Interactive cards, buttons, tappable elements |
| `shadows.lg` | Modals, bottom sheets, floating elements |

Shadows use warm dark tones (not pure black) to maintain the warm feel.
In dark mode, shadows are very subtle — rely on surface color differentiation instead.
