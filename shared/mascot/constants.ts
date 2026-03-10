import type { MascotState, MascotStateConfig } from './types';

export const MASCOT_CONFIG: Record<MascotState, MascotStateConfig> = {
  idle: {
    label: 'Idle',
    defaultMessage: "Let's learn something new!",
    animationType: 'float',
  },
  happy: {
    label: 'Happy',
    defaultMessage: 'Great job!',
    animationType: 'bounce',
  },
  celebrating: {
    label: 'Celebrating',
    defaultMessage: 'Amazing work!',
    animationType: 'bounce',
  },
  encouraging: {
    label: 'Encouraging',
    defaultMessage: "Don't give up, you've got this!",
    animationType: 'pulse',
  },
  thinking: {
    label: 'Thinking',
    defaultMessage: 'Take your time...',
    animationType: 'pulse',
  },
  sad: {
    label: 'Sad',
    defaultMessage: 'I miss you! Come back and practice!',
    animationType: 'shake',
  },
  sleeping: {
    label: 'Sleeping',
    defaultMessage: 'Zzz... Wake me up to learn!',
    animationType: 'float',
  },
  angry: {
    label: 'Angry',
    defaultMessage: "It's been too long! Let's get back to it!",
    animationType: 'shake',
  },
  waving: {
    label: 'Waving',
    defaultMessage: 'Welcome back!',
    animationType: 'bounce',
  },
  teaching: {
    label: 'Teaching',
    defaultMessage: "Let me show you something new!",
    animationType: 'pulse',
  },
};

export const MASCOT_STATES: MascotState[] = [
  'idle',
  'happy',
  'celebrating',
  'encouraging',
  'thinking',
  'sad',
  'sleeping',
  'angry',
  'waving',
  'teaching',
];
