import { COLORS } from "../constants";
import { roundedRect } from "../utils";
import type { PixelBuffer } from "./buffer";

export class PixelRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  render(buffer: PixelBuffer) {
    this.clear();

    const { ctx } = this;
    const { cellSize } = buffer.grid;
    const { count, x, y, coverage, opacity, scale, lift, radius } = buffer;

    ctx.fillStyle = COLORS.PIXEL;

    for (let i = 0; i < count; i++) {
      const c = coverage[i];
      if (c <= 0.001) continue;

      const alpha = opacity[i] * c;
      if (alpha <= 0.003) continue;

      const size = Math.max(0.5, cellSize * scale[i]);
      const px = x[i] + (cellSize - size) * 0.5;
      const py = y[i] + (cellSize - size) * 0.5 - lift[i];

      ctx.globalAlpha = Math.min(alpha, 1);

      roundedRect(
        ctx,
        px,
        py,
        size,
        size,
        Math.min(radius[i], size * 0.5),
      );

      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}