// Design tokens taken verbatim from the Figma file "Samayal Arayayil — App Screens".
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#111111',
  muted: '#6F6F6F',
  primary: '#111111',
  onPrimary: '#FFFFFF',
  border: '#E8E8E8',
  soft: '#F6F6F6',
  teal: '#2F6F6A',
  turmeric: '#F2B90F',
  turmericTint: '#FDF2CF',
  chilliTint: '#FCE2D7',
  violetTint: '#ECE6F6',
  chilli: '#E2552A',
  leaf: '#4F8A2F',
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

/** Text styles named exactly as the Figma text styles. */
export const type = {
  display: { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 34, color: colors.ink },
  title: { fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 28, color: colors.ink },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
  caption: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  monoLink: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
    color: colors.ink,
  },
  /** Small pill buttons (Lock, Swap, Yes, made it). */
  smallButton: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

/** 0px 8px 24px rgba(0,0,0,0.12) — the only shadow in the file. */
export const shadow = { boxShadow: '0px 8px 24px 0px rgba(0, 0, 0, 0.12)' } as const;

/** Card shadows on the A1–A6 app screens. */
export const cardShadow = { boxShadow: '0px 6px 20px 0px rgba(0, 0, 0, 0.1)' } as const;
export const softShadow = { boxShadow: '0px 6px 20px 0px rgba(0, 0, 0, 0.08)' } as const;

/** Horizontal padding of every screen's content frame. */
export const GUTTER = 24;
