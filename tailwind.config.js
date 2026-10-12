/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand — teal/emerald financial accent
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Semantic status colors
        positive: { DEFAULT: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
        negative: { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#B91C1C' },
        pending: { DEFAULT: '#D97706', light: '#FEF3C7', dark: '#92400E' },
        completed: { DEFAULT: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
        failed: { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#B91C1C' },
        restricted: { DEFAULT: '#D97706', light: '#FFFBEB', dark: '#92400E' },
        warning: { DEFAULT: '#EA580C', light: '#FFF7ED', dark: '#C2410C' },
        info: { DEFAULT: '#2563EB', light: '#DBEAFE', dark: '#1D4ED8' },
        // Neutral surface
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'dropdown': '0 10px 30px -5px rgb(0 0 0 / 0.12), 0 4px 10px -3px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
