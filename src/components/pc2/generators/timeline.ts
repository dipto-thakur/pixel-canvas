import type { Generator }    from "./base";
import type { PixelBuffer }  from "../renderer/buffer";
import type { RevealEffect } from "../effects/reveal";

type TimelinePhase = "building" | "revealing" | "holding" | "dissolving" | "pending" | "idle";

export type PlaybackMode = "once" | "loop" | "manual";

/**
 * src\components\pc2\generators\timeline.ts
 * Timeline — generator-agnostic sequence controller.
 *
 * Depends ONLY on the Generator interface.
 * Never imports TextGenerator, GithubGenerator, or any concrete type.
 *
 * reveal → settle → hold(jittered) → breathing gap → anticipation → next reveal …
 * All delays run off the shared timeline clock passed into update(time) —
 * never performance.now() — via a small scheduled-transition mechanism.
 */

const ANTICIPATION_MIN = 40;   // ms — pause before a reveal starts, feels intentional
const ANTICIPATION_MAX = 80;
const BREATH_GAP_MIN   = 120;  // ms — pause after dissolve, before next reveal
const BREATH_GAP_MAX   = 220;
const LOOP_PAUSE_MIN    = 300; // ms — pause before restarting a loop
const LOOP_PAUSE_MAX    = 600;
const HOLD_JITTER_MIN   = 0.96; // organic hold-duration variation, stable per item
const HOLD_JITTER_MAX   = 1.06;

export class Timeline {
  private _phase:        TimelinePhase = "building";
  private _holdStart     = 0;
  private _holdDuration  = 0;
  private _played        = false;
  private _playback:     PlaybackMode;

  private _pendingAt:     number | null = null;
  private _pendingDelay   = 0;
  private _pendingAction: ((time: number) => void) | null = null;

  private _seedCounter = 0;

  constructor(
    private readonly generator: Generator,
    private readonly buffer:    PixelBuffer,
    private readonly reveal:    RevealEffect,
    playback: PlaybackMode = "once",
  ) {
    this._playback = playback;
    this.reveal.onDissolveComplete = () => this._onDissolveComplete();
  }

  // ── Public API ─────────────────────────────────────────────────

  start(time: number, x: number, y: number): void {
    this.generator.reset();
    this._played = false;
    this._schedule(this._rand(ANTICIPATION_MIN, ANTICIPATION_MAX), (t) => {
      this.buffer.coverage = this.generator.current();
      this._phase = "revealing";
      this.reveal.startReveal(this.buffer, t, x, y);
    }, time);
  }

  /** Replays the sequence from the beginning if idle (used by replayOnHover). */
  replay(time: number, x: number, y: number): void {
    if (!this._played || this._phase !== "idle") return;
    this.start(time, x, y);
  }

  update(time: number): void {
    switch (this._phase) {
      case "building":
      case "idle":
        return;

      case "pending":
        this._updatePending(time);
        return;

      case "revealing":
        if (this.reveal.currentPhase !== "hold") return;
        this._holdStart    = time;
        this._holdDuration = this.generator.currentDuration === Infinity
          ? Infinity
          : this.generator.currentDuration * this._rand(HOLD_JITTER_MIN, HOLD_JITTER_MAX);
        this._phase = "holding";
        return;

      case "holding":
        // Manual mode: never auto-dissolve
        if (this._playback === "manual") return;
        // Infinity duration: never auto-dissolve (hold until pointer leaves)
        if (this._holdDuration === Infinity) return;
        if (time - this._holdStart < this._holdDuration) return;
        this._phase = "dissolving";
        this.reveal.startDissolve(time);
        return;

      case "dissolving":
        return;
    }
  }

  get isIdle():    boolean { return this._phase === "idle"; }
  get hasPlayed(): boolean { return this._played; }

  reset(): void {
    this._phase          = "building";
    this._played         = false;
    this._holdStart      = 0;
    this._holdDuration   = 0;
    this._pendingAt       = null;
    this._pendingAction   = null;
    this.generator.reset();
  }

  // ── Scheduled transitions (shared clock only) ─────────────────

  /** startTime, if known now, pins the deadline immediately; otherwise the
   *  deadline is pinned on the next update(time) tick — used when a callback
   *  (onDissolveComplete) fires without a time value of its own. */
  private _schedule(delayMs: number, action: (time: number) => void, startTime?: number): void {
    this._phase         = "pending";
    this._pendingDelay  = delayMs;
    this._pendingAt      = startTime !== undefined ? startTime + delayMs : null;
    this._pendingAction  = action;
  }

  private _updatePending(time: number): void {
    if (this._pendingAt === null) {
      this._pendingAt = time + this._pendingDelay;
    }
    if (time < this._pendingAt) return;

    const action = this._pendingAction;
    this._pendingAction = null;
    this._pendingAt      = null;
    action?.(time);
  }

  /** Deterministic, stable-per-call jitter — advances a counter so it's never
   *  regenerated within a frame, but varies across items/cycles. */
  private _rand(min: number, max: number): number {
    this._seedCounter += 1;
    const v = Math.sin(this._seedCounter * 12.9898) * 43758.5453;
    const n = v - Math.floor(v);
    return min + n * (max - min);
  }

  // ── Private ────────────────────────────────────────────────────

  private _onDissolveComplete(): void {
    const { _playback: mode } = this;

    if (this.generator.hasNext()) {
      this._schedule(this._rand(BREATH_GAP_MIN, BREATH_GAP_MAX), () => {
        this._schedule(this._rand(ANTICIPATION_MIN, ANTICIPATION_MAX), (t2) => {
          this.buffer.coverage = this.generator.next();
          this._phase = "revealing";
          const { offsetX, offsetY, gridWidth, gridHeight } = this.buffer.grid;
          this.reveal.startReveal(
            this.buffer,
            t2,
            offsetX + gridWidth  * 0.5,
            offsetY + gridHeight * 0.5,
          );
        });
      });
      return;
    }

    if (mode === "loop") {
      this._schedule(this._rand(LOOP_PAUSE_MIN, LOOP_PAUSE_MAX), () => {
        this._schedule(this._rand(ANTICIPATION_MIN, ANTICIPATION_MAX), (t2) => {
          this.generator.reset();
          this.buffer.coverage = this.generator.current();
          this._phase = "revealing";
          const { offsetX, offsetY, gridWidth, gridHeight } = this.buffer.grid;
          this.reveal.startReveal(
            this.buffer,
            t2,
            offsetX + gridWidth  * 0.5,
            offsetY + gridHeight * 0.5,
          );
        });
      });
      return;
    }

    // "once" or "manual"
    this._phase  = "idle";
    this._played = true;
  }
}