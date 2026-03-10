// ─── Animation Constants ───────────────────────────────────────────────────────
// Shared animation presets for consistent, playful motion across the app.
// Uses react-native-reanimated withSpring/withTiming config objects.
// Import these instead of hardcoding durations and easings.

import { Easing } from 'react-native-reanimated';

// ─── Durations (ms) ────────────────────────────────────────────────────────────
export const DURATION = {
  /** Quick micro-interactions: button press, toggle, icon swap */
  fast: 150,
  /** Standard transitions: card appear, screen fade, slide in */
  normal: 300,
  /** Deliberate motion: mascot entrance, celebration, page transition */
  slow: 500,
  /** Extended: confetti, reward sequence, level-up ceremony */
  celebration: 800,
} as const;

// ─── Easing Curves ─────────────────────────────────────────────────────────────
// Named easings for withTiming(). Use these to keep motion feeling consistent.
export const EASING = {
  /** Smooth deceleration — elements arriving on screen */
  easeOut: Easing.out(Easing.cubic),
  /** Smooth acceleration — elements leaving the screen */
  easeIn: Easing.in(Easing.cubic),
  /** Smooth both ways — general purpose transitions */
  easeInOut: Easing.inOut(Easing.cubic),
  /** Playful overshoot — buttons, badges, small pops */
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** Gentle overshoot — larger elements, cards */
  gentleBounce: Easing.bezier(0.25, 1.25, 0.5, 1),
} as const;

// ─── Spring Configs (for withSpring) ───────────────────────────────────────────
// React Native Reanimated spring parameters.
// damping: higher = less oscillation. stiffness: higher = snappier.
export const SPRING = {
  /** Snappy — button feedback, toggle, small interactive elements */
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },
  /** Bouncy — mascot, reward pop-in, achievement unlock */
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 1,
  },
  /** Gentle — page transitions, large card movements, modals */
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  /** Wobbly — celebration, XP coin bounce, streak fire wiggle */
  wobbly: {
    damping: 5,
    stiffness: 180,
    mass: 0.8,
  },
} as const;

// ─── Mascot Animation Presets ──────────────────────────────────────────────────
// Config objects for mascot entrance/exit/reactions.
// The FE agent applies these via withSpring/withTiming on the mascot component.
export const MASCOT = {
  /** Mascot slides up from below with a bounce */
  entrance: {
    spring: SPRING.bouncy,
    translateY: { from: 80, to: 0 },
    opacity: { from: 0, to: 1 },
    scale: { from: 0.8, to: 1 },
  },
  /** Mascot slides down and fades out */
  exit: {
    duration: DURATION.normal,
    easing: EASING.easeIn,
    translateY: { from: 0, to: 60 },
    opacity: { from: 1, to: 0 },
  },
  /** Quick scale pulse when mascot reacts (correct answer, encouragement) */
  pulse: {
    spring: SPRING.snappy,
    scale: { from: 1, to: 1.15, back: 1 },
  },
  /** Celebration bounce — correct answer, lesson complete */
  celebrate: {
    spring: SPRING.wobbly,
    scale: { from: 1, to: 1.3, back: 1 },
    rotate: { from: '0deg', to: '10deg', back: '0deg' },
  },
  /** Sad shrink — wrong answer */
  sadReaction: {
    spring: SPRING.gentle,
    scale: { from: 1, to: 0.9, back: 1 },
    translateY: { from: 0, to: 5, back: 0 },
  },
} as const;

// ─── Feedback Animation Presets ────────────────────────────────────────────────
// For answer feedback, XP gains, streak updates.
export const FEEDBACK = {
  /** Correct answer — green flash + scale pop */
  correct: {
    spring: SPRING.snappy,
    scale: { from: 0.95, to: 1.05, back: 1 },
    duration: DURATION.fast,
  },
  /** Wrong answer — shake left/right */
  incorrect: {
    duration: DURATION.fast,
    easing: EASING.easeInOut,
    translateX: [0, -8, 8, -6, 6, -3, 3, 0],
  },
  /** XP coin flies up and fades out */
  xpGain: {
    duration: DURATION.slow,
    easing: EASING.easeOut,
    translateY: { from: 0, to: -60 },
    opacity: { from: 1, to: 0 },
    scale: { from: 0.5, to: 1.2 },
  },
  /** Streak fire wiggle */
  streakFire: {
    spring: SPRING.wobbly,
    rotate: { from: '-5deg', to: '5deg' },
    scale: { from: 1, to: 1.1, back: 1 },
  },
} as const;

// ─── Transition Presets ────────────────────────────────────────────────────────
// For screen transitions, modal appearances, list items.
export const TRANSITION = {
  /** Fade in — general purpose appear */
  fadeIn: {
    duration: DURATION.normal,
    easing: EASING.easeOut,
    opacity: { from: 0, to: 1 },
  },
  /** Slide up — bottom sheets, modals, lesson intro */
  slideUp: {
    spring: SPRING.gentle,
    translateY: { from: 100, to: 0 },
    opacity: { from: 0, to: 1 },
  },
  /** Scale in — buttons, cards appearing */
  scaleIn: {
    spring: SPRING.bouncy,
    scale: { from: 0.85, to: 1 },
    opacity: { from: 0, to: 1 },
  },
  /** Stagger delay for list items (multiply by index) */
  staggerDelay: 50,
} as const;
