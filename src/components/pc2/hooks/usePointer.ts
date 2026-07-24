"use client";
import { useCallback, useRef } from "react";
import type { PointerState } from "../types";

export function usePointer() {
  const pointer = useRef<PointerState>({ x: -9999, y: -9999, vx: 0, vy: 0, inside: false });
  const last    = useRef({ x: -9999, y: -9999, time: 0 });

  const _update = useCallback((e: React.PointerEvent<HTMLElement>, entering = false) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const now  = performance.now();

    if (entering || last.current.time === 0) {
      pointer.current.vx = 0;
      pointer.current.vy = 0;
    } else {
      const dt = Math.max(1, now - last.current.time);
      pointer.current.vx = ((x - last.current.x) / dt) * 16.667;
      pointer.current.vy = ((y - last.current.y) / dt) * 16.667;
    }

    pointer.current.x      = x;
    pointer.current.y      = y;
    pointer.current.inside = true;
    last.current           = { x, y, time: now };
  }, []);

  const onPointerMove  = useCallback((e: React.PointerEvent<HTMLElement>) => _update(e),       [_update]);
  const onPointerEnter = useCallback((e: React.PointerEvent<HTMLElement>) => _update(e, true), [_update]);
  const onPointerLeave = useCallback(() => {
    pointer.current = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };
    last.current.time = 0;
  }, []);

  return { pointer, bind: { onPointerMove, onPointerEnter, onPointerLeave } };
}
