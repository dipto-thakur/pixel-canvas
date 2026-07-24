import type { PixelBuffer }         from "../renderer/buffer";
import type { PixelEffect, EffectContext } from "./base";

export class EffectManager {
  private readonly effects: PixelEffect[] = [];

  add(effect: PixelEffect): void {
    const idx = this.effects.findIndex(e => e.name === effect.name);
    if (idx >= 0) { this.effects[idx] = effect; return; }
    this.effects.push(effect);
  }

  remove(name: string): void {
    const idx = this.effects.findIndex(e => e.name === name);
    if (idx >= 0) this.effects.splice(idx, 1);
  }

  get(name: string): PixelEffect | undefined {
    return this.effects.find(e => e.name === name);
  }

  clear(): void { this.effects.length = 0; }

  /**
   * Reset buffer, then run every enabled effect in registration order.
   * Effects accumulate into buffer fields using Math.max so they compose.
   */
  update(buffer: PixelBuffer, context: EffectContext): void {
    buffer.reset();
    for (const effect of this.effects) {
      if (effect.enabled) effect.update(buffer, context);
    }
  }
}
