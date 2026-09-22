"use client";

import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "relative z-10 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition-all duration-200 focus:border-fuchsia-400/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:bg-white/10 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

