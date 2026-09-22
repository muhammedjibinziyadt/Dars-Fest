"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A lightweight hook that observes an element's layout dimensions using ResizeObserver.
 * Returns `hasDimensions: true` only when mounted on the client and the element has
 * a strictly positive computed width and height (width > 0 && height > 0).
 *
 * This prevents Recharts from rendering inside containers that are currently hidden
 * (e.g. `display: none`, hidden tabs, unrendered dialogs, or during initial hydration),
 * eliminating "width(-1)" and "width(0)" warnings.
 */
export function useContainerDimensions<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      setDimensions((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const roundedW = Math.floor(width);
          const roundedH = Math.floor(height);
          setDimensions((prev) => {
            if (prev.width === roundedW && prev.height === roundedH) return prev;
            return { width: roundedW, height: roundedH };
          });
        }
      });

      resizeObserver.observe(element);
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      };
    }
  }, []);

  const hasDimensions = isMounted && dimensions.width > 0 && dimensions.height > 0;

  return {
    ref,
    dimensions,
    width: dimensions.width,
    height: dimensions.height,
    hasDimensions,
  };
}
