/**
 * Motion language — the single source of truth for timing.
 * Slow and weighted: 900–1600ms, outExpo / inOutQuart, nothing bounces.
 */

export const DURATION = {
  fast: 900,
  base: 1200,
  slow: 1600,
} as const;

/** CSS cubic-bezier equivalents of the two sanctioned curves. */
export const EASE_CSS = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
} as const;

/** anime.js v4 `ease` values. Never `easing`. */
export const EASE_ANIME = {
  outExpo: 'outExpo',
  inOutQuart: 'inOutQuart',
} as const;

/** GSAP power curve mirrors of the same language. */
export const EASE_GSAP = {
  out: 'expo.out',
  inOut: 'quart.inOut',
} as const;

export const STAGGER = {
  tight: 0.045,
  base: 0.075,
  loose: 0.12,
} as const;
