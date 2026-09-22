import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "pink" | "cyan" | "amber" | "emerald";
}

const toneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  pink: "bg-rose-500/30 text-white",
  cyan: "bg-cyan-500/30 text-white",
  amber: "bg-amber-400/20 text-amber-100",
  emerald: "bg-emerald-500/20 text-emerald-100",
};

export function Badge({
  className,
  tone = "pink",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

