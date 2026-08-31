/**
 * Wedding Univers design tokens — framework-agnostic (§31: élégant, romantique,
 * premium, moderne, chaleureux; works for a champêtre, luxe, urbain or intimiste
 * wedding alike). Plain values only, no CSS/React/RN dependency, so both
 * apps/web (Tailwind theme) and apps/mobile (StyleSheet) consume the same source
 * of truth without duplicating design decisions.
 */

export const colors = {
  ivory: "#FBF7F2",
  ivoryDeep: "#F3ECE2",
  ink: "#2B2420",
  inkSoft: "#4A4038",
  gold: "#C9A227",
  goldPale: "#E4CE8A",
  rose: "#C98E82",
  sage: "#8A9A7E",
  white: "#FFFFFF",
  border: "#E5DDD0",
  success: "#5C8A66",
  warning: "#C98A3C",
  danger: "#B5544A",
} as const;

export const fonts = {
  display: '"Playfair Display", Georgia, serif',
  body: '"DM Sans", -apple-system, sans-serif',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  display: 48,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const shadows = {
  soft: "0 4px 24px rgba(43, 36, 32, 0.08)",
  medium: "0 8px 40px rgba(43, 36, 32, 0.12)",
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const tokens = { colors, fonts, fontSizes, spacing, radii, shadows, motion } as const;

export type Tokens = typeof tokens;
