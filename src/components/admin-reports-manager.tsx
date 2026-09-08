"use client";

import { useState, useMemo } from "react";
import { 
  Printer, 
  Download, 
  Search, 
  Users, 
  Trophy, 
  Award, 
  Layers, 
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Student, Team, Program, ResultRecord, ProgramRegistration } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface Props {
  students: Student[];
  teams: Team[];
  programs: Program[];
  approvedResults: ResultRecord[];
  registrations: ProgramRegistration[];
}

type ReportType = "students" | "teams" | "programs" | "scores" | "single";

export function AdminReportsManager({
  students,
  teams,
  programs,
  approvedResults,
  registrations,
}: Props) {
  const [activeTab, setActiveTab] = useState<ReportType>("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Single Entity focus state
  const [singleMode, setSingleMode] = useState<"team" | "program">("team");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || "");

  // Lookups
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const programMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // Ranked Teams
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }, [teams]);

  // Registration counts per program
  const regCountByProgram = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reg of registrations) {
      counts.set(reg.programId, (counts.get(reg.programId) || 0) + 1);
    }
    return counts;
  }, [registrations]);

  // Flatten all approved results into table entries
  const allScoreEntries = useMemo(() => {
    const list: Array<{
      id: string;
      programId: string;
      programName: string;
      section: string;
      stage: boolean;
      position: number;
      studentId?: string;
      studentName: string;
      chestNo: string;
      teamId?: string;
      teamName: string;
      grade?: string;
      score: number;
      positionPoints: number;
      gradePoints: number;
    }> = [];

    for (const result of approvedResults) {
      const program = programMap.get(result.program_id);
      for (const entry of result.entries) {
        const student = entry.student_id ? studentMap.get(entry.student_id) : undefined;
        const team = entry.team_id ? teamMap.get(entry.team_id) : student ? teamMap.get(student.team_id) : undefined;

        list.push({
          id: `${result.id}_${entry.position}_${entry.student_id || entry.team_id}`,
          programId: result.program_id,
          programName: program?.name || "Unknown Program",
          section: program?.section || "general",
          stage: Boolean(program?.stage),
          position: entry.position,
          studentId: entry.student_id,
          studentName: student?.name || "Group Entry",
          chestNo: student?.chest_no || "—",
          teamId: team?.id,
          teamName: team?.name || "Unknown Team",
          grade: entry.grade && entry.grade !== "none" ? entry.grade : "—",
          score: entry.score || (entry.position_points || 0) + (entry.grade_points || 0),
          positionPoints: entry.position_points ?? 0,
          gradePoints: entry.grade_points ?? 0,
        });
      }
    }

    return list.sort((a, b) => {
      const cmpProg = a.programName.localeCompare(b.programName);
      if (cmpProg !== 0) return cmpProg;
      return a.position - b.position;
    });
  }, [approvedResults, programMap, studentMap, teamMap]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesTeam = teamFilter === "all" || student.team_id === teamFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || student.name.toLowerCase().includes(q) || student.chest_no.toLowerCase().includes(q);
      return matchesTeam && matchesSearch;
    }).sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }, [students, teamFilter, searchQuery]);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSection = sectionFilter === "all" || program.section === sectionFilter;
      const matchesStage = stageFilter === "all" || (stageFilter === "true" ? Boolean(program.stage) : !program.stage);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || program.name.toLowerCase().includes(q);
      return matchesSection && matchesStage && matchesSearch;
    });
  }, [programs, sectionFilter, stageFilter, searchQuery]);

  // Filtered Scores
  const filteredScores = useMemo(() => {
    return allScoreEntries.filter((entry) => {
      const matchesTeam = teamFilter === "all" || entry.teamId === teamFilter;
      const matchesSection = sectionFilter === "all" || entry.section === sectionFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        entry.programName.toLowerCase().includes(q) ||
        entry.studentName.toLowerCase().includes(q) ||
        entry.chestNo.toLowerCase().includes(q) ||
        entry.teamName.toLowerCase().includes(q);
      return matchesTeam && matchesSection && matchesSearch;
    });
  }, [allScoreEntries, teamFilter, sectionFilter, searchQuery]);

  // Single Entity Data
  const currentSingleTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  const currentSingleTeamStudents = useMemo(() => {
    if (!currentSingleTeam) return [];
    return students.filter((s) => s.team_id === currentSingleTeam.id);
  }, [students, currentSingleTeam]);

  const currentSingleTeamScores = useMemo(() => {
    if (!currentSingleTeam) return [];
    return allScoreEntries.filter((s) => s.teamId === currentSingleTeam.id);
  }, [allScoreEntries, currentSingleTeam]);

  const currentSingleProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || programs[0];
  }, [programs, selectedProgramId]);

  const currentSingleProgramScores = useMemo(() => {
    if (!currentSingleProgram) return [];
    return allScoreEntries.filter((s) => s.programId === currentSingleProgram.id);
  }, [allScoreEntries, currentSingleProgram]);

  const currentSingleProgramRegistrations = useMemo(() => {
    if (!currentSingleProgram) return [];
    return registrations.filter((r) => r.programId === currentSingleProgram.id);
  }, [registrations, currentSingleProgram]);

  // CSV Exporter Helper
  const downloadCsv = (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => {
    const escapeCsv = (val: string | number | undefined | null) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Trigger Handler
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);

    if (activeTab === "students") {
      const headers = ["Chest No", "Student Name", "Team Name", "Total Points", "1st", "2nd", "3rd", "Grade A", "Grade B", "Grade C"];
      const rows = filteredStudents.map((s) => [
        s.chest_no,
        s.name,
        teamMap.get(s.team_id)?.name || "Unknown",
        s.total_points || 0,
        s.positions_count?.first || 0,
        s.positions_count?.second || 0,
        s.positions_count?.third || 0,
        s.grades_count?.A || 0,
        s.grades_count?.B || 0,
        s.grades_count?.C || 0,
      ]);
      downloadCsv(`students_report_${dateStr}.csv`, headers, rows);
    } else if (activeTab === "teams") {
      const headers = ["Rank", "Team Name", "Leader", "1st Places", "2nd Places", "3rd Places", "Grade A", "Grade B", "Grade C", "Total Points"];
      const rows = sortedTeams.map((t, idx) => [
        idx + 1,
        t.name,
        t.leader || "—",
        t.positions_count?.first || 0,
        t.positions_count?.second || 0,
        t.positions_count?.third || 0,
        t.grades_count?.A || 0,
        t.grades_count?.B || 0,
        t.grades_count?.C || 0,
        t.total_points || 0,
      ]);
      downloadCsv(`team_scoreboard_${dateStr}.csv`, headers, rows);
    } else if (activeTab === "programs") {
      const headers = ["Program Name", "Section", "Stage", "Max Limit", "Registered Count"];
      const rows = filteredPrograms.map((p) => [
        p.name,
        p.section,
        p.stage ? "On-Stage" : "Off-Stage",
        p.candidateLimit || 1,
        regCountByProgram.get(p.id) || 0,
      ]);
      downloadCsv(`programs_directory_${dateStr}.csv`, headers, rows);
    } else if (activeTab === "scores") {
      const headers = ["Program Name", "Section", "Stage", "Position", "Student Name", "Chest No", "Team", "Grade", "Points"];
      const rows = filteredScores.map((s) => [
        s.programName,
        s.section,
        s.stage ? "On-Stage" : "Off-Stage",
        s.position === 1 ? "1st" : s.position === 2 ? "2nd" : "3rd",
        s.studentName,
        s.chestNo,
        s.teamName,
        s.grade,
        s.score,
      ]);
      downloadCsv(`scores_ledger_${dateStr}.csv`, headers, rows);
    } else if (activeTab === "single") {
      if (singleMode === "team" && currentSingleTeam) {
        const headers = ["Chest No", "Student Name", "Total Points", "Grade A", "Grade B", "Grade C"];
        const rows = currentSingleTeamStudents.map((s) => [
          s.chest_no,
          s.name,
          s.total_points || 0,
          s.grades_count?.A || 0,
          s.grades_count?.B || 0,
          s.grades_count?.C || 0,
        ]);
        downloadCsv(`team_${currentSingleTeam.name.toLowerCase().replace(/\s+/g, "_")}_report_${dateStr}.csv`, headers, rows);
      } else if (singleMode === "program" && currentSingleProgram) {
        const headers = ["Position", "Student Name", "Chest No", "Team", "Grade", "Points"];
        const rows = currentSingleProgramScores.map((s) => [
          s.position === 1 ? "1st Place" : s.position === 2 ? "2nd Place" : "3rd Place",
          s.studentName,
          s.chestNo,
          s.teamName,
          s.grade,
          s.score,
        ]);
        downloadCsv(`program_${currentSingleProgram.name.toLowerCase().replace(/\s+/g, "_")}_results_${dateStr}.csv`, headers, rows);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      
      {/* 1. Official Printable Header (Hidden on screen, visible during window.print()) */}
      <div className="hidden print:block mb-8 text-black border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-black">Dars Fest — Official Report</h1>
            <p className="text-sm font-semibold text-gray-700 mt-1">
              {activeTab === "students" && "Festival Participant Directory"}
              {activeTab === "teams" && "Official Team Standings & Scoreboard"}
              {activeTab === "programs" && "Programs & Events Directory"}
              {activeTab === "scores" && "All Scores & Results Ledger"}
              {activeTab === "single" && (singleMode === "team" ? `Team Dossier: ${currentSingleTeam?.name}` : `Program Result Sheet: ${currentSingleProgram?.name}`)}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p className="font-semibold">Generated: {reportDate}</p>
            <p>Fest Command Center Verification</p>
          </div>
        </div>
      </div>

      {/* 2. Screen Controls Header (Hidden on print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Reports & Export Hub</h1>
            <p className="mt-1 text-sm text-white/70">
              Print official reports or export structured data across students, teams, programs, and scores.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportCsv}
              className="gap-2 border-white/20 hover:bg-white/10"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              Export CSV
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="gap-2 shadow-lg"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab("students"); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "students"
                ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            All Students ({students.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("teams"); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "teams"
                ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            Teams Scoreboard ({teams.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("programs"); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "programs"
                ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            Programs ({programs.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("scores"); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "scores"
                ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-fuchsia-400" />
            All Scores & Results ({allScoreEntries.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("single"); setSearchQuery(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "single"
                ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-pink-400" />
            Single Type Print
          </button>
        </div>

        {/* Dynamic Filters Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Search Input (For students, programs, scores) */}
            {activeTab !== "teams" && activeTab !== "single" && (
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === "students" ? "Search by student name or chest #..." :
                    activeTab === "programs" ? "Search by program name..." :
                    "Search by student, program, or team..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Team Filter */}
            {(activeTab === "students" || activeTab === "scores") && (
              <div className="w-full sm:w-auto">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="h-11 rounded-2xl border border-white/10 bg-slate-900 px-3.5 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="all">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Filter */}
            {(activeTab === "programs" || activeTab === "scores") && (
              <div className="w-full sm:w-auto">
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="h-11 rounded-2xl border border-white/10 bg-slate-900 px-3.5 text-xs font-semibold text-white focus:outline-none capitalize"
                >
                  <option value="all">All Sections</option>
                  <option value="single">Single</option>
                  <option value="group">Group</option>
                  <option value="general">General</option>
                </select>
              </div>
            )}

            {/* Stage Filter */}
            {activeTab === "programs" && (
              <div className="w-full sm:w-auto">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="h-11 rounded-2xl border border-white/10 bg-slate-900 px-3.5 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="all">All Stages</option>
                  <option value="true">On-Stage Only</option>
                  <option value="false">Off-Stage Only</option>
                </select>
              </div>
            )}

            {/* Single Type Selectors */}
            {activeTab === "single" && (
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setSingleMode("team")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${singleMode === "team" ? "bg-white/15 text-white font-bold" : "text-white/60 hover:text-white"}`}
                  >
                    Single Team Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleMode("program")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${singleMode === "program" ? "bg-white/15 text-white font-bold" : "text-white/60 hover:text-white"}`}
                  >
                    Single Program Sheet
                  </button>
                </div>

                {singleMode === "team" ? (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="h-11 rounded-2xl border border-white/10 bg-slate-900 px-4 text-xs font-semibold text-white focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>Team: {t.name} (Led by {t.leader || "—"})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="h-11 rounded-2xl border border-white/10 bg-slate-900 px-4 text-xs font-semibold text-white focus:outline-none"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>Program: {p.name} ({p.section})</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Main Report View Container */}
      <Card className="print:border-none print:shadow-none print:bg-white print:p-0 print:text-black">
        
        {/* ================= TAB 1: ALL STUDENTS REPORT ================= */}
        {activeTab === "students" && (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Showing {filteredStudents.length} Students
              </p>
            </div>
            <table className="w-full text-left text-sm border-collapse print:text-black">
              <thead>
                <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase tracking-wider print:text-black">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Chest #</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">Positions (1/2/3)</th>
                  <th className="py-3 px-3 text-center">Grades (A/B/C)</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    const team = teamMap.get(student.team_id);
                    return (
                      <tr key={student.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                        <td className="py-3 px-3 text-xs text-white/50 print:text-black">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-cyan-300 print:text-black">{student.chest_no}</td>
                        <td className="py-3 px-4 font-semibold text-white print:text-black">{student.name}</td>
                        <td className="py-3 px-4 text-white/80 print:text-black">{team?.name || "Unknown"}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-white/80 print:text-black">
                          {student.positions_count?.first || 0} / {student.positions_count?.second || 0} / {student.positions_count?.third || 0}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-white/80 print:text-black">
                          {student.grades_count?.A || 0} / {student.grades_count?.B || 0} / {student.grades_count?.C || 0}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white print:text-black">{formatNumber(student.total_points || 0)} pts</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/50">No students match the current criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 2: TEAMS SCOREBOARD ================= */}
        {activeTab === "teams" && (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Showing {sortedTeams.length} Teams Ranked by Points
              </p>
            </div>
            <table className="w-full text-left text-sm border-collapse print:text-black">
              <thead>
                <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase tracking-wider print:text-black">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Team Leader</th>
                  <th className="py-3 px-3 text-center">1st</th>
                  <th className="py-3 px-3 text-center">2nd</th>
                  <th className="py-3 px-3 text-center">3rd</th>
                  <th className="py-3 px-3 text-center">Grade A</th>
                  <th className="py-3 px-3 text-center">Grade B</th>
                  <th className="py-3 px-3 text-center">Grade C</th>
                  <th className="py-3 px-4 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black">
                {sortedTeams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                    <td className="py-3.5 px-3 text-center font-bold text-base print:text-black">
                      {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white print:text-black">{team.name}</td>
                    <td className="py-3.5 px-4 text-white/70 print:text-black">{team.leader || "—"}</td>
                    <td className="py-3.5 px-3 text-center text-amber-400 font-semibold print:text-black">{team.positions_count?.first || 0}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300 font-semibold print:text-black">{team.positions_count?.second || 0}</td>
                    <td className="py-3.5 px-3 text-center text-amber-600 font-semibold print:text-black">{team.positions_count?.third || 0}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-400 font-semibold print:text-black">{team.grades_count?.A || 0}</td>
                    <td className="py-3.5 px-3 text-center text-cyan-400 font-semibold print:text-black">{team.grades_count?.B || 0}</td>
                    <td className="py-3.5 px-3 text-center text-pink-400 font-semibold print:text-black">{team.grades_count?.C || 0}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-lg text-cyan-300 print:text-black">{formatNumber(team.total_points || 0)} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 3: PROGRAMS DIRECTORY ================= */}
        {activeTab === "programs" && (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Showing {filteredPrograms.length} Programs
              </p>
            </div>
            <table className="w-full text-left text-sm border-collapse print:text-black">
              <thead>
                <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase tracking-wider print:text-black">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-3 text-center">Section</th>
                  <th className="py-3 px-3 text-center">Stage</th>
                  <th className="py-3 px-3 text-center">Max Candidate Limit</th>
                  <th className="py-3 px-4 text-right">Total Registrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black">
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((program, idx) => (
                    <tr key={program.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                      <td className="py-3 px-3 text-xs text-white/50 print:text-black">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white print:text-black">{program.name}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge tone={program.section === "single" ? "pink" : program.section === "group" ? "emerald" : "amber"} className="capitalize">
                          {program.section}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-white/80 print:text-black">
                        {program.stage ? "On-Stage" : "Off-Stage"}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-white/80 print:text-black">
                        {program.candidateLimit || 1}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-300 print:text-black">
                        {regCountByProgram.get(program.id) || 0} Registered
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/50">No programs match the filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 4: ALL SCORES & RESULTS LEDGER ================= */}
        {activeTab === "scores" && (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Showing {filteredScores.length} Published Result Records
              </p>
            </div>
            <table className="w-full text-left text-sm border-collapse print:text-black">
              <thead>
                <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase tracking-wider print:text-black">
                  <th className="py-3 px-4">Program Event</th>
                  <th className="py-3 px-3 text-center">Section</th>
                  <th className="py-3 px-3 text-center">Position</th>
                  <th className="py-3 px-4">Winner / Student</th>
                  <th className="py-3 px-3">Chest #</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Awarded Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black">
                {filteredScores.length > 0 ? (
                  filteredScores.map((score) => (
                    <tr key={score.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                      <td className="py-3 px-4 font-semibold text-white print:text-black">{score.programName}</td>
                      <td className="py-3 px-3 text-center text-xs text-white/70 print:text-black capitalize">{score.section}</td>
                      <td className="py-3 px-3 text-center font-bold print:text-black">
                        {score.position === 1 ? "🥇 1st" : score.position === 2 ? "🥈 2nd" : "🥉 3rd"}
                      </td>
                      <td className="py-3 px-4 text-white print:text-black font-medium">{score.studentName}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-cyan-300 print:text-black">{score.chestNo}</td>
                      <td className="py-3 px-4 text-white/80 print:text-black">{score.teamName}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-400 print:text-black">{score.grade}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-white print:text-black">{score.score} pts</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-white/50">No score records found for current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 5: SINGLE TYPE DOSSIER ================= */}
        {activeTab === "single" && (
          <div>
            {singleMode === "team" && currentSingleTeam && (
              <div className="space-y-6">
                
                {/* Team Dossier Header */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 print:border-black print:bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest print:text-black">Team Dossier</p>
                      <h2 className="text-2xl font-bold text-white print:text-black">{currentSingleTeam.name}</h2>
                      <p className="text-sm text-white/70 print:text-black">Leader: {currentSingleTeam.leader || "Unassigned"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-white/60 print:text-black font-semibold">Total Points</p>
                      <p className="text-3xl font-extrabold text-cyan-300 print:text-black">{formatNumber(currentSingleTeam.total_points || 0)} pts</p>
                    </div>
                  </div>
                </div>

                {/* Team Results Won */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 print:text-black">Awards & Results Won</h3>
                  <table className="w-full text-left text-sm border-collapse print:text-black">
                    <thead>
                      <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase print:text-black">
                        <th className="py-2.5 px-3">Position</th>
                        <th className="py-2.5 px-4">Program Event</th>
                        <th className="py-2.5 px-4">Winner</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-black">
                      {currentSingleTeamScores.length > 0 ? (
                        currentSingleTeamScores.map((score) => (
                          <tr key={score.id}>
                            <td className="py-2.5 px-3 font-bold print:text-black">
                              {score.position === 1 ? "🥇 1st" : score.position === 2 ? "🥈 2nd" : "🥉 3rd"}
                            </td>
                            <td className="py-2.5 px-4 text-white print:text-black">{score.programName}</td>
                            <td className="py-2.5 px-4 text-white/80 print:text-black">{score.studentName} ({score.chestNo})</td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-400 print:text-black">{score.grade}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-cyan-300 print:text-black">{score.score} pts</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-white/50 print:text-black">No positions or points recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Team Roster */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 print:text-black">
                    Registered Students Roster ({currentSingleTeamStudents.length})
                  </h3>
                  <table className="w-full text-left text-sm border-collapse print:text-black">
                    <thead>
                      <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase print:text-black">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Chest #</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4 text-right">Accumulated Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-black">
                      {currentSingleTeamStudents.map((s, idx) => (
                        <tr key={s.id}>
                          <td className="py-2.5 px-3 text-xs text-white/50 print:text-black">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300 print:text-black">{s.chest_no}</td>
                          <td className="py-2.5 px-4 font-semibold text-white print:text-black">{s.name}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-white print:text-black">{s.total_points || 0} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {singleMode === "program" && currentSingleProgram && (
              <div className="space-y-6">
                
                {/* Program Header */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 print:border-black print:bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-fuchsia-400 uppercase tracking-widest print:text-black">Official Program Result Sheet</p>
                      <h2 className="text-2xl font-bold text-white print:text-black">{currentSingleProgram.name}</h2>
                      <p className="text-sm text-white/70 print:text-black capitalize">
                        Section: {currentSingleProgram.section} • {currentSingleProgram.stage ? "On-Stage" : "Off-Stage"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-white/60 print:text-black font-semibold">Registered Candidates</p>
                      <p className="text-2xl font-extrabold text-cyan-300 print:text-black">{currentSingleProgramRegistrations.length}</p>
                    </div>
                  </div>
                </div>

                {/* Published Winners */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 print:text-black">Official Winners & Podium</h3>
                  <table className="w-full text-left text-sm border-collapse print:text-black">
                    <thead>
                      <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase print:text-black">
                        <th className="py-2.5 px-3 text-center">Position</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-3">Chest #</th>
                        <th className="py-2.5 px-4">Team</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-4 text-right">Awarded Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-black">
                      {currentSingleProgramScores.length > 0 ? (
                        currentSingleProgramScores.map((score) => (
                          <tr key={score.id}>
                            <td className="py-2.5 px-3 text-center font-bold text-base print:text-black">
                              {score.position === 1 ? "🥇 1st Place" : score.position === 2 ? "🥈 2nd Place" : "🥉 3rd Place"}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-white print:text-black">{score.studentName}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300 print:text-black">{score.chestNo}</td>
                            <td className="py-2.5 px-4 text-white/80 print:text-black">{score.teamName}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-400 print:text-black">{score.grade}</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-cyan-300 print:text-black">{score.score} pts</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-white/50 print:text-black">No approved results recorded for this program yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Candidate Roster for this Program */}
                <div>
                  <h3 className="text-base font-bold text-white mb-3 print:text-black">
                    Enrolled Participants ({currentSingleProgramRegistrations.length})
                  </h3>
                  <table className="w-full text-left text-sm border-collapse print:text-black">
                    <thead>
                      <tr className="border-b border-white/10 print:border-black text-xs font-semibold text-white/60 uppercase print:text-black">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Chest #</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4">Team</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-black">
                      {currentSingleProgramRegistrations.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="py-2 px-3 text-xs text-white/50 print:text-black">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-cyan-300 print:text-black">{r.studentChest}</td>
                          <td className="py-2 px-4 text-white print:text-black font-medium">{r.studentName}</td>
                          <td className="py-2 px-4 text-white/80 print:text-black">{r.teamName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 4. Official Print Verification Footer (Only appears when printing) */}
        <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t-2 border-black mt-8">
          <div>
            <p className="font-semibold">Dars Fest Administrative Authority</p>
            <p>Official Record • Generated via System</p>
          </div>
          <div className="text-center">
            <div className="w-56 border-b border-black mb-1.5"></div>
            <p className="font-semibold">Convener / Controller Signature</p>
          </div>
        </div>

      </Card>

    </div>
  );
}
