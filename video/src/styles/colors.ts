export const COLORS = {
  bg: '#f8fafc',
  bgDark: '#0a0e1a',
  bgDarker: '#050810',

  neutral50: '#f8fafc',
  neutral100: '#f1f5f9',
  neutral200: '#e2e8f0',
  neutral300: '#cbd5e1',
  neutral500: '#64748b',
  neutral700: '#334155',
  neutral800: '#1e293b',
  neutral900: '#0f172a',

  accent50: '#ecfeff',
  accent100: '#cffafe',
  accent300: '#67e8f9',
  accent400: '#22d3ee',
  accent500: '#06b6d4',
  accent600: '#0891b2',

  gradPurple: '#7c3aed',
  gradBlue: '#2563eb',
  gradCyan: '#06b6d4',
  gradPink: '#ec4899',

  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#065f46',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#92400e',
  error: '#f43f5e',
  errorLight: '#ffe4e6',
  errorDark: '#9f1239',

  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textWhite: '#ffffff',
  textMuted: '#94a3b8',
} as const;

export const FONT = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
} as const;

export const SPRING = {
  SNAPPY: { damping: 15, stiffness: 200, mass: 0.5 },
  BOUNCY: { damping: 10, stiffness: 150, mass: 0.8 },
  GENTLE: { damping: 20, stiffness: 80, mass: 1 },
  DRAMATIC: { damping: 8, stiffness: 120, mass: 1.2 },
} as const;

export const FPS = 30;
export const DURATION_SECONDS = 60;
export const TOTAL_FRAMES = FPS * DURATION_SECONDS;

export const SCENES = {
  hook:        { start: 0,    duration: 210 },
  problem:     { start: 210,  duration: 270 },
  patientDemo: { start: 480,  duration: 330 },
  nurseDemo:   { start: 810,  duration: 300 },
  agentic:     { start: 1110, duration: 420 },
  impact:      { start: 1530, duration: 270 },
} as const;
