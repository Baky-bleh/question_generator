import React from 'react';
import type { MascotState } from '../../../../shared/mascot/types';
import {
  IdleFox,
  HappyFox,
  CelebratingFox,
  EncouragingFox,
  ThinkingFox,
  SadFox,
  SleepingFox,
  AngryFox,
  WavingFox,
  TeachingFox,
} from './svgs';

export type MascotSvgComponent = React.FC<{ size: number }>;

export const MASCOT_ASSETS: Record<MascotState, MascotSvgComponent> = {
  idle: IdleFox,
  happy: HappyFox,
  celebrating: CelebratingFox,
  encouraging: EncouragingFox,
  thinking: ThinkingFox,
  sad: SadFox,
  sleeping: SleepingFox,
  angry: AngryFox,
  waving: WavingFox,
  teaching: TeachingFox,
};

export const MASCOT_SIZES = {
  sm: 60,
  md: 120,
  lg: 200,
} as const;
