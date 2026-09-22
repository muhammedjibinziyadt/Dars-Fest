import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutTeam, getCurrentTeam } from "@/lib/auth";
import { TeamNav } from "@/components/team-nav";

async function logoutAction() {
  "use server";
  await logoutTeam();
  redirect("/team/login");
}

export default async function TeamLayout({ children }: { children: ReactNode }) {
  const team = await getCurrentTeam();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-5 md:px-8 py-6 sm:py-8 lg:py-10">
        <header
          className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 px-4 sm:px-6 py-3 sm:py-4"
          style={{ borderColor: team?.themeColor ?? "#0ea5e9" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Badge tone="cyan" className="text-xs sm:text-sm mb-1 sm:mb-0">Team Portal</Badge>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate">
                {team ? (
                  <>
                    <span className="block sm:inline">{team.teamName}</span>
                    <span className="hidden sm:inline"> · </span>
                    <span className="block sm:inline text-white/70">{team.leaderName}</span>
                  </>
                ) : (
                  "Team Portal"
                )}
              </h1>
            </div>
            {team && (
              <form action={logoutAction} className="shrink-0">
                <Button type="submit" variant="ghost" size="sm" className="w-full sm:w-auto">
                  Logout
                </Button>
              </form>
            )}
          </div>
        </header>
        {team && (
          <div className="flex items-center justify-between gap-3">
            <TeamNav />
          </div>
        )}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

