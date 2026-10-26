import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        gold: 'var(--gold)',
        'gold-bright': 'var(--gold-bright)',
        ivory: 'var(--ivory)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        label: ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.32em' }],
        meta: ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.06em' }],
        body: ['0.9375rem', { lineHeight: '1.75', letterSpacing: '0.01em' }],
      },
      letterSpacing: {
        label: '0.32em',
        tightest: '-0.03em',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        900: '900ms',
        1200: '1200ms',
        1600: '1600ms',
      },
      spacing: {
        letterbox: 'var(--letterbox)',
      },
      borderRadius: {
        xs: '0.125rem',
      },
      keyframes: {
        'veil-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'veil-in': 'veil-in 1600ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
