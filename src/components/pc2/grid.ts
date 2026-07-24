import { GRID } from "./constants";
import type { GridConfig } from "./types";
import { deviceScale } from "./utils";

const clampInt = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(v)));

export const getCellSize = (width: number) =>
  width < 480
    ? GRID.MOBILE
    : width < 768
      ? GRID.TABLET
      : GRID.DESKTOP;

export function createGrid(
  width: number,
  height: number,
  dpr = deviceScale(),
  gap = GRID.GAP,
): GridConfig {
  const safeDpr = Math.min(Math.max(dpr, 1), 2);

  const cellSize = getCellSize(width);
  const step = cellSize + gap;

  const cols = clampInt(
    (width + gap) / step,
    GRID.MIN_COLS,
    GRID.MAX_COLS,
  );

  const rows = clampInt(
    (height + gap) / step,
    GRID.MIN_ROWS,
    GRID.MAX_ROWS,
  );

  const gridWidth = cols * step - gap;
  const gridHeight = rows * step - gap;

  const offsetX = ((width - gridWidth) * 0.5) | 0;
  const offsetY = ((height - gridHeight) * 0.5) | 0;

  return {
    width,
    height,

    dpr: safeDpr,

    gap,
    step,
    cellSize,

    cols,
    rows,
    count: cols * rows,

    gridWidth,
    gridHeight,

    radius: Math.min(cellSize * 0.28, 4),

    offsetX,
    offsetY,
  };
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  grid: GridConfig,
): CanvasRenderingContext2D | null {
  canvas.style.width = `${grid.width}px`;
  canvas.style.height = `${grid.height}px`;

  const pixelWidth = Math.ceil(grid.width * grid.dpr);
  const pixelHeight = Math.ceil(grid.height * grid.dpr);

  if (
    canvas.width !== pixelWidth ||
    canvas.height !== pixelHeight
  ) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  if (!ctx) return null;

  ctx.setTransform(grid.dpr, 0, 0, grid.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = "source-over";

  return ctx;
}