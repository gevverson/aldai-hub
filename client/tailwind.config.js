/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#1B4332',
          900: '#14532d',
          950: '#0A0A0A',
        },
        amber: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        alert: {
          red:    '#DC2626',
          orange: '#EA580C',
          green:  '#16A34A',
          purple: '#7C3AED',
        },
        app: {
          bg:       '#0A0A0A',
          surface:  '#111827',
          surface2: '#1F2937',
          border:   '#1F2937',
          muted:    '#6B7280',
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        display: ["'DM Serif Display'", 'Georgia', 'serif'],
        mono:    ["'JetBrains Mono'", 'Menlo', 'monospace'],
      },
      animation: {
        'ticker': 'ticker-scroll 40s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.6', transform: 'scale(1.4)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
