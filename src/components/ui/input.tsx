"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50 ring-offset-slate-900 transition-all duration-200 focus-visible:outline-none focus-visible:border-fuchsia-400/50 focus-visible:ring-2 focus-visible:ring-fuchsia-400/30 focus-visible:ring-offset-2 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 hover:border-white/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

