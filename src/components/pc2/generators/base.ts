import type { GridConfig } from "../types";

/**
 * Generator interface — the only contract between content and pipeline.
 * Renderer, Effects, and Timeline never know what produced the coverage.
 */
export interface Generator {
  readonly name: string;

  /** Build all coverage maps. Async to allow sampling, decoding, etc. */
  build(grid: GridConfig): Promise<void>;

  /** Coverage for the currently active frame/item. */
  current(): Float32Array;

  /** Advance to next item. Returns new coverage. */
  next(): Float32Array;

  /** Go to previous item. Returns new coverage. */
  previous(): Float32Array;

  /** Reset to initial state. */
  reset(): void;

  /** Total number of frames/items this generator exposes. */
  readonly length: number;

  /** Currently active index. */
  readonly index: number;

  /**
   * Whether there is a subsequent item.
   * Generators with a single frame always return false.
   */
  hasNext(): boolean;

  /**
   * Whether there is a previous item.
   * Generators with a single frame always return false.
   */
  hasPrevious(): boolean;

  /**
   * Hold duration (ms) for the current item before Timeline dissolves it.
   * Generators with a single frame may return Infinity to hold forever.
   */
  readonly currentDuration: number;
}
