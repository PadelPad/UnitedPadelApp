// lib/theme.ts
import { Platform, PixelRatio } from 'react-native';

/**
 * Base palette (single dark theme for now). If you add light mode later,
 * split this into palette.dark / palette.light and derive `colors` from it.
 */
export const palette = {
  black: '#000000',
  white: '#ffffff',
  orange: '#ff6a00',
  orangeAlt: '#ff7f1a',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#f59e0b',
  slate900: '#0b0e13',
  slate850: '#0e1116',
  slate800: '#10151d',
  slate700: '#1a202b',
  slate650: '#202733',
  slate600: '#28303a',
  slate500: '#303845',
  slate400: '#3a4352',
  text: '#ffffff',
  subtext: '#aab2bf',
};

/** Semantic colors used across the app */
export const colors = {
  bg: palette.slate900,
  card: palette.slate800,
  surface: palette.slate850,
  surfaceAlt: palette.slate700,
  border: palette.slate650,
  outline: palette.slate600,
  text: palette.text,
  subtext: palette.subtext,
  primary: palette.orange,
  primaryAlt: palette.orangeAlt,
  success: palette.green,
  danger: palette.red,
  warning: palette.yellow,
  overlay: 'rgba(0,0,0,0.6)',
};

/** Spacing scale (8pt grid) */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Corner radii */
export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Typographic scale (override fonts if you load custom ones) */
export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  sizes: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    h2: 24,
    h1: 28,
    display: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
};

/** Hairline */
export const hairlineWidth = 1 / PixelRatio.get();

/** iOS shadow + Android elevation for a given level */
export function elevate(level: 0 | 1 | 2 | 3 | 4 | 5 = 2) {
  const ios = [
    { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
    { shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    { shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    { shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
    { shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
    { shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } },
  ][level];

  return Platform.select({
    android: { elevation: level * 2 + (level ? 2 : 0) },
    ios: { shadowColor: '#000', ...ios },
    default: {},
  });
}

export const shadow = {
  big: elevate(5),
  soft: elevate(3),
} as const;

/** Common hitSlop helpers */
export function hitSlop(size: number = 8) {
  return { top: size, bottom: size, left: size, right: size } as const;
}

/** Visual states for Pressable */
export function pressedStyle(scale = 0.98, opacity = 0.9) {
  return ({ pressed }: { pressed: boolean }) => ({
    transform: [{ scale: pressed ? scale : 1 }],
    opacity: pressed ? opacity : 1,
  });
}

/** Theme bundle export if you like a single import */
export const theme = {
  palette,
  colors,
  spacing,
  radii,
  typography,
  hairlineWidth,
  elevate,
  shadow,
  hitSlop,
  pressedStyle,
};
export type Theme = typeof theme;
