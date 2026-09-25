import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { JuryLoginForm } from "@/components/forms/jury-login-form";
import { authenticateJury } from "@/lib/auth";
import { Scale, ArrowLeft } from "lucide-react";

async function juryLoginAction(
  _state: { error?: string },
  formData: FormData,
) {
  "use server";
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!identifier || !password) {
    return { error: "Jury identifier/email and password are required." };
  }

  try {
    const jury = await authenticateJury(identifier, password);
    if (!jury) {
      return { error: "Jury not found." };
    }
  } catch (error: any) {
    return { error: error?.message || "Invalid jury credentials." };
  }

  redirect("/jury/programs");
}

export default function JuryLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 space-y-3 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
          <Scale className="w-8 h-8" />
        </div>
        <div>
          <Badge tone="cyan" className="mx-auto mb-2">
            Jury Portal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Hi Jury, welcome back!
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Access your assigned programs, record podium placements, and send for approval.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <JuryLoginForm action={juryLoginAction} />

      {/* Footer Navigation */}
      <div className="mt-8 space-y-4 text-center">
        <Link
          href="/scoreboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scoreboard</span>
        </Link>

        <div className="flex items-center justify-center gap-2 text-xs text-white/40">
          <span>Other portals:</span>
          <Link href="/admin/login" className="text-rose-400 hover:text-rose-300 transition-colors underline-offset-4 hover:underline">
            Admin Control
          </Link>
          <span>•</span>
          <Link href="/team/login" className="text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
            Team Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
