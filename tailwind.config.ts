import type { Config } from 'tailwindcss';

/**
 * Design tokens. Semantic colours are CSS variables (see globals.css) so that
 * dark mode and future themes are a variable swap, not a class rewrite.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        mutedSurface: 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        ink: 'rgb(var(--fg) / <alpha-value>)',
        subtle: 'rgb(var(--muted) / <alpha-value>)',
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bed0ff',
          300: '#92afff',
          400: '#5f82fc',
          500: '#3b5cf6',
          600: '#2540ea',
          700: '#1d31d7',
          800: '#1e2bab',
          900: '#1e2b87',
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          fg: 'rgb(var(--brand-fg) / <alpha-value>)',
        },
        accent: '#f59e0b',
        navy: '#101B35',
        plum: '#2D2B55',
        action: '#0071E3',
        mist: '#F5F5F7',
        paper: '#F5F9FF',
        success: 'rgb(var(--success) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['2rem', { lineHeight: '2.4rem', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '2.9rem', letterSpacing: '-0.025em' }],
        'display-lg': ['3.25rem', { lineHeight: '3.6rem', letterSpacing: '-0.03em' }],
      },
      spacing: { 4.5: '1.125rem', 18: '4.5rem' },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      boxShadow: {
        card: '0 1px 2px 0 rgb(11 18 32 / 0.04), 0 8px 24px -12px rgb(11 18 32 / 0.12)',
        lift: '0 2px 4px rgb(11 18 32 / 0.05), 0 18px 40px -18px rgb(11 18 32 / 0.22)',
        ring: '0 0 0 1px rgb(var(--border))',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgb(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(to right, rgb(var(--border) / 0.6) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 180ms ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
