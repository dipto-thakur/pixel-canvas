/* Clamp ------------------------------------------------------------------ */

export const clamp01 = (v: number) =>
  Math.min(1, Math.max(0, v));

export const clamp = (
  v: number,
  min = 0,
  max = 1,
) => Math.min(max, Math.max(min, v));

/* Interpolation ---------------------------------------------------------- */

export const lerp = (
  a: number,
  b: number,
  t: number,
) => a + (b - a) * t;

export const inverseLerp = (
  a: number,
  b: number,
  v: number,
) =>
  a === b
    ? 0
    : clamp01((v - a) / (b - a));

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) =>
  lerp(
    outMin,
    outMax,
    inverseLerp(inMin, inMax, value),
  );

export const damp = (
  current: number,
  target: number,
  lambda: number,
  delta: number,
) =>
  lerp(
    current,
    target,
    1 - Math.exp(-lambda * delta),
  );

/* Easing ----------------------------------------------------------------- */

export const easeInCubic = (t: number) =>
  t * t * t;

export const easeOutCubic = (t: number) =>
  1 - (1 - t) ** 3;

export const easeInOutCubic = (t: number) =>
  t < 0.5
    ? 4 * t * t * t
    : 1 - ((-2 * t + 2) ** 3) / 2;

export const easeInExpo = (t: number) =>
  t <= 0
    ? 0
    : 2 ** (10 * t - 10);

export const easeOutExpo = (t: number) =>
  t >= 1
    ? 1
    : 1 - 2 ** (-10 * t);

export const smoothstep = (t: number) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};

export const smootherstep = (t: number) => {
  t = clamp01(t);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* Curves ----------------------------------------------------------------- */

export const gaussian = (
  x: number,
  sigma: number,
) => {
  if (sigma <= 0) return 0;

  return Math.exp(
    -(x * x) /
      (2 * sigma * sigma),
  );
};

export const pulse = (
  time: number,
  speed = 1,
) =>
  0.5 +
  Math.sin(time * speed) * 0.5;

export const triangleWave = (
  time: number,
  speed = 1,
) =>
  1 -
  Math.abs(
    ((time * speed) % 2) - 1,
  );