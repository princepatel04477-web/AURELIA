import localFont from 'next/font/local';

/**
 * Display — Cormorant Garamond (300 / 400 + italic).
 * Self-hosted variable files in /app/fonts so the build never depends on a font CDN.
 * `next/font` handles subsetting, preloading, `font-display` and CSS variable wiring.
 */
export const cormorant = localFont({
  src: [
    {
      path: './CormorantGaramond-Variable.ttf',
      weight: '300 700',
      style: 'normal',
    },
    {
      path: './CormorantGaramond-Italic-Variable.ttf',
      weight: '300 700',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

/**
 * Body — Inter (300 / 400), self-hosted variable file.
 */
export const inter = localFont({
  src: [
    {
      path: './Inter-Variable.ttf',
      weight: '300 700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
