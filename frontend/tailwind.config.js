/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C1917',
          soft: '#292524',
          muted: '#44403C',
        },
        stone: { DEFAULT: '#78716C' },
        fog: { DEFAULT: '#A8A29E' },
        paper: '#F5F0E8',
        cream: '#FAF7F2',
        washi: '#FEFCFA',
        gold: {
          DEFAULT: '#C9A96E',
          light: '#E8D5B0',
          dark: '#8B6914',
        },
        moss: { DEFAULT: '#4A5240', light: '#6B7A5A' },
        rust: '#8B4513',
        indigo: { DEFAULT: '#2D3561', light: '#4A5280' },
      },
      borderColor: {
        gold: 'rgba(201,169,110,0.3)',
        ink: 'rgba(28,25,23,0.12)',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      letterSpacing: {
        kana: '0.22em',
        ma: '0.28em',
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        btn: '6px',
      },
      boxShadow: {
        washi: '0 1px 2px rgba(28,25,23,0.03), 0 8px 24px -12px rgba(28,25,23,0.06)',
      },
    },
  },
  plugins: [],
};
