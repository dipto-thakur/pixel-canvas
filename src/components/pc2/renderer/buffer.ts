import type { GridConfig } from "../types";

/**
 * All per-cell state lives in flat Float32Arrays.
 * Zero allocations after construction.
 */
export class PixelBuffer {
  readonly count: number;

  readonly x: Float32Array;
  readonly y: Float32Array;

  readonly opacity: Float32Array;
  readonly scale: Float32Array;
  readonly lift: Float32Array;
  readonly radius: Float32Array;

  coverage: Float32Array;

  private readonly defaultRadius: number;

  constructor(
    readonly grid: GridConfig,
    coverage: Float32Array
  ) {
    this.count = grid.cols * grid.rows;
    this.coverage = coverage;

    this.defaultRadius = this.grid.radius;

    this.x = new Float32Array(this.count);
    this.y = new Float32Array(this.count);

    this.opacity = new Float32Array(this.count);
    this.scale = new Float32Array(this.count);
    this.lift = new Float32Array(this.count);
    this.radius = new Float32Array(this.count);

    this.buildLayout();
    this.reset();
  }

  private buildLayout() {
    const {
      cols,
      rows,
      step,
      offsetX,
      offsetY,
    } = this.grid;

    let i = 0;

    for (let row = 0; row < rows; row++) {
      const py = offsetY + row * step;

      for (let col = 0; col < cols; col++, i++) {
        this.x[i] = offsetX + col * step;
        this.y[i] = py;
        this.radius[i] = this.defaultRadius;
      }
    }
  }

  setCoverage(coverage: Float32Array) {
    if (coverage.length !== this.count) {
      throw new Error(
        "PixelBuffer: coverage size mismatch."
      );
    }

    this.coverage = coverage;
  }

  /**
   * Cold reset.
   * Use only during initialization.
   */
  reset() {
    this.opacity.fill(0);
    this.scale.fill(1);
    this.lift.fill(0);
    this.radius.fill(this.defaultRadius);
  }

  /**
   * Warm reset.
   * Called every frame instead of reset().
   * Preserves a little momentum.
   */
  beginFrame() {
    const {
      count,
      opacity,
      scale,
      lift,
      radius,
    } = this;

    for (let i = 0; i < count; i++) {
      opacity[i] *= 0.90;

      scale[i] =
        1 +
        (scale[i] - 1) * 0.82;

      lift[i] *= 0.85;

      radius[i] +=
        (this.defaultRadius - radius[i]) * 0.18;
    }
  }
}