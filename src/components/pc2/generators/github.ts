// src/components/PixelCanvas/generators/github.ts
import type { Generator } from "./base";
import type { GridConfig } from "../types";
import type { ContributionMatrix } from "@/lib/github-contributions";

export class GithubGenerator implements Generator {
  readonly name = "github";

  private _coverage: Float32Array = new Float32Array(0);
  private _weeks: ContributionMatrix;

  constructor(contributions: ContributionMatrix) {
    this._weeks = Array.isArray(contributions)
      ? contributions.map((week) => (Array.isArray(week) ? [...week] : []))
      : [];
  }

  get length()          { return 1; }
  get index()           { return 0; }
  get currentDuration() { return Infinity; }

  hasNext():     boolean { return false; }
  hasPrevious(): boolean { return false; }

  async build(grid: GridConfig): Promise<void> {
    this._coverage = this._sample(grid);
  }

  private _sample(grid: GridConfig): Float32Array {
    const { cols, rows } = grid;
    const coverage = new Float32Array(cols * rows);
    const weeks = this._weeks;

    if (!weeks.length) return coverage;

    const weekCount = Math.min(weeks.length, cols);
    const dayCount = 7;

    const startCol = Math.max(0, Math.floor((cols - weekCount) * 0.5));
    const startRow = Math.max(0, Math.floor((rows - dayCount) * 0.5));

    for (let w = 0; w < weekCount; w++) {
      const week = weeks[w];
      if (!Array.isArray(week)) continue;

      const gx = startCol + w;
      if (gx >= cols) break;

      for (let d = 0; d < Math.min(dayCount, week.length); d++) {
        const gy = startRow + d;
        if (gy >= rows) break;

        const raw = week[d];
        if (typeof raw !== "number" || isNaN(raw)) continue;

        coverage[gy * cols + gx] = _intensityToOpacity(
          Math.max(0, Math.min(4, Math.round(raw))),
        );
      }
    }

    return coverage;
  }

  current():  Float32Array { return this._coverage; }
  next():     Float32Array { return this._coverage; }
  previous(): Float32Array { return this._coverage; }
  reset():    void         {}
}

function _intensityToOpacity(level: number): number {
  switch (level) {
    case 0:  return 0.04;
    case 1:  return 0.28;
    case 2:  return 0.52;
    case 3:  return 0.76;
    case 4:  return 1.00;
    default: return 0;
  }
}