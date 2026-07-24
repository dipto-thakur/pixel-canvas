"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Size { width: number; height: number; }

export function useResize<T extends HTMLElement>() {
  const elRef  = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    setSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
  }, []);

  const ref = useCallback((node: T | null) => {
    elRef.current = node;
    if (node) measure();
  }, [measure]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, element: elRef, size };
}
