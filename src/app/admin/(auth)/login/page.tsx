import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { Badge } from "@/components/ui/badge";
import { authenticateAdmin } from "@/lib/auth";
import { Shield, ArrowLeft } from "lucide-react";

async function loginAdminAction(
  _state: { error?: string },
  formData: FormData,
) {
  "use server";

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!username || !password) {
    return { error: "Email or username and password are required." };
  }

  try {
    await authenticateAdmin(username, password);
  } catch (error: any) {
    return { error: error?.message || "Invalid admin credentials." };
  }

  redirect("/admin/dashboard");
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 space-y-3 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <Badge tone="pink" className="mx-auto mb-2">
            Admin Control
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome back, Commander
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Manage programs, students, jury assignments, and fest approvals from a single cockpit.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <AdminLoginForm action={loginAdminAction} />

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
