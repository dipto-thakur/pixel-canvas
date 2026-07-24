import { REVEAL } from "../constants";
import { clamp01, easeInCubic } from "../animation";
import type { PixelBuffer }              from "../renderer/buffer";
import type { EffectContext, PixelEffect } from "./base";

type Phase = "idle" | "reveal" | "settle" | "hold" | "dissolve";

export class RevealEffect implements PixelEffect {
  readonly name = "reveal";
  enabled       = true;

  private phase:      Phase = "idle";
  private phaseStart        = 0;

  private delayCache:  Float32Array = new Float32Array(0);
  private seedCache:   Float32Array = new Float32Array(0);
  private clusterCache: Float32Array = new Float32Array(0);
  private maxDelay = 1;

  // settle exponential-decay anchors
  private settleO: Float32Array = new Float32Array(0);
  private settleS: Float32Array = new Float32Array(0);
  private settleL: Float32Array = new Float32Array(0);

  onDissolveComplete: (() => void) | null = null;

  reset() {
    this.phase      = "idle";
    this.phaseStart = 0;
  }

  startReveal(buffer: PixelBuffer, time: number, px: number, py: number) {
    this.phase      = "reveal";
    this.phaseStart = time;
    this._computeDelays(buffer, px, py);
  }

  startDissolve(time: number) {
    if (this.phase !== "dissolve") {
      this.phase      = "dissolve";
      this.phaseStart = time;
    }
  }

  get currentPhase(): "idle" | "reveal" | "hold" | "dissolve" {
    return this.phase === "settle" ? "reveal" : this.phase;
  }

  update(buffer: PixelBuffer, { time, pointer }: EffectContext) {
    if (this.phase === "idle" && pointer.inside) {
      this.startReveal(buffer, time, pointer.x, pointer.y);
    }
    if (this.phase === "hold" && !pointer.inside) {
      this.startDissolve(time);
    }

    switch (this.phase) {
      case "reveal":   this._reveal(buffer, time);   break;
      case "settle":   this._settle(buffer, time);   break;
      case "hold":     this._hold(buffer, time);      break;
      case "dissolve": this._dissolve(buffer, time); break;
    }
  }

  // ── spatial (position-based) seed — order-independent ──────────

