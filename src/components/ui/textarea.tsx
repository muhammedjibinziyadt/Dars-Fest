"use client";

import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40",
        className,
      )}
      {...props}
    />
  );
}

