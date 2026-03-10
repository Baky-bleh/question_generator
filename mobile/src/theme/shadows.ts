import { Platform } from 'react-native';

export interface Shadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

const createShadow = (
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
): Shadow => ({
  shadowColor: '#2D2319',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
  shadowRadius: Platform.OS === 'ios' ? radius : 0,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const shadows = {
  sm: createShadow(1, 0.08, 2, 2),
  md: createShadow(2, 0.12, 6, 4),
  lg: createShadow(4, 0.16, 12, 8),
} as const;

export type ShadowLevel = keyof typeof shadows;