  private _ensureCaches(n: number, x: Float32Array | number[], y: Float32Array | number[]) {
    if (this.seedCache.length === n) return;
    this.seedCache    = new Float32Array(n);
    this.clusterCache = new Float32Array(n);
    this.settleO      = new Float32Array(n);
    this.settleS      = new Float32Array(n);
    this.settleL      = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = Math.sin(x[i] * 127.1 + y[i] * 311.7) * 43758.5453123;
      this.seedCache[i] = v - Math.floor(v);
    }
  }

  private _flow(x: number, y: number, seed: number): number {
    const h  = Math.sin(x * 0.014 + seed * 6.283);
    const vr = Math.sin(y * 0.017 + seed * 3.1);
    const d45  = Math.sin((x + y) * 0.010 - seed * 2.4);
    const d135 = Math.sin((x - y) * 0.012 + seed * 4.8);
    return h * 0.22 + vr * 0.28 + d45 * 0.30 + d135 * 0.20; // ~[-1,1]
  }

  private _computeDelays(buffer: PixelBuffer, px: number, py: number) {
    const n = buffer.count;
    const { x, y, grid } = buffer;
    this._ensureCaches(n, x, y);

    if (this.delayCache.length !== n) this.delayCache = new Float32Array(n);

    const maxDist = Math.hypot(grid.gridWidth, grid.gridHeight) || 1;
    let max = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] + grid.cellSize * 0.5 - px;
      const dy = y[i] + grid.cellSize * 0.5 - py;
      const distNorm = Math.sqrt(Math.hypot(dx, dy) / maxDist); // sqrt compression
      const seed = this.seedCache[i];
      const flowNorm = (this._flow(x[i], y[i], seed) + 1) * 0.5;

      const d = (distNorm * 0.7 + flowNorm * 0.2 + seed * 0.1) * REVEAL.stagger;
      this.delayCache[i] = d;
      this.clusterCache[i] = Math.round(flowNorm * 10) / 10; // coherent patch id
      if (d > max) max = d;
    }
    this.maxDelay = max > 0 ? max : 1;
  }

  private _reveal(buffer: PixelBuffer, time: number) {
    const elapsed = time - this.phaseStart;
    const { count, coverage, opacity, scale, lift } = buffer;

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const seed = this.seedCache[i] ?? 0.5;
      const thickness = REVEAL.duration * (0.15 + seed * 0.15);
      const start = this.delayCache[i] - thickness * 0.5;
      const t = clamp01((elapsed - start) / (REVEAL.duration + thickness));
      const e = smootherstep(t);

      // overshoot peak shifted to ~67%, asymmetric (e^2 * (1-e), normalized)
      const ov = (e * e * (1 - e)) / 0.1481;
      const overshoot = 1 + ov * 0.08;

      opacity[i] = Math.max(opacity[i], e * REVEAL.opacity);
      scale[i]   = Math.max(scale[i], (1 + e * (REVEAL.scale * 0.8)) * overshoot);
      lift[i]    = Math.max(lift[i], e * (REVEAL.lift * 0.75));
    }

    if (elapsed > REVEAL.duration + REVEAL.stagger) {
      this.settleO.set(opacity.subarray(0, count));
      this.settleS.set(scale.subarray(0, count));
      this.settleL.set(lift.subarray(0, count));
      this.phase      = "settle";
      this.phaseStart = time;
    }
  }

  private _settle(buffer: PixelBuffer, time: number) {
    const elapsed = time - this.phaseStart;
    const { count, coverage, opacity, scale, lift } = buffer;
    const SETTLE_DURATION = 80;
    const k = 5.2 / SETTLE_DURATION; // exponential decay rate

    let allDone = true;

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const seed = this.seedCache[i] ?? 0.5;
      const jO = 1 + (seed - 0.5) * 0.02;
      const jS = 1 + (seed - 0.5) * 0.02;
      const jL = 1 + (seed - 0.5) * 0.04;

      const tO = 0.94 * jO;
      const tS = 1.03 * jS;
      const tL = 1.8  * jL;

      const localDelay = seed * 15;
      const t = elapsed - localDelay;
      if (t < SETTLE_DURATION) allDone = false;
      const decay = t > 0 ? Math.exp(-k * t) : 1;

      opacity[i] = tO + (this.settleO[i] - tO) * decay;
      scale[i]   = tS + (this.settleS[i] - tS) * decay;
      lift[i]    = tL + (this.settleL[i] - tL) * decay;
    }

    if (allDone || elapsed > SETTLE_DURATION + 15) {
      this.phase      = "hold";
      this.phaseStart = time;
    }
  }

  private _hold(buffer: PixelBuffer, time: number) {
    const { count, coverage, opacity, scale, lift } = buffer;

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const seed = this.seedCache[i] ?? 0.5;
      const breathe = Math.sin(time * 0.0015 + seed * 6.283);

      const jO = 1 + (seed - 0.5) * 0.02 + breathe * 0.002;
      const jS = 1 + (seed - 0.5) * 0.02 + breathe * 0.002;
      const jL = 1 + (seed - 0.5) * 0.04 + breathe * 0.01;

      opacity[i] = 0.94 * jO;
      scale[i]   = 1.03 * jS;
      lift[i]    = 1.8  * jL;
    }
  }

  private _dissolve(buffer: PixelBuffer, time: number) {
    const elapsed = time - this.phaseStart;
    const { count, coverage, opacity, scale, lift } = buffer;
    const p = clamp01(elapsed / REVEAL.dissolve);

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const cluster = this.clusterCache[i] ?? 0.5;
      const seed = this.seedCache[i] ?? 0.5;
      const offset = (cluster - 0.5) * 0.35 + (seed - 0.5) * 0.05;

      const pp = clamp01(p + offset);
      const eased = 1 - easeInCubic(pp);
      const tail = Math.exp(-pp * 6) * 0.15; // softer end, energy loss
      const fade = clamp01(eased * 0.85 + tail);

      opacity[i] = Math.max(opacity[i], fade);
      scale[i]   = Math.max(scale[i], 1 + fade * 0.05);
      lift[i]    = Math.max(lift[i], fade * 1.5);
    }

    if (p >= 1) {
      this.phase = "idle";
      this.onDissolveComplete?.();
    }
  }
}

function smootherstep(t: number): number {
  const c = clamp01(t);
  return c * c * c * (c * (c * 6 - 15) + 10);
}