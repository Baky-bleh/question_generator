import { Platform } from 'react-native';

// System fonts are round and clear on both platforms.
// iOS: SF Pro Rounded (via system font). Android: Roboto.
// Both are highly legible for kids with developing vision.
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyBold = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
}

export interface Typography {
  heading1: TypographyStyle;
  heading2: TypographyStyle;
  heading3: TypographyStyle;
  body: TypographyStyle;
  bodySmall: TypographyStyle;
  caption: TypographyStyle;
  button: TypographyStyle;
  buttonSmall: TypographyStyle;
  label: TypographyStyle;
}

// ─── Typography Scale ──────────────────────────────────────────────────────────
// Kid-friendly sizing rules:
//   - Body text: 16px minimum (WCAG / kids readability)
//   - Captions: 13px minimum (never below this for kids)
//   - Line heights: 1.5x for body text, generous for all sizes
//   - Font weights: 400 minimum for body, 600+ for headings (no thin fonts)
//   - Letter spacing: slightly positive for small text (improves readability)
export const typography: Typography = {
  heading1: {
    fontFamily: fontFamilyBold,
    fontSize: 32,
    lineHeight: 42,             // ~1.31x — tight but balanced for large display text
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: fontFamilyBold,
    fontSize: 24,
    lineHeight: 34,             // ~1.42x — generous for section headings
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: fontFamilyBold,
    fontSize: 20,
    lineHeight: 28,             // 1.4x — comfortable for sub-headings
    fontWeight: '700',
  },
  body: {
    fontFamily,
    fontSize: 16,               // Minimum body size for kids
    lineHeight: 24,             // 1.5x — optimal readability for kids
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,               // Used for secondary info — still legible
    lineHeight: 22,             // ~1.57x — extra generous for smaller text
    fontWeight: '500',          // Bumped from 400 to 500 — more readable at small size
  },
  caption: {
    fontFamily,
    fontSize: 13,               // Raised from 12 — minimum for kids readability
    lineHeight: 20,             // ~1.54x — generous line height
    fontWeight: '500',          // Bumped from 400 to 500 — prevents wispy appearance
    letterSpacing: 0.2,         // Slight tracking improves small-text legibility
  },
  button: {
    fontFamily: fontFamilyBold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontFamily: fontFamilyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: fontFamilyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
};
