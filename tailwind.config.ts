import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#141414',
          border: '#1a1a1a',
          muted: '#666666',
        },
        accent: {
          DEFAULT: '#14b8a6',
          hover: '#0d9488',
          muted: 'rgba(20, 184, 166, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-dot': 'bounce-dot 1.4s infinite ease-in-out',
      },
      keyframes: {
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
