"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("[Next.js Application Error]:", error);
  }, [error]);

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#fffcf5]">
      <div className="max-w-md w-full text-center space-y-6 bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-amber-200/80 shadow-xl shadow-amber-900/5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-amber-800/70 bg-amber-100/60 px-3 py-1 rounded-full">
            Maerika 2K26 Fest
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#8B4513]">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            We encountered a temporary streaming interruption while loading this page. Please try refreshing.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-gray-400">
              Error code: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B4513] text-white font-semibold text-sm hover:bg-[#6f370f] active:scale-95 transition-all shadow-md shadow-amber-900/10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
