import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { Badge } from "@/components/ui/badge";
import { ADMIN_COOKIE, ADMIN_CREDENTIALS, SESSION_MAX_AGE } from "@/lib/config";

async function loginAdminAction(
  _state: { error?: string },
  formData: FormData,
) {
  "use server";

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (
    username !== ADMIN_CREDENTIALS.username ||
    password !== ADMIN_CREDENTIALS.password
  ) {
    return { error: "Invalid admin credentials." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, ADMIN_CREDENTIALS.username, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/admin/dashboard");
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-10 px-5 py-16 md:px-8">
      <div className="space-y-4 text-center">
        <Badge tone="pink" className="mx-auto">
          Admin Control
        </Badge>
        <h1 className="text-4xl font-bold text-white">Welcome back, Commander</h1>
        <p className="text-white/70">
          Manage programs, students, jury assignments, and fest-wide approvals from a
          single cockpit.
        </p>
      </div>
      <AdminLoginForm action={loginAdminAction} />
    </main>
  );
}

