export const tokens = {
  color: {
    bg: '#080f1a',
    surface: '#111827',
    elevated: '#1a2535',
    border: '#1e2d40',
    primary: '#6366f1',
    primaryMuted: '#312e81',
    success: '#22c55e',
    successMuted: '#166534',
    warning: '#f59e0b',
    warningMuted: '#92400e',
    danger: '#ef4444',
    dangerMuted: '#991b1b',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
  },
  space: {
    xs: 4, sm: 8, mdSm: 12, md: 16, lg: 24, xl: 32, xxl: 48, hero: 64,
  },
  radius: {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
  },
  font: {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28, hero: 40,
  },
} as const;
