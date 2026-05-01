// tokens.ts — Fitsync design system
// All colors are explicit hex values. No system/adaptive colors that could go black.

export const tokens = {
  color: {
    // Backgrounds
    bg:               '#09090b',   // true black-ish
    surface:          '#18181b',   // card bg
    surfaceElevated:  '#1c1c1f',   // slightly elevated card
    elevated:         '#27272a',   // input bg, chips
    surfaceGlass:     '#ffffff08', // glass overlay

    // Borders
    border:           '#2e2e35',

    // Brand / accent
    primary:          '#3b82f6',   // blue-500
    primaryMuted:     '#1d3a6e',   // blue muted bg
    accent:           '#a78bfa',   // violet
    accentMuted:      '#2e1f5e',

    // Status
    amber:            '#f2c94c',   // low-readiness state
    success:          '#22c55e',
    successMuted:     '#14532d',
    warning:          '#f59e0b',
    warningMuted:     '#451a03',
    danger:           '#ef4444',
    dangerMuted:      '#450a0a',

    // Text — ALL explicit, never adaptive
    textPrimary:      '#f4f4f5',   // near-white
    textSecondary:    '#a1a1aa',   // zinc-400
    textMuted:        '#71717a',   // zinc-500
    textTertiary:     '#52525b',   // zinc-600
    textInverse:      '#09090b',   // for light bg buttons
  },

  font: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  26,
    hero: 32,
  },

  space: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    hero: 48,
  },

  radius: {
    xs:   4,
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    full: 9999,
  },
};