export interface GridConfig {
  width: number;
  height: number;
  dpr: number;
  gap: number;
  step: number;
  cellSize: number;
  cols: number;
  rows: number;
  count: number;
  gridWidth: number;
  gridHeight: number;
  radius: number;
  offsetX: number;
  offsetY: number;
}

export interface TextSamplerOptions {
  text:          string;
  fontFamily:    string;
  fontWeight:    number;
  letterSpacing: number;
  lineHeight:    number;
  paddingX:      number;
  paddingY:      number;
  supersample:   number;
}

export interface SampleResult {
  coverage: Float32Array;
  cols:     number;
  rows:     number;
}

export interface PointerState {
  x:      number;
  y:      number;
  vx:     number;
  vy:     number;
  inside: boolean;
}

export type GeneratorType = "text" | "github";

export type PlaybackMode = "once" | "loop" | "manual";

/* ── Text sequence ─────────────────────────────────────────────── */
export interface SequenceItem {
  text:      string;
  duration?: number;
}

/* ── GitHub ────────────────────────────────────────────────────── */
export interface GithubOptions {
  year?:         number;
}

/* ── Props ─────────────────────────────────────────────────────── */
export interface PixelCanvasProps {
  text?:          string;
  sequence?:      SequenceItem[];
  github?:        GithubOptions;
  generator?:     GeneratorType;
  playback?:      PlaybackMode;
  replayOnHover?: boolean;
  className?:     string;
  height?:        number | string;
}
// in src/components/pc2/types.ts
import type { ContributionMatrix } from "@/lib/github-contributions";

export interface GithubOptions {
  contributions: ContributionMatrix;
}
