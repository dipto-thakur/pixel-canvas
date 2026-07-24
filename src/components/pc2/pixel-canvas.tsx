"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { createGrid, resizeCanvas }      from "./grid";
import { deviceScale }                   from "./utils";
import { DEFAULT_SAMPLER_OPTIONS }       from "./sampler";
import { createGenerator }               from "./generators/factory";
import { GeneratorManager }              from "./generators/manager";
import { Timeline }                      from "./generators/timeline";
import { PixelBuffer }                   from "./renderer/buffer";
import { PixelRenderer }                 from "./renderer/renderer";
import { EffectManager }                 from "./effects/manager";
import { IdleEffect }                    from "./effects/idle";
import { ShimmerEffect }                 from "./effects/shimmer";
import { RippleEffect }                  from "./effects/ripple";
import { RevealEffect }                  from "./effects/reveal";
import { usePointer }                    from "./hooks/usePointer";
import { useResize }                     from "./hooks/useResize";
import { useAnimationLoop }              from "./hooks/useAnimationLoop";

import type { PixelCanvasProps } from "./types";
import type { PlaybackMode }     from "./generators/timeline";

export function PixelCanvas({
  text         = "DIPTO THAKUR",
  sequence,
  github,
  generator:   generatorProp,
  playback     = "once",
  replayOnHover = true,
  className,
  height       = 220,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Stable imperative refs — no React state touched during animation */
  const rendererRef  = useRef<PixelRenderer  | null>(null);
  const bufferRef    = useRef<PixelBuffer    | null>(null);
  const effectsRef   = useRef<EffectManager  | null>(null);
  const timelineRef  = useRef<Timeline       | null>(null);
  const revealRef    = useRef<RevealEffect   | null>(null);
  const readyRef     = useRef(false);

  const { ref: wrapperRef, size } = useResize<HTMLDivElement>();
  const { pointer, bind }         = usePointer();

  /* ── Build / rebuild on resize or config change ─────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return;

    readyRef.current = false;

    let disposed = false;

    const grid = createGrid(size.width, size.height, deviceScale());
    const ctx  = resizeCanvas(canvas, grid);
    if (!ctx) return;

    (async () => {
      const generator = await createGenerator({
        type:        generatorProp ?? (github ? "github" : "text"),
        grid,
        text,
        sequence,
        github,
        textOptions: {
          fontFamily:    DEFAULT_SAMPLER_OPTIONS.fontFamily,
          fontWeight:    DEFAULT_SAMPLER_OPTIONS.fontWeight,
          lineHeight:    DEFAULT_SAMPLER_OPTIONS.lineHeight,
          paddingX:      DEFAULT_SAMPLER_OPTIONS.paddingX,
          paddingY:      DEFAULT_SAMPLER_OPTIONS.paddingY,
          supersample:   DEFAULT_SAMPLER_OPTIONS.supersample,
          letterSpacing: DEFAULT_SAMPLER_OPTIONS.letterSpacing,
        },
      });

      if (disposed) return;

      const buffer   = new PixelBuffer(grid, generator.current());
      const reveal   = new RevealEffect();
      const effects  = new EffectManager();
      const renderer = new PixelRenderer(ctx);
      const timeline = new Timeline(generator, buffer, reveal, playback as PlaybackMode);

      const genMgr = new GeneratorManager();
      genMgr.register(generator);

      effects.add(new IdleEffect());
      effects.add(new ShimmerEffect());
      effects.add(new RippleEffect());
      effects.add(reveal);

      rendererRef.current = renderer;
      bufferRef.current   = buffer;
      effectsRef.current  = effects;
      timelineRef.current = timeline;
      revealRef.current   = reveal;

      /* Start from canvas centre — pointer may not be inside yet */
      const cx = grid.offsetX + grid.gridWidth  * 0.5;
      const cy = grid.offsetY + grid.gridHeight * 0.5;

      timeline.start(performance.now(), cx, cy);
      readyRef.current = true;
    })();

    return () => {
      disposed             = true;
      readyRef.current     = false;
      rendererRef.current  = null;
      bufferRef.current    = null;
      effectsRef.current   = null;
      timelineRef.current  = null;
      revealRef.current    = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, text, sequence, github, generatorProp, playback]);

  /* ── Frame loop ─────────────────────────────────────────────── */
  const frame = useCallback(({ time, delta }: { time: number; delta: number }) => {
    if (!readyRef.current) return;

    const renderer = rendererRef.current;
    const buffer   = bufferRef.current;
    const effects  = effectsRef.current;
    const timeline = timelineRef.current;

    if (!renderer || !buffer || !effects || !timeline) return;

    timeline.update(time);
    effects.update(buffer, { time, delta, pointer: pointer.current });
    renderer.render(buffer);
  }, [pointer]);

  useAnimationLoop(frame);

  /* ── Pointer enter — replay on hover ───────────────────────── */
  const onPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      bind.onPointerEnter(e);
      if (!replayOnHover) return;
      const tl = timelineRef.current;
      if (!tl) return;
      tl.replay(performance.now(), pointer.current.x, pointer.current.y);
    },
    [bind, pointer, replayOnHover],
  );

  const cssHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      {...bind}
      onPointerEnter={onPointerEnter}
      className={cn("relative w-full overflow-hidden bg-[#090909]", className)}
      style={{ height: cssHeight }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
