import { useMemo } from 'react';
import type { MascotState, MascotContext } from '../../../../shared/mascot/types';
import { MASCOT_CONFIG } from '../../../../shared/mascot/constants';

interface MascotStateResult {
  state: MascotState;
  message: string;
}

function getHourOfDay(): number {
  return new Date().getHours();
}

function getHomeGreeting(): string {
  const hour = getHourOfDay();
  if (hour < 12) return 'Good morning! Ready to learn?';
  if (hour < 17) return 'Good afternoon! Time to practice!';
  return 'Good evening! A quick lesson?';
}

function deriveMascotState(context: MascotContext): MascotStateResult {
  switch (context.screen) {
    case 'home': {
      // TODO: check streak status from progressStore when available
      // For now, use time-based greeting with waving state
      const hour = getHourOfDay();
      if (hour < 6 || hour >= 23) {
        return { state: 'sleeping', message: MASCOT_CONFIG.sleeping.defaultMessage };
      }
      return { state: 'waving', message: getHomeGreeting() };
    }

    case 'lesson': {
      if (context.lastAnswerCorrect === true) {
        return { state: 'happy', message: 'Great job! Keep going!' };
      }
      if (context.lastAnswerCorrect === false) {
        return { state: 'encouraging', message: "Almost! Try again, you've got this!" };
      }
      return { state: 'teaching', message: MASCOT_CONFIG.teaching.defaultMessage };
    }

    case 'results': {
      if (context.isPerfect) {
        return { state: 'celebrating', message: 'Perfect score! You are amazing!' };
      }
      if (context.score >= 80) {
        return { state: 'happy', message: 'Well done! Great lesson!' };
      }
      if (context.score >= 50) {
        return { state: 'encouraging', message: 'Good effort! Practice makes perfect!' };
      }
      return { state: 'encouraging', message: "Don't worry! Every mistake is a step forward!" };
    }

    case 'review': {
      return { state: 'thinking', message: "Let's review what you've learned!" };
    }

    case 'profile': {
      return { state: 'idle', message: MASCOT_CONFIG.idle.defaultMessage };
    }

    default:
      return { state: 'idle', message: MASCOT_CONFIG.idle.defaultMessage };
  }
}

export function useMascotState(context: MascotContext): MascotStateResult {
  return useMemo(() => deriveMascotState(context), [
    context.screen,
    'lastAnswerCorrect' in context ? context.lastAnswerCorrect : undefined,
    'score' in context ? context.score : undefined,
    'isPerfect' in context ? context.isPerfect : undefined,
  ]);
}
