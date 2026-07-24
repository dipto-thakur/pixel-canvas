export const GRID = {
  MOBILE: 3,
  TABLET: 4,
  DESKTOP: 5,

  GAP: 1,

  MIN_COLS: 20,
  MIN_ROWS: 8,

  MAX_COLS: 300,
  MAX_ROWS: 90,
} as const;

export const IDLE = {
  baseOpacity: 0.035,
  amplitude: 0.05,

  scale: 0.012,
  radius: 0.25,

  waveSpeedX: 0.38,
  waveSpeedY: 0.31,
} as const;

export const SHIMMER = {
  speed: 0.012,

  width: 120,
  angle: 0.34,

  opacity: 0.09,
  scale: 0.035,
} as const;

export const RIPPLE = {
  radius: 120,
  velocityMultiplier: 42,

  opacity: 0.32,
  scale: 0.08,
  lift: 1.8,
} as const;

export const REVEAL = {
  duration: 900,
  dissolve: 650,
  hold: 1400,

  stagger: 240,

  opacity: 1,
  scale: 0.12,
  lift: 2.25,
} as const;

export const TIMELINE = {
  hold: 2000,
  revealMs: REVEAL.duration,
  dissolveMs: REVEAL.dissolve,
} as const;

export const SAMPLER = {
  SUPERSAMPLE: 3,

  ALPHA_THRESHOLD: 0.08,

  SAFE_PADDING_X: 0.1,
  SAFE_PADDING_Y: 0.18,
} as const;

export const COLORS = {
  BACKGROUND: "#090909",
  PIXEL: "#ffffff",
} as const;