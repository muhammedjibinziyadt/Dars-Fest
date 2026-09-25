"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

interface AdminLoginFormProps {
  action: (
    state: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
}

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <span>Enter Admin Dashboard</span>
      )}
    </button>
  );
}

export function AdminLoginForm({ action }: AdminLoginFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -inset-0.5 -z-10 rounded-3xl bg-gradient-to-r from-rose-500/20 via-fuchsia-500/20 to-amber-500/20 opacity-60 blur-xl" />

      <form
        action={formAction}
        className="relative space-y-5 rounded-3xl border border-white/15 bg-slate-900/75 p-6 sm:p-8 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl ring-1 ring-white/10"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
            Email or Username
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-4 h-5 w-5 text-white/40 pointer-events-none" />
            <input
              name="username"
              type="text"
              placeholder="admin or admin@maerika.com"
              autoComplete="username"
              required
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/35 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.09] focus:border-rose-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-rose-500/15"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 h-5 w-5 text-white/40 pointer-events-none" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] pl-11 pr-11 text-sm text-white placeholder:text-white/35 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.09] focus:border-rose-400 focus:bg-slate-900/90 focus:outline-none focus:ring-4 focus:ring-rose-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1.5 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/10 focus:outline-none cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state.error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
