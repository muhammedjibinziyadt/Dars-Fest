"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Trophy, Medal } from "lucide-react";
import type { Program, ResultRecord, Student, Team } from "@/lib/types";

interface ProgramsGridProps {
  programs: Program[];
  results: ResultRecord[];
  programMap: Map<string, Program>;
  students: Student[];
  teams: Team[];
}

const fadeIn = (direction: string, delay: number) => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
    y: direction === "down" ? 50 : direction === "up" ? -50 : 0,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
    },
  },
});

export function ProgramsGrid({ programs, results, programMap, students, teams }: ProgramsGridProps) {
  const [search, setSearch] = useState("");


  // Create Maps for efficient lookup
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const resultMap = useMemo(() => new Map(results.map((r) => [r.program_id, r])), [results]);

  // Get unique programs that have results, sorted by latest result date
  const programsWithResults = useMemo(() => {
    const programIds = new Set(results.map((r) => r.program_id));
    const programsWithResultsList = programs.filter((p) => programIds.has(p.id));

    // Sort programs by their latest result's submitted_at date (newest first)
    return programsWithResultsList.sort((a, b) => {
      const aResults = results.filter((r) => r.program_id === a.id);
      const bResults = results.filter((r) => r.program_id === b.id);

      if (aResults.length === 0 && bResults.length === 0) return 0;
      if (aResults.length === 0) return 1;
      if (bResults.length === 0) return -1;

      // Get the most recent result for each program
      const aLatest = Math.max(...aResults.map((r) => new Date(r.submitted_at).getTime()));
      const bLatest = Math.max(...bResults.map((r) => new Date(r.submitted_at).getTime()));

      return bLatest - aLatest; // Descending order (newest first)
    });
  }, [programs, results]);

  const filteredPrograms = useMemo(() => {
    if (!search.trim()) {
      return programsWithResults.map((program, index) => ({
        id: program.id,
        program,
        index,
      }));
    }

    const normalized = search.toLowerCase();
    return programsWithResults
      .filter((program) => program.name.toLowerCase().includes(normalized))
      .map((program, index) => ({
        id: program.id,
        program,
        index,
      }));
  }, [search, programsWithResults]);

  // Get result count and medal info for each program
  const getProgramStats = (programId: string) => {
    const programResults = results.filter((r) => r.program_id === programId);
    const hasResults = programResults.length > 0;
    const program = programMap.get(programId);

    return {
      hasResults,
      section: program?.section || "general",
      category: program?.category || "none",
    };
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-[#fffcf5]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            variants={fadeIn("left", 0.3)}
            initial="hidden"
            animate="show"
            className="font-bold text-center text-4xl md:text-5xl mb-4 text-[#8B4513]"
          >
            Explore Programs Results
          </motion.h1>
          <motion.p
            variants={fadeIn("down", 0.4)}
            initial="hidden"
            animate="show"
            className="text-center text-gray-700 mb-10 text-lg"
          >
            Discover all approved results and winning moments
          </motion.p>

          <motion.div
            variants={fadeIn("down", 0.5)}
            initial="hidden"
            animate="show"
            className="mb-12"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Programs..."
                className="w-full bg-white border-2 border-gray-300 text-gray-900 h-14 pl-12 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition duration-300 ease-in-out placeholder:text-gray-400 shadow-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>

          {filteredPrograms.length > 0 && (
            <motion.div
              variants={fadeIn("up", 0.6)}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPrograms.map(({ id, program, index }) => {
                const stats = getProgramStats(program.id);
                const result = resultMap.get(program.id);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={`/results/${program.id}`}>
                      <div className="group cursor-pointer p-6 rounded-2xl border border-gray-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:border-[#8B4513] relative overflow-hidden">
                        {/* Background gradient effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8B4513]/0 to-[#0d7377]/0 group-hover:from-[#8B4513]/5 group-hover:to-[#0d7377]/5 transition-all duration-300" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#8B4513]/10">
                                <Trophy className="w-5 h-5 text-[#8B4513]" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors">
                                  {program.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                                    {stats.section}
                                  </span>
                                  {stats.category !== "none" && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                      Cat {stats.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Medal className="w-6 h-6 text-yellow-500/70 group-hover:text-yellow-600 transition-colors" />
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">View Results</span>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#8B4513]/10 transition-colors">
                              <svg
                                className="w-4 h-4 text-gray-600 group-hover:text-[#8B4513] transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {filteredPrograms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="flex flex-col items-center gap-4">
                <Search className="w-16 h-16 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700">
                  No programs found
                </h3>
                <p className="text-gray-600 max-w-md">
                  {search
                    ? `No programs match "${search}". Try a different search term.`
                    : "No approved results available yet. Check back soon!"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-4 px-6 py-2 rounded-xl bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513]/20 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

