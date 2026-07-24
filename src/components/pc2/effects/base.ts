import type { PointerState } from "../types";
import type { PixelBuffer }  from "../renderer/buffer";

export interface EffectContext {
  time:    number;
  delta:   number;
  pointer: PointerState;
}

export interface PixelEffect {
  readonly name: string;
  enabled: boolean;
  update(buffer: PixelBuffer, ctx: EffectContext): void;
  reset?(): void;
}
