import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

import type { ColorPalette } from './colors';
import type { Typography } from './typography';
import type { Shadow } from './shadows';

export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: typeof spacing;
  shadows: typeof shadows;
  isDark: boolean;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();

  // TODO: once settingsStore is available, read theme preference from there
  // For now, use system scheme
  const isDark = systemScheme === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    shadows,
    isDark,
  };
}

export { lightColors, darkColors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { shadows } from './shadows';
export { DURATION, EASING, SPRING, MASCOT, FEEDBACK, TRANSITION } from './animations';
export type { ColorPalette } from './colors';
export type { Typography, TypographyStyle } from './typography';
export type { Shadow, ShadowLevel } from './shadows';
export type { SpacingKey } from './spacing';
