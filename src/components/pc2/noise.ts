const lerp = (a: number, b: number, t: number) =>
  a + (b - a) * t;

const fade = (t: number) =>
  t * t * t * (t * (t * 6 - 15) + 10);

/**
 * Fast deterministic 2D hash.
 * Returns [0,1).
 */
export const hash2D = (
  x: number,
  y: number,
) => {
  let h =
    Math.imul(x, 374761393) +
    Math.imul(y, 668265263);

  h =
    Math.imul(
      h ^ (h >>> 13),
      1274126177
    );

  return (
    ((h ^ (h >>> 16)) >>> 0) /
    4294967296
  );
};

/**
 * Smooth value noise.
 * Returns [0,1).
 */
export function valueNoise(
  x: number,
  y: number,
) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);

  const tx = x - xi;
  const ty = y - yi;

  const u = fade(tx);
  const v = fade(ty);

  const a = hash2D(xi, yi);
  const b = hash2D(xi + 1, yi);
  const c = hash2D(xi, yi + 1);
  const d = hash2D(xi + 1, yi + 1);

  return lerp(
    lerp(a, b, u),
    lerp(c, d, u),
    v,
  );
}

/**
 * Centered value noise.
 * Returns [-1,1].
 */
export function signedNoise(
  x: number,
  y: number,
) {
  return valueNoise(x, y) * 2 - 1;
}

/**
 * Animated low-frequency noise.
 * Returns [-1,1].
 */
export function animatedNoise(
  x: number,
  y: number,
  time: number,
  frequency = 0.02,
  speedX = 0.00008,
  speedY = 0.00006,
) {
  return signedNoise(
    x * frequency + time * speedX,
    y * frequency + time * speedY,
  );
}

/**
 * Stable per-pixel random value.
 * Returns [0,1).
 */
export const pixelSeed = (
  index: number,
) => hash2D(index, 97);