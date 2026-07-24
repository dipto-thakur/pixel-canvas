import { SHIMMER } from "../constants";
import { gaussian } from "../animation";
import type { PixelEffect, EffectContext } from "./base";
import type { PixelBuffer } from "../renderer/buffer";

/**
 * ShimmerEffect — Premium diagonal light sweep.
 *
 * Features
 * - Breathing beam width
 * - Gentle speed modulation
 * - Soft wavefront distortion
 * - Stable per-pixel identity
 * - Glass-like refraction
 * - Soft leading/trailing edge
 * - Beam coherence
 * - Slight exposure breathing
 * - Delayed scale response
 *
 * Renderer:
 * finalAlpha = opacity * coverage
 */
export class ShimmerEffect implements PixelEffect {
  readonly name = "shimmer";
  enabled = true;

  update(buffer: PixelBuffer, { time }: EffectContext) {
    const {
      count,
      x,
      y,
      coverage,
      opacity,
      scale,
      grid,
    } = buffer;

    const t = time * 0.001;

    const span =
      grid.gridWidth +
      grid.gridHeight * 0.5;

    /* ------------------------
       Beam behaviour
    ------------------------- */

    const speed =
      SHIMMER.speed *
      (1 +
        Math.sin(t * 0.18) *
          0.04);

    const sweep =
      ((t * speed) % span) -
      grid.gridHeight;

    const width =
      SHIMMER.width *
      (1 +
        Math.sin(t * 0.35) *
          0.08);

    const exposure =
      1 +
      Math.sin(t * 0.22) *
        0.025;

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const projection =
        x[i] +
        y[i] * SHIMMER.angle;

      const seed =
        x[i] * 12.9898 +
        y[i] * 78.233;

      const phase =
        Math.sin(seed) *
        43758.5453;

      /* ------------------------
         Wavefront distortion
      ------------------------- */

      const ripple =
        Math.sin(
          y[i] * 0.055 +
            t * 0.7
        ) *
          0.8 +
        Math.sin(
          x[i] * 0.032 +
            t * 0.45
        ) *
          0.35;

      /* ------------------------
         Stable pixel bias
      ------------------------- */

      const pixelBias =
        Math.sin(
          x[i] * 0.18 +
            y[i] * 0.14
        ) * 0.45;

      /* ------------------------
         Glass refraction
      ------------------------- */

      const refraction =
        Math.sin(
          projection * 0.03 +
            phase
        ) * 0.22;

      const d =
        projection -
        sweep +
        ripple +
        pixelBias +
        refraction;

      const influence =
        gaussian(d, width);

      if (influence <= 0.0001)
        continue;

      /* ------------------------
         Soft beam profile
      ------------------------- */

      const leading =
        gaussian(
          d - width * 0.08,
          width * 0.55
        );

      const trailing =
        gaussian(
          d + width * 0.18,
          width * 1.2
        );

      const profile =
        influence * 0.65 +
        leading * 0.25 +
        trailing * 0.10;

      /* ------------------------
         Beam coherence
      ------------------------- */

      const coherence =
        1 +
        Math.sin(
          projection * 0.018 +
            t * 0.6
        ) *
          0.025;

      /* ------------------------
         Exposure breathing
      ------------------------- */

      const intensity =
        (0.96 +
          Math.sin(
            t * 0.8 +
              projection * 0.02
          ) *
            0.04) *
        coherence *
        exposure;

      opacity[i] = Math.max(
        opacity[i],
        opacity[i] +
          profile *
            SHIMMER.opacity *
            intensity
      );

      /* ------------------------
         Slight glass bloom
      ------------------------- */

      scale[i] = Math.max(
        scale[i],
        1 +
          gaussian(
            d - width * 0.06,
            width * 0.95
          ) *
            SHIMMER.scale
      );

      /* ------------------------
         Tiny edge sparkle
         (only inside beam)
      ------------------------- */

      const sparkle =
        Math.pow(
          Math.max(
            0,
            Math.sin(
              projection *
                0.045 +
                phase +
                t * 0.4
            )
          ),
          18
        ) * 0.012;

      opacity[i] +=
        sparkle * influence;
    }
  }
}