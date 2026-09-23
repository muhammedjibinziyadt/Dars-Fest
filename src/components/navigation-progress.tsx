"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on pathname or searchParams change
  useEffect(() => {
    setProgress(100);
    const timeout = setTimeout(() => {
      setNavigating(false);
      setProgress(0);
    }, 250);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Intercept click on links to start progress bar instantly
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, anchors, or new tabs
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // If navigating to the same URL, ignore
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      setNavigating(true);
      setProgress(30);

      const t1 = setTimeout(() => setProgress(65), 100);
      const t2 = setTimeout(() => setProgress(85), 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!navigating && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #FACC15, #8B4513, #F59E0B)",
        boxShadow: "0 0 10px rgba(250, 204, 21, 0.7), 0 0 5px rgba(139, 69, 19, 0.5)",
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
