"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamPointsSummary } from "@/lib/team-points";
import { formatNumber } from "@/lib/utils";

interface TeamWinnersFullViewProps {
  summary: TeamPointsSummary;
}

export function TeamWinnersFullView({ summary }: TeamWinnersFullViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "single" | "group" | "first_place">("all");

  const filteredStudents = useMemo(() => {
    return summary.students.filter((student) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.chestNumber.toLowerCase().includes(query) ||
        student.winnedPrograms.some((p) => p.programName.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterType === "all") return true;
      if (filterType === "single") {
        return student.winnedPrograms.some((p) => !p.isGroup);
      }
      if (filterType === "group") {
        return student.winnedPrograms.some((p) => p.isGroup);
      }
      if (filterType === "first_place") {
        return student.winnedPrograms.some((p) => p.position === 1);
      }

      return true;
    });
  }, [summary.students, searchQuery, filterType]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
              <Trophy className="h-8 w-8 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Team Winners Roster
                </span>
                <Badge tone="emerald" className="text-xs px-2.5 py-0.5">
                  Published Results
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {summary.teamName} · Points & Winners
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                Led by {summary.leaderName}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3.5 text-center sm:text-right shrink-0">
            <span className="text-xs font-semibold text-amber-200/80 uppercase">Total Team Score</span>
            <p className="text-3xl sm:text-4xl font-black text-amber-300 mt-0.5">
              {formatNumber(summary.totalPoints)} <span className="text-sm font-medium text-amber-300/70">PTS</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-white/60">Winning Students</span>
            <p className="text-2xl font-bold text-white mt-0.5">{summary.winningStudentsCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-white/60">Programs Won</span>
            <p className="text-2xl font-bold text-white mt-0.5">{summary.totalWinningProgramsCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-amber-400">1st Places 🥇</span>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{summary.firstPlacesCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-slate-300">2nd Places 🥈</span>
            <p className="text-2xl font-bold text-slate-200 mt-0.5">{summary.secondPlacesCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or chest code (e.g. TE001)..."
            className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              filterType === "all"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            All Winners ({summary.students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("first_place")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              filterType === "first_place"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            🥇 1st Place
          </button>
          <button
            type="button"
            onClick={() => setFilterType("single")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              filterType === "single"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Single Events
          </button>
          <button
            type="button"
            onClick={() => setFilterType("group")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              filterType === "group"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Group Events
          </button>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student, index) => {
            const isTopScorer = index === 0 && student.totalPoints > 0;

            return (
              <div
                key={student.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition-all duration-200 hover:border-amber-400/40 hover:bg-white/[0.06] shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    {/* Photo / Avatar */}
                    <div className="relative shrink-0">
                      {student.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md shadow-amber-500/10"
                        />
                      ) : (
                        <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-cyan-500/20 border-2 border-white/20 flex flex-col items-center justify-center text-white/90">
                          <User className="h-8 w-8 text-amber-400 mb-0.5" />
                          <span className="text-xs font-mono font-bold">{student.chestNumber}</span>
                        </div>
                      )}

                      {isTopScorer && (
                        <span
                          className="absolute -top-2 -right-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 p-1.5 shadow-md"
                          title="Team Top Scorer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Name & Code */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                          {student.name}
                        </h2>
                        {isTopScorer && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Team Top Scorer
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                        <span className="inline-flex items-center font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-cyan-300 border border-white/10">
                          Chest #{student.chestNumber}
                        </span>
                        <span className="text-xs text-white/60">
                          {student.winnedPrograms.length} {student.winnedPrograms.length === 1 ? "Program Won" : "Programs Won"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points Box */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <span className="text-xl sm:text-2xl font-black text-amber-300">
                        {student.totalPoints}
                      </span>
                      <span className="text-xs font-semibold text-amber-300/80 uppercase">Points</span>
                    </div>
                    {(student.individualPoints > 0 || student.groupPoints > 0) && (
                      <div className="text-xs text-white/60 space-x-2">
                        {student.individualPoints > 0 && <span>Individual: {student.individualPoints} pts</span>}
                        {student.individualPoints > 0 && student.groupPoints > 0 && <span>•</span>}
                        {student.groupPoints > 0 && <span>Group: {student.groupPoints} pts</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Winned Programs */}
                <div className="mt-4 pt-1">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2.5">
                    Winned Programs & Placements
                  </p>

                  {student.winnedPrograms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {student.winnedPrograms.map((prog, pIdx) => {
                        const isFirst = prog.position === 1;
                        const isSecond = prog.position === 2;
                        const isThird = prog.position === 3;

                        return (
                          <div
                            key={`${prog.programId}-${pIdx}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isFirst
                                    ? "bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20"
                                    : isSecond
                                      ? "bg-slate-300 text-slate-950"
                                      : isThird
                                        ? "bg-amber-700 text-amber-100"
                                        : "bg-white/15 text-white"
                                }`}
                              >
                                {isFirst ? "1st" : isSecond ? "2nd" : isThird ? "3rd" : `${prog.position}th`}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {prog.programName}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/50 mt-0.5">
                                  <span className="uppercase font-medium">{prog.section}</span>
                                  <span>•</span>
                                  <span>{prog.stage ? "On Stage" : "Off Stage"}</span>
                                  {prog.grade && prog.grade !== "none" && (
                                    <>
                                      <span>•</span>
                                      <span className="font-bold text-emerald-400">
                                        Grade {prog.grade}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="font-bold text-sm sm:text-base text-amber-300">
                                +{prog.points}
                              </span>
                              <span className="text-[10px] text-white/50 block">pts</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic">
                      Points credited ({student.totalPoints} pts) from manual score or penalty adjustment.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 rounded-3xl border border-white/10 bg-white/5">
            <Trophy className="mx-auto h-14 w-14 text-white/20 mb-3" />
            <h3 className="text-lg font-bold text-white">No Winning Students Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No students found matching "${searchQuery}".`
                : "No published results yet for this team. Check back as results are evaluated."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
