import { RIPPLE } from "../constants";
import { smoothstep } from "../animation";
import type { PixelEffect, EffectContext } from "./base";
import type { PixelBuffer } from "../renderer/buffer";

/**
 * RippleEffect — Premium cursor interaction.
 *
 * Design goals
 * - Feels like a responsive surface, not a radial light
 * - Motion-aware deformation
 * - Soft glass-like pressure
 * - Organic edge variation
 * - Velocity-driven energy
 * - Smooth scale lag
 *
 * Renderer:
 * finalAlpha = opacity * coverage
 */
export class RippleEffect implements PixelEffect {
  readonly name = "ripple";
  enabled = true;

  update(buffer: PixelBuffer, { pointer }: EffectContext) {
    if (!pointer.inside) return;

    const {
      count,
      x,
      y,
      coverage,
      opacity,
      scale,
      lift,
    } = buffer;

    const px = pointer.x;
    const py = pointer.y;

    const speed = Math.hypot(pointer.vx, pointer.vy);

    // Velocity expands interaction radius
    const radius =
      RIPPLE.radius +
      speed * RIPPLE.velocityMultiplier;

    // Normalized cursor direction
    const len = Math.max(speed, 1);

    const dirX = pointer.vx / len;
    const dirY = pointer.vy / len;

    // Ripple stretches slightly along movement
    const stretch =
      1 +
      Math.min(speed * 0.02, 0.35);

    // Fast movement carries slightly more energy
    const energy =
      1 +
      Math.min(speed * 0.004, 0.16);

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const dx = x[i] - px;
      const dy = y[i] - py;

      /* ------------------------
         Motion-aware distance
      ------------------------- */

      const along =
        dx * dirX +
        dy * dirY;

      const across =
        -dx * dirY +
        dy * dirX;

      const dist = Math.sqrt(
        (along / stretch) *
          (along / stretch) +
          across * across
      );

      if (dist > radius) continue;

      /* ------------------------
         Organic boundary
      ------------------------- */

      const edge =
        Math.sin(
          x[i] * 0.18 +
            y[i] * 0.22
        ) *
          0.55 +
        Math.sin(
          x[i] * 0.11 -
            y[i] * 0.14
        ) *
          0.35;

      const influence = smoothstep(
        Math.max(
          0,
          1 -
            (dist + edge) /
              radius
        )
      );

      if (influence <= 0.0001)
        continue;

      /* ------------------------
         Soft pressure center
      ------------------------- */

      const pressure =
        Math.exp(
          -(
            dist * dist
          ) /
            (radius *
              radius *
              0.16)
        );

      /* ------------------------
         Glass micro-refraction
      ------------------------- */

      const refraction =
        Math.sin(
          (dx + dy) *
            0.18
        ) * 0.015;

      /* ------------------------
         Opacity
      ------------------------- */

      opacity[i] = Math.max(
        opacity[i],
        opacity[i] +
          (
            influence *
              RIPPLE.opacity +
            pressure * 0.08 +
            refraction
          ) *
            energy
      );

      /* ------------------------
         Scale
         (slightly delayed)
      ------------------------- */

      const scaleInfluence =
        smoothstep(
          Math.max(
            0,
            1 -
              (
                dist +
                edge +
                radius * 0.08
              ) /
                radius
          )
        );

      scale[i] = Math.max(
        scale[i],
        1 +
          scaleInfluence *
            RIPPLE.scale *
            (0.96 +
              pressure *
                0.04)
      );

      /* ------------------------
         Surface lift
      ------------------------- */

      const liftInfluence =
        influence *
          influence *
          0.7 +
        pressure *
          0.3;

      lift[i] = Math.max(
        lift[i],
        liftInfluence *
          RIPPLE.lift
      );
    }
  }
}