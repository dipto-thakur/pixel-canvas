"use client";
import { useEffect, useRef } from "react";

export interface FrameContext { time: number; delta: number; }

export function useAnimationLoop(
  callback: (ctx: FrameContext) => void,
  { enabled = true, maxDelta = 32 }: { enabled?: boolean; maxDelta?: number } = {},
) {
  const cbRef  = useRef(callback);
  const rafRef = useRef<number | null>(null);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let prev: number | null = null;
    let cancelled = false;

    const loop = (time: number) => {
      if (cancelled) return;
      const delta = Math.min(prev === null ? 0 : time - prev, maxDelta);
      prev = time;
      cbRef.current({ time, delta });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, maxDelta]);
}
