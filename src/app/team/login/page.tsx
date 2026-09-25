import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TeamLoginForm } from "@/components/team-login-form";
import { authenticateTeam, getCurrentTeam } from "@/lib/auth";
import { Users, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function teamLoginAction(_state: { error?: string }, formData: FormData) {
  "use server";
  const teamName = String(formData.get("teamName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!teamName || !password) {
    return { error: "Team name/email and password are required." };
  }
  try {
    const team = await authenticateTeam(teamName, password);
    if (!team) {
      return { error: "Team not found." };
    }
  } catch (error: any) {
    return { error: error?.message || "Invalid team credentials." };
  }
  redirect("/team/dashboard");
}

export default async function TeamLoginPage() {
  const currentTeam = await getCurrentTeam();
  if (currentTeam) {
    redirect("/team/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 space-y-3 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <Badge tone="emerald" className="mx-auto mb-2">
            Team Portal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Team Portal Login
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in to register candidates, view assigned programs, and track results.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <TeamLoginForm action={teamLoginAction} />

      {/* Footer Navigation */}
      <div className="mt-8 text-center">
        <Link
          href="/scoreboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scoreboard</span>
        </Link>
      </div>
    </main>
  );
}
