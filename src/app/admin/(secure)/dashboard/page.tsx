import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

import { LiveScorePie } from "@/components/live-score-pie";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getApprovedResults,
  getLiveScores,
  getPendingResults,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";

async function getDashboardData() {
  const [programs, students, pending, approved, teams, liveScores] = await Promise.all([
    getPrograms(),
    getStudents(),
    getPendingResults(),
    getApprovedResults(),
    getTeams(),
    getLiveScores(),
  ]);

  return {
    stats: [
      { label: "Total Programs", value: programs.length },
      { label: "Participants", value: students.length },
      { label: "Pending Results", value: pending.length },
      { label: "Approved Results", value: approved.length },
    ],
    teams: teams,
    pending,
    approved,
    liveScores,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const liveScoreMap = new Map(data.liveScores.map((item) => [item.team_id, item.total_points]));
  const enrichedTeams = data.teams.map((team) => ({
    ...team,
    livePoints: liveScoreMap.get(team.id) ?? team.total_points,
  }));
  const sortedTeams = [...enrichedTeams].sort((a, b) => b.livePoints - a.livePoints);
  const topTeam = sortedTeams[0];
  const runnerUp = sortedTeams[1];
  const totalPoints = sortedTeams.reduce((sum, team) => sum + team.livePoints, 0);
  const totalResults = data.pending.length + data.approved.length;
  const approvalRate = totalResults ? Math.round((data.approved.length / totalResults) * 100) : 0;
  const pendingRate = totalResults ? Math.round((data.pending.length / totalResults) * 100) : 0;
  const quickActions = [
    { label: "Add Program", href: "/admin/programs", accent: "from-cyan-500 to-blue-600" },
    { label: "Add Students", href: "/admin/students", accent: "from-emerald-500 to-lime-500" },
    { label: "Assign Jury", href: "/admin/assign", accent: "from-violet-500 to-fuchsia-500" },
    { label: "Review Pending", href: "/admin/pending-results", accent: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-linear-to-br from-indigo-900/70 via-fuchsia-900/50 to-emerald-900/40 p-8 text-white shadow-[0_25px_80px_rgba(14,165,233,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge tone="cyan">Funoon Fiesta Control</Badge>
            <span className="text-sm text-white/70">Approval rate • {approvalRate}%</span>
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight">
            Live overview of submissions, results, and team momentum.
          </h1>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-white/70">Current Leader</p>
              {topTeam ? (
                <>
                  <p className="mt-2 text-2xl font-semibold">{topTeam.name}</p>
                  <p className="text-sm text-white/70">{formatNumber(topTeam.livePoints)} pts</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-white/70">No teams found.</p>
              )}
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-white/70">Pending Reviews</p>
              <p className="mt-2 text-2xl font-semibold">{data.pending.length}</p>
              <p className="text-sm text-white/70">{pendingRate}% of all submissions</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/pending-results"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/30"
            >
              Review Pending <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/approved-results"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              View Approved
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-sm text-white/60">Approval Rate</p>
              <p className="text-2xl font-semibold text-white">{approvalRate}%</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-sm text-white/60">Pending Items</p>
              <p className="text-2xl font-semibold text-white">{data.pending.length}</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-xs uppercase tracking-widest text-white/60">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/add-result"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white"
              >
                Submit Result <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/jury"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white"
              >
                Manage Jury
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat) => (
          <Card key={stat.label} className="rounded-3xl border-white/10 bg-slate-900/70 p-5 text-white">
            <p className="text-xs uppercase tracking-widest text-white/60">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-slate-900/70 border-white/10 rounded-3xl">
          <LiveScorePie teams={data.teams} liveScores={liveScoreMap} />
        </Card>
        <Card className="bg-slate-900/70 border-white/10 rounded-3xl p-6 text-white">
          <CardTitle>Insights</CardTitle>
          <CardDescription className="mt-1 text-white/70">
            Snapshot of live performance across all houses.
          </CardDescription>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Runner Up</p>
              <p className="mt-1 text-2xl font-semibold">{runnerUp?.name ?? "—"}</p>
              {runnerUp && (
                <p className="text-sm text-white/70">{formatNumber(runnerUp.livePoints)} pts</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Total Points Logged</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totalPoints)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Pending Items</p>
              <p className="mt-1 text-2xl font-semibold">{data.pending.length}</p>
              <p className="text-sm text-white/70">{pendingRate}% of submissions</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/5 border-white/10 rounded-3xl">
          <CardTitle>Team Highlights</CardTitle>
          <CardDescription className="mt-2 text-white/70">Quick roster overview</CardDescription>
          <div className="mt-6 space-y-4">
            {sortedTeams.slice(0, 6).map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-lg font-semibold text-white">{team.name}</p>
                  <p className="text-xs text-white/60">Leader · {team.leader}</p>
                </div>
                <p className="text-2xl font-bold text-amber-200">{formatNumber(team.livePoints)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 rounded-3xl">
          <CardTitle>Latest Pending Results</CardTitle>
          <CardDescription className="mt-2 text-white/70">
            Approve or reject from the Pending Results tab.
          </CardDescription>
          <div className="mt-6 space-y-4">
            {data.pending.slice(0, 5).map((result) => (
              <div
                key={result.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-sm text-white/60">Program #{result.program_id}</p>
                <p className="font-semibold text-white">
                  Submitted by {result.submitted_by}
                </p>
                <p className="text-xs text-white/50">
                  {new Date(result.submitted_at).toLocaleString()}
                </p>
              </div>
            ))}
            {data.pending.length === 0 && (
              <p className="text-sm text-white/60">No pending entries.</p>
            )}
          </div>
        </Card>
      </section>
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription className="mt-2 text-white/70">
          Jump directly into the workflows you use most.
        </CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div
                className={`rounded-2xl border border-white/10 bg-linear-to-r ${action.accent} p-4 text-white shadow-lg transition hover:scale-[1.01]`}
              >
                <p className="text-sm uppercase tracking-widest text-white/80">{action.label}</p>
                <ArrowUpRight className="mt-4 h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

