export type MascotState =
  | 'idle'
  | 'happy'
  | 'celebrating'
  | 'encouraging'
  | 'thinking'
  | 'sad'
  | 'sleeping'
  | 'angry'
  | 'waving'
  | 'teaching';

export type MascotAnimationType = 'bounce' | 'pulse' | 'shake' | 'float' | 'none';

export interface MascotStateConfig {
  label: string;
  defaultMessage: string;
  animationType: MascotAnimationType;
}

export type MascotContext =
  | { screen: 'home' }
  | { screen: 'lesson'; lastAnswerCorrect?: boolean }
  | { screen: 'results'; score: number; isPerfect: boolean }
  | { screen: 'review' }
  | { screen: 'profile' };
