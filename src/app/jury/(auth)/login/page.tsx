import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { JuryLoginForm } from "@/components/forms/jury-login-form";
import { JURY_COOKIE, SESSION_MAX_AGE } from "@/lib/config";
import { authenticateJury, createSessionToken } from "@/lib/auth";
import { ArrowLeft, Scale, Shield, Users } from "lucide-react";

async function juryLoginAction(
  _state: { error?: string },
  formData: FormData,
) {
  "use server";
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  const jury = await authenticateJury(identifier, password);
  if (!jury) {
    return { error: "Invalid jury credentials. Check your Jury ID and password." };
  }

  const token = await createSessionToken({ role: "jury", id: jury.id });

  const store = await cookies();
  store.set(JURY_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/jury/programs");
}

export default function JuryLoginPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 sm:py-16 overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#015AA0]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to Home Link */}
      <div className="w-full max-w-md mx-auto mb-6 flex justify-between items-center z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Fest</span>
        </Link>
        <span className="text-[11px] font-mono text-cyan-400/80 tracking-wider">
          PORTAL_JURY
        </span>
      </div>

      {/* Header Container */}
      <div className="w-full max-w-md mx-auto text-center space-y-3 mb-7 z-10">
        {/* Fest Emblem Avatar */}
        <div className="inline-flex p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-1">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <Image
              src="/img/assets/ship.webp"
              alt="Maerika Fest Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Portal Pill */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Scale className="w-3.5 h-3.5" />
            <span>Jury Assessment Portal</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Bricolage']">
          Welcome, Evaluator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          Sign in to access your assigned programs, record podium scores, and submit verdicts.
        </p>
      </div>

      {/* Form Box */}
      <div className="w-full max-w-md z-10">
        <JuryLoginForm action={juryLoginAction} />
      </div>

      {/* Portal Switcher Navigation */}
      <div className="w-full max-w-md mx-auto mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-6 text-xs text-slate-400 z-10">
        <Link
          href="/team/login"
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Portal</span>
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/admin/login"
          className="hover:text-rose-300 transition-colors flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Login</span>
        </Link>
      </div>
    </main>
  );
}
