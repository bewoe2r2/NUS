/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Light Mode Palette (Swiss/Medical)
        slide: '#ffffff', // Pure White
        surface: '#f8fafc', // Slate-50 (Very subtle grey for cards)

        primary: '#0f172a', // Slate-900 (Deep Navy for text - sharper than black)
        secondary: '#475569', // Slate-600 (Muted for body)
        tertiary: '#94a3b8', // Slate-400 (Metadata)

        accent: {
          cyan: '#0ea5e9', // Sky-500 (Clean Tech Blue)
          rose: '#e11d48', // Rose-600 (Alert/Crisis - calibrated for white)
          indigo: '#4f46e5', // Indigo-600 (Primary Action)
        },
        status: {
          success: '#10b981', // Emerald-500
          warning: '#f59e0b', // Amber-500 
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Elite Typography Scale
        'display': ['6rem', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '600' }],
        'h1': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'h2': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '500' }],
        'h3': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '500' }],
        'body-lg': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
      },
      spacing: {
        'slide-p': '96px', // Massive padding
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
