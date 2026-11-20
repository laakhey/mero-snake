import { Platform } from 'react-native';

/** App chrome colours — the same indigo family as Mero Paisa. */
export const palette = {
  light: {
    background: '#F4F5F8',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEEF3',
    border: '#E2E5EC',
    text: '#0F1222',
    textSecondary: '#5B6275',
    textTertiary: '#8B91A3',
    primary: '#4F46E5',
    primaryMuted: '#EAE9FD',
    onPrimary: '#FFFFFF',
    success: '#0E9F6E',
    successMuted: '#DEF7EC',
    danger: '#E02D4C',
    dangerMuted: '#FDE8EC',
    warning: '#D97706',
    warningMuted: '#FEF3C7',
    overlay: 'rgba(15, 18, 34, 0.55)',
  },
  dark: {
    background: '#0B0C12',
    surface: '#16181F',
    surfaceMuted: '#20232D',
    border: '#2A2E3A',
    text: '#F3F4F8',
    textSecondary: '#A6ACBD',
    textTertiary: '#737A8E',
    primary: '#8B85FF',
    primaryMuted: '#25234A',
    onPrimary: '#0B0C12',
    success: '#34D399',
    successMuted: '#0F2F26',
    danger: '#FB7185',
    dangerMuted: '#3A1620',
    warning: '#FBBF24',
    warningMuted: '#3A2A0B',
    overlay: 'rgba(0, 0, 0, 0.62)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof typeof palette.light]: string };

/** 4pt spacing grid. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Minimum touch target recommended by both Apple HIG (44pt) and Material (48dp). */
export const hitTarget = 48;

export const maxContentWidth = 560;

export const typography = {
  hero: { fontSize: 44, lineHeight: 48, fontWeight: '900', letterSpacing: -1.2 },
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2 },
} as const;

export type TextVariant = keyof typeof typography;

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(15,18,34,0.06), 0 4px 12px rgba(15,18,34,0.05)' },
  default: {
    shadowColor: '#0F1222',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
}) as object;

/* ------------------------------ Board skins ------------------------------ */

export type SkinId = 'neon' | 'indigo' | 'retro' | 'candy';

export type Skin = {
  id: SkinId;
  name: string;
  /** Square, flat blocks like the original phone LCDs instead of a smooth body. */
  pixel: boolean;
  board: string;
  boardAlt: string;
  frame: string;
  wall: string;
  wallEdge: string;
  head: string;
  tail: string;
  eye: string;
  food: string;
  foodShine: string;
  glow: string;
  bonus: string[];
};

/**
 * Skin ids are saved in settings, so add skins but never rename or remove one.
 */
export const SKINS: Record<SkinId, Skin> = {
  neon: {
    id: 'neon',
    name: 'Neon',
    pixel: false,
    board: '#0D0F1A',
    boardAlt: '#10131F',
    frame: '#1E2235',
    wall: '#3B4166',
    wallEdge: '#5A628F',
    head: '#BEF264',
    tail: '#059669',
    eye: '#0B0C12',
    food: '#FB7185',
    foodShine: '#FFE4E6',
    glow: '#FB7185',
    bonus: ['#FBBF24', '#38BDF8', '#C084FC', '#F472B6'],
  },
  indigo: {
    id: 'indigo',
    name: 'Mero',
    pixel: false,
    board: '#16143A',
    boardAlt: '#1B1946',
    frame: '#2A2766',
    wall: '#4F46E5',
    wallEdge: '#818CF8',
    head: '#C7D2FE',
    tail: '#6366F1',
    eye: '#1E1B4B',
    food: '#FBBF24',
    foodShine: '#FEF3C7',
    glow: '#FBBF24',
    bonus: ['#34D399', '#F472B6', '#38BDF8', '#FB923C'],
  },
  retro: {
    id: 'retro',
    name: 'Retro LCD',
    pixel: true,
    board: '#B6C79A',
    boardAlt: '#AFC193',
    frame: '#8C9C72',
    wall: '#2F3B22',
    wallEdge: '#2F3B22',
    head: '#1F2A16',
    tail: '#2F3B22',
    eye: '#B6C79A',
    food: '#1F2A16',
    foodShine: '#1F2A16',
    glow: '#00000000',
    bonus: ['#1F2A16', '#1F2A16', '#1F2A16', '#1F2A16'],
  },
  candy: {
    id: 'candy',
    name: 'Candy',
    pixel: false,
    board: '#FFF7ED',
    boardAlt: '#FFEFDD',
    frame: '#FED7AA',
    wall: '#F59E0B',
    wallEdge: '#FCD34D',
    head: '#F472B6',
    tail: '#A855F7',
    eye: '#FFFFFF',
    food: '#EF4444',
    foodShine: '#FECACA',
    glow: '#F87171',
    bonus: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
  },
};

export const SKIN_IDS = Object.keys(SKINS) as SkinId[];

/** Blends two #RRGGBB colours; t = 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (shift: number) => {
    const ca = (pa >> shift) & 255;
    const cb = (pb >> shift) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
