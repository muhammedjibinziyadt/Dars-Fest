import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { getCurrentTeam } from "@/lib/auth";
import { getTeamPointsSummary } from "@/lib/team-points";
import { Button } from "@/components/ui/button";
import { TeamWinnersFullView } from "@/components/team-winners-full-view";

export default async function TeamPointsPage() {
  const team = await getCurrentTeam();
  if (!team) {
    redirect("/team/login");
  }

  const summary = await getTeamPointsSummary(team.id);

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/team/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
          Live Scores & Winners
        </span>
      </div>

      <TeamWinnersFullView summary={summary} />
    </div>
  );
}
