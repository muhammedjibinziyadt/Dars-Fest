import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Users, 
  Calendar, 
  Trophy, 
  UserPlus, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  Activity
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentTeam } from "@/lib/auth";
import { 
  getPortalStudents, 
  getProgramRegistrations,
  getProgramsWithLimits,
  isRegistrationOpen
} from "@/lib/team-data";
import { formatNumber } from "@/lib/utils";

export default async function TeamDashboardPage() {
  const team = await getCurrentTeam();
  if (!team) {
    redirect("/team/login");
  }
  const [students, registrations, programs, isOpen] = await Promise.all([
    getPortalStudents(),
    getProgramRegistrations(),
    getProgramsWithLimits(),
    isRegistrationOpen(),
  ]);
  
  const teamStudents = students.filter((student) => student.teamId === team.id);
  const teamRegistrations = registrations.filter((registration) => registration.teamId === team.id);
  
  // Calculate statistics
  const uniquePrograms = new Set(teamRegistrations.map((r) => r.programId)).size;
  const totalPoints = teamStudents.reduce((sum, s) => sum + (s.score || 0), 0);
  
  // Group registrations by section
  const programMap = new Map(programs.map((p) => [p.id, p]));
  const singleRegistrations = teamRegistrations.filter((r) => {
    const program = programMap.get(r.programId);
    return program?.section === "single";
  });
  const groupRegistrations = teamRegistrations.filter((r) => {
    const program = programMap.get(r.programId);
    return program?.section === "group";
  });
  const generalRegistrations = teamRegistrations.filter((r) => {
    const program = programMap.get(r.programId);
    return program?.section === "general";
  });
  
  // Get recent registrations (last 5)
  const recentRegistrations = teamRegistrations
    .slice()
    .sort((a, b) => {
      return a.studentName.localeCompare(b.studentName);
    })
    .slice(0, 5);

  const stats = [
    {
      label: "Team Members",
      value: teamStudents.length,
      icon: Users,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      link: "/team/register-students",
    },
    {
      label: "Registrations",
      value: teamRegistrations.length,
      icon: Calendar,
      color: "from-fuchsia-500 to-pink-600",
      bgColor: "bg-fuchsia-500/10",
      borderColor: "border-fuchsia-500/30",
      link: "/team/program-register",
    },
    {
      label: "Programs",
      value: uniquePrograms,
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      link: "/team/program-register",
    },
    {
      label: "Total Points",
      value: formatNumber(totalPoints),
      icon: Trophy,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      link: "/team/dashboard",
    },
  ];

  return (
    <>
      {/* Mobile View - Compact Card Layout */}
      <div className="lg:hidden space-y-4">
        {/* Mobile Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 p-5 backdrop-blur-sm">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">Team Dashboard</p>
                <h1 className="text-2xl font-bold text-white truncate">{team.teamName}</h1>
                <p className="text-sm text-white/70 mt-1 truncate">{team.leaderName}</p>
              </div>
              <Badge 
                tone={isOpen ? "emerald" : "pink"} 
                className="shrink-0 text-xs px-3 py-1"
              >
                {isOpen ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Open
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Closed
                  </span>
                )}
              </Badge>
            </div>
            
            {/* Mobile Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <p className="text-xs text-white/60 mb-1">Members</p>
                <p className="text-xl font-bold text-white">{teamStudents.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <p className="text-xs text-white/60 mb-1">Registrations</p>
                <p className="text-xl font-bold text-white">{teamRegistrations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.link}>
                <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]">
                  <div className="flex flex-col items-start gap-3">
                    <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-white/70 mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Mobile Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 px-1">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/team/register-students">
              <Card className="group border border-cyan-500/20 bg-cyan-500/5 p-4 transition-all hover:bg-cyan-500/10 active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/20 p-2">
                    <UserPlus className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Register Students</p>
                    <p className="text-xs text-white/60 mt-0.5">Manage team members</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Card>
            </Link>
            <Link href="/team/program-register">
              <Card className="group border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 transition-all hover:bg-fuchsia-500/10 active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-fuchsia-500/20 p-2">
                    <Calendar className="h-4 w-4 text-fuchsia-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Program Registration</p>
                    <p className="text-xs text-white/60 mt-0.5">Sign up for events</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Mobile Program Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 px-1">Program Breakdown</h2>
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-white/10 bg-white/5 p-3 text-center">
              <div className="flex justify-center mb-2">
                <div className="rounded-lg bg-fuchsia-500/20 p-1.5">
                  <UserPlus className="h-3 w-3 text-fuchsia-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-white">{singleRegistrations.length}</p>
              <p className="text-xs text-white/60 mt-1">Single</p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-3 text-center">
              <div className="flex justify-center mb-2">
                <div className="rounded-lg bg-emerald-500/20 p-1.5">
                  <Users className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-white">{groupRegistrations.length}</p>
              <p className="text-xs text-white/60 mt-1">Group</p>
            </Card>
            <Card className="border-white/10 bg-white/5 p-3 text-center">
              <div className="flex justify-center mb-2">
                <div className="rounded-lg bg-amber-500/20 p-1.5">
                  <Award className="h-3 w-3 text-amber-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-white">{generalRegistrations.length}</p>
              <p className="text-xs text-white/60 mt-1">General</p>
            </Card>
          </div>
        </div>

        {/* Mobile Recent Registrations */}
        {recentRegistrations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-white">Recent</h2>
              <Link href="/team/program-register">
                <Button variant="ghost" size="sm" className="text-xs h-7 text-cyan-300 hover:text-cyan-200">
                  View all
                </Button>
              </Link>
            </div>
            <Card className="border-white/10 bg-white/5 p-3">
              <div className="space-y-2">
                {recentRegistrations.map((registration) => {
                  const program = programMap.get(registration.programId);
                  return (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{registration.studentName}</p>
                        <p className="text-xs text-white/60 truncate mt-0.5">
                          {program?.name || "Unknown"}
                        </p>
                      </div>
                      <Badge 
                        tone={
                          program?.section === "single" ? "pink" :
                          program?.section === "group" ? "emerald" : "amber"
                        }
                        className="text-xs shrink-0"
                      >
                        {program?.section || "general"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Desktop View - Professional Layout */}
      <div className="hidden lg:block space-y-6">
        {/* Desktop Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 p-8 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/10 to-emerald-500/10 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Welcome back</p>
                <h1 className="text-4xl font-bold text-white mb-2">{team.teamName}</h1>
                <p className="text-base text-white/70">Led by {team.leaderName}</p>
              </div>
              <Badge 
                tone={isOpen ? "emerald" : "pink"} 
                className="text-sm px-5 py-2.5"
              >
                {isOpen ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Registration Open
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Registration Closed
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Desktop Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.link}>
                <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/70 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Desktop Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Quick Actions & Breakdown */}
          <div className="col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div>
                <Link href="/team/register-students" className="block mb-4">
                  <Card className="group border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-cyan-500/20 p-3">
                        <UserPlus className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Register Students</h3>
                        <p className="text-xs text-white/70 mt-0.5">Add or manage team members</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
                <Link href="/team/program-register" className="block">
                  <Card className="group border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-fuchsia-500/20 p-3">
                        <Calendar className="h-5 w-5 text-fuchsia-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Register Programs</h3>
                        <p className="text-xs text-white/70 mt-0.5">Sign up for events</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              </div>
            </Card>

            {/* Program Breakdown */}
            <Card className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Program Breakdown</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex justify-center mb-2">
                    <div className="rounded-lg bg-fuchsia-500/20 p-2">
                      <UserPlus className="h-4 w-4 text-fuchsia-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{singleRegistrations.length}</p>
                  <p className="text-xs text-white/60 mt-1">Single Events</p>
                </div>
                <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex justify-center mb-2">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{groupRegistrations.length}</p>
                  <p className="text-xs text-white/60 mt-1">Group Events</p>
                </div>
                <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex justify-center mb-2">
                    <div className="rounded-lg bg-amber-500/20 p-2">
                      <Award className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{generalRegistrations.length}</p>
                  <p className="text-xs text-white/60 mt-1">General Events</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Recent Registrations */}
          <div className="col-span-8">
            <Card className="border-white/10 bg-white/5 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-fuchsia-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Registrations</h2>
                </div>
                <Link href="/team/program-register">
                  <Button variant="ghost" size="sm" className="text-cyan-300 hover:text-cyan-200">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {recentRegistrations.length > 0 ? (
                <div className="space-y-3">
                  {recentRegistrations.map((registration) => {
                    const program = programMap.get(registration.programId);
                    return (
                      <div
                        key={registration.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`rounded-lg bg-gradient-to-br ${stats.find(s => s.label === "Registrations")?.color || "from-fuchsia-500 to-pink-600"} p-2.5 shrink-0`}>
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{registration.studentName}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-white/60">
                              <span>Chest #{registration.studentChest}</span>
                              <span>•</span>
                              <span className="truncate">{program?.name || "Unknown Program"}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          tone={
                            program?.section === "single" ? "pink" :
                            program?.section === "group" ? "emerald" : "amber"
                          }
                          className="shrink-0"
                        >
                          {program?.section || "general"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-16 w-16 text-white/20 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Registrations Yet</h3>
                  <p className="text-sm text-white/60 mb-6">
                    Start registering your team members for programs to see them here.
                  </p>
                  <Link href="/team/program-register">
                    <Button>
                      Register for Programs
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
