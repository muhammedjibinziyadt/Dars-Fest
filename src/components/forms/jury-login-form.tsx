"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Scale, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface JuryLoginFormProps {
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
      className="w-full py-3.5 px-5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-[#0284c7] via-[#015AA0] to-[#004277] hover:from-[#0369a1] hover:to-[#015AA0] shadow-lg shadow-[#0284c7]/25 hover:shadow-xl hover:shadow-[#0284c7]/35 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Authenticating Jury...</span>
        </>
      ) : (
        <>
          <span>Enter Jury Portal</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export function JuryLoginForm({ action }: JuryLoginFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Top Accent Line */}
      <div className="absolute -top-[1px] left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent z-10" />

      <form
        action={formAction}
        className="rounded-3xl border border-white/10 bg-slate-900/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] space-y-5"
      >
        {/* Identifier Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Jury ID or Username</span>
          </label>
          <div className="relative">
            <input
              name="identifier"
              type="text"
              placeholder="e.g. jury-anika or evaluator-1"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Access Password</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <SubmitButton />
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 pt-1">
          Assigned evaluations are confidential under Maerika 2K26 rules.
        </p>
      </form>
    </div>
  );
}
