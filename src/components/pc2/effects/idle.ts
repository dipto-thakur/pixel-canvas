import { IDLE } from "../constants";
import type { PixelEffect, EffectContext } from "./base";
import type { PixelBuffer } from "../renderer/buffer";

/**
 * IdleEffect — Premium ambient display.
 *
 * Design goals
 * - Alive, not animated
 * - Imperceptible analog instability
 * - Organic pixel individuality
 * - Premium OLED-like idle behavior
 *
 * Renderer:
 * finalAlpha = opacity * coverage
 */
export class IdleEffect implements PixelEffect {
  readonly name = "idle";
  enabled = true;

  update(buffer: PixelBuffer, { time }: EffectContext) {
    const t = time * 0.001;

    const {
      opacity,
      scale,
      radius,
      x,
      y,
      coverage,
      count,
      grid,
    } = buffer;

    const baseRadius = Math.min(grid.cellSize * 0.28, 4);

    /* ------------------------
       Global display behaviour
    ------------------------- */

    const exposure =
      1 +
      Math.sin(t * 0.035) * 0.02;

    const luminance =
      1 +
      Math.sin(t * 0.55) * 0.004;

    // Tiny panel-wide electrical instability
    const microFlicker =
      Math.sin(t * 17.3) * 0.0012 +
      Math.sin(t * 29.7) * 0.0008 +
      Math.sin(t * 47.2) * 0.0004;

    for (let i = 0; i < count; i++) {
      if (coverage[i] <= 0.001) continue;

      const nx = x[i] * 0.012;
      const ny = y[i] * 0.012;

      /* ------------------------
         Organic ambient motion
      ------------------------- */

      const wave =
        Math.sin(nx + t * 0.18) *
        Math.cos(ny + t * 0.15);

      const pulse =
        Math.sin(
          t * 0.28 +
          nx * 1.2 +
          ny
        );

      const ambient =
        wave * 0.65 +
        pulse * 0.35;

      opacity[i] +=
        (IDLE.baseOpacity +
          ambient *
            IDLE.amplitude) *
        exposure *
        luminance;

      scale[i] +=
        ambient * 0.012;

      radius[i] =
        baseRadius +
        ambient * 0.18;

      /* ------------------------
         Global micro flicker
      ------------------------- */

      opacity[i] += microFlicker;

      /* ------------------------
         Stable pixel identity
      ------------------------- */

      const seed =
        x[i] * 12.9898 +
        y[i] * 78.233;

      const phase =
        Math.sin(seed) *
        43758.5453;

      const temperature =
        Math.sin(seed * 0.0003) *
        0.003;

      opacity[i] += temperature;

      /* ------------------------
         Pixel persistence
      ------------------------- */

      const persistence =
        Math.sin(
          phase * 0.00002 +
          t * 0.12
        ) * 0.0015;

      opacity[i] += persistence;

      /* ------------------------
         Panel noise
      ------------------------- */

      const noise =
        Math.sin(
          x[i] * 0.41 +
          y[i] * 0.37 +
          t * 0.45
        ) * 0.0025 +
        Math.sin(
          x[i] * 0.19 -
          y[i] * 0.23 +
          t * 0.71
        ) * 0.0015;

      opacity[i] += noise;

      /* ------------------------
         Horizontal panel aging
      ------------------------- */

      const scanline =
        Math.sin(
          y[i] * 0.065 +
          t * 0.04
        ) * 0.0025;

      opacity[i] += scanline;

      /* ------------------------
         Vertical voltage drift
      ------------------------- */

      const column =
        Math.sin(
          x[i] * 0.045 +
          t * 0.055
        ) * 0.002;

      opacity[i] += column;

      /* ------------------------
         Display refresh bias
      ------------------------- */

      const refresh =
        Math.sin(
          t * 1.8 +
          x[i] * 0.015 +
          y[i] * 0.021
        ) *
        Math.sin(
          t * 1.15 +
          y[i] * 0.008
        );

      opacity[i] +=
        refresh * 0.006;

      /* ------------------------
         Cluster shimmer
      ------------------------- */

      const cluster =
        Math.pow(
          Math.max(
            0,
            Math.sin(
              nx * 1.4 +
              ny * 1.1 +
              t * 0.06
            )
          ),
          18
        ) * 0.012;

      opacity[i] += cluster;
      scale[i] += cluster * 0.15;

      /* ------------------------
         Rare OLED twinkle
      ------------------------- */

      const blink = Math.pow(
        Math.max(
          0,
          Math.sin(
            t * 0.08 +
            phase
          )
        ),
        42
      );

      if (blink > 0.0005) {
        opacity[i] +=
          blink * 0.04;

        scale[i] +=
          blink * 0.0035;

        radius[i] +=
          blink * 0.06;
      }

      /* ------------------------
         Radius inertia
      ------------------------- */

      radius[i] +=
        Math.sin(
          phase +
          t * 0.09
        ) * 0.025;

      /* ------------------------
         Gentle edge attenuation
      ------------------------- */

      const dx =
        Math.abs(
          x[i] -
            grid.width * 0.5
        ) /
        (grid.width * 0.5);

      const dy =
        Math.abs(
          y[i] -
            grid.height * 0.5
        ) /
        (grid.height * 0.5);

      const edge =
        1 -
        (dx * dx + dy * dy) *
          0.04;

      opacity[i] *= edge;
    }
  }
}