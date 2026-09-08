import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TeamLoginForm } from "@/components/team-login-form";
import { authenticateTeam, getCurrentTeam, createSessionToken } from "@/lib/auth";
import { TEAM_COOKIE, SESSION_MAX_AGE } from "@/lib/config";
import { ArrowLeft, Scale, Shield, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function teamLoginAction(_state: { error?: string }, formData: FormData) {
  "use server";
  const teamName = String(formData.get("teamName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!teamName || !password) {
    return { error: "Team name and password are required." };
  }
  const team = await authenticateTeam(teamName, password);
  if (!team) {
    return { error: "Invalid team credentials. Check your team name and password." };
  }

  const token = await createSessionToken({ role: "team", id: team.id });

  const store = await cookies();
  store.set(TEAM_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/team/dashboard");
}

export default async function TeamLoginPage() {
  const currentTeam = await getCurrentTeam();
  if (currentTeam) {
    redirect("/team/dashboard");
  }

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center px-4 py-6 sm:py-10 overflow-x-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-amber-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-[#015AA0]/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

      {/* Back to Home Link */}
      <div className="w-full max-w-[360px] sm:max-w-[390px] mx-auto mb-3.5 sm:mb-4 flex justify-between items-center z-10">
        <Link
          href="/"
          className="!min-h-0 !min-w-0 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400 hover:text-white transition-colors py-1 px-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Return to Fest</span>
        </Link>
        <span className="text-[10px] sm:text-[11px] font-mono text-amber-400/80 tracking-wider">
          PORTAL_TEAM
        </span>
      </div>

      {/* Header Container */}
      <div className="w-full max-w-[360px] sm:max-w-[390px] mx-auto text-center space-y-2 sm:space-y-2.5 mb-4 sm:mb-5 z-10">
        {/* Fest Emblem Avatar */}
        <div className="inline-flex p-1.5 sm:p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-0.5">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Users className="w-3 h-3" />
            <span>Team Leader Portal</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Bricolage']">
          Welcome, Team Captain
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-[320px] mx-auto">
          Sign in to manage your squad, view participant chest numbers, and submit stage registrations.
        </p>
      </div>

      {/* Form Box */}
      <div className="w-full max-w-[360px] sm:max-w-[390px] z-10">
        <TeamLoginForm action={teamLoginAction} />
      </div>

      {/* Portal Switcher Navigation */}
      <div className="w-full max-w-[360px] sm:max-w-[390px] mx-auto mt-5 sm:mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-5 text-xs text-slate-400 z-10">
        <Link
          href="/jury/login"
          className="!min-h-0 !min-w-0 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-[11px] sm:text-xs"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Jury Login</span>
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/admin/login"
          className="!min-h-0 !min-w-0 hover:text-rose-300 transition-colors flex items-center gap-1.5 text-[11px] sm:text-xs"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Login</span>
        </Link>
      </div>
    </main>
  );
}
