export { clamp, clamp01, gaussian, lerp } from "./animation";

export const distanceSquared = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => Math.hypot(x2 - x1, y2 - y1);

export const pixelIndex = (
  row: number,
  col: number,
  cols: number,
) => row * cols + col;

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width * 0.5, height * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

let cachedDpr = 1;

export function deviceScale() {
  if (typeof window === "undefined") return 1;

  const dpr = window.devicePixelRatio || 1;
  if (dpr !== cachedDpr) cachedDpr = Math.max(1, dpr);

  return cachedDpr;
}