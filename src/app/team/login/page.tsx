import { redirect } from "next/navigation";
import { TeamLoginForm } from "@/components/team-login-form";
import { authenticateTeam, getCurrentTeam } from "@/lib/auth";

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
    return { error: "Invalid team credentials." };
  }
  redirect("/team/dashboard");
}

export default async function TeamLoginPage() {
  const currentTeam = await getCurrentTeam();
  if (currentTeam) {
    redirect("/team/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <TeamLoginForm action={teamLoginAction} />
    </div>
  );
}

