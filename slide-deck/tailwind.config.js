/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wall Street Paper — analyst-portfolio exact OKLCh translations
        slide: '#fafaf9',        // oklch(99% 0 0) — paper canvas
        surface: '#ffffff',      // oklch(100% 0 0) — card (whiter than page)
        subtle: '#f4f4f5',       // oklch(97% 0.01 240) — recessed panels

        primary: '#1a1a2e',      // oklch(20% 0.02 240) — ink
        secondary: '#52526e',    // oklch(45% 0.02 240) — body text
        tertiary: '#8585a0',     // oklch(65% 0.02 240) — labels, muted

        accent: {
          navy: '#354f8c',       // oklch(45% 0.15 260) — primary accent
          navyLight: '#5a7abf',  // oklch(60% 0.12 260) — secondary blue
          highlight: '#f0f2fa',  // oklch(96% 0.02 260) — pill bg, barely blue
          // Muted semantic — chroma 0.12-0.20, NOT saturated
          crimson: '#a63d3d',    // oklch(55% 0.15 25) — muted loss/crisis
          emerald: '#3d8c5a',    // oklch(60% 0.12 145) — muted profit/success
          amber: '#b8860b',      // oklch(65% 0.12 80) — muted warning
        },

        border: {
          hairline: '#e5e5e5',   // oklch(90% 0 0)
          strong: '#1a1a2e',     // same as ink
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.4' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '2xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        '3xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],
        'hero': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '700' }],
      },
      letterSpacing: {
        'label': '0.1em',      // uppercase labels
        'metric': '0.05em',    // metric labels
        'tight': '-0.01em',
        'tighter': '-0.02em',
      },
      spacing: {
        'slide-p': '72px',     // slightly tighter to increase content area
      },
      boxShadow: {
        'paper': '0 4px 12px rgba(0,0,0,0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.06)',
        'elevated': '0 8px 24px rgba(0,0,0,0.08)',
        'mockup': '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
