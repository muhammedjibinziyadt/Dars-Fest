"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Program, ResultRecord, Student, Team } from "@/lib/types";
import { ResultProgramCard } from "./result-program-card";
import { Filter } from "lucide-react";
import { StudentLeaderboard } from "./student-leaderboard";
import { TeamLeaderboard } from "./team-leaderboard";

interface SectionResultsProps {
    programs: Program[];
    results: ResultRecord[];
    programMap: Map<string, Program>;
    students: Student[];
    teams: Team[];
}

type FilterType = "stage" | "non-stage" | "both" | "group" | "general";

export function SectionResults({ programs, results, programMap, students, teams }: SectionResultsProps) {
    const [filter, setFilter] = useState<FilterType>("stage");
    const [bothOnlyStrict, setBothOnlyStrict] = useState<boolean>(false);

    const resultMap = useMemo(() => new Map(results.map((r) => [r.program_id, r])), [results]);

    const filteredPrograms = useMemo(() => {
        // Only show programs that have results
        const programsWithResults = programs.filter(p => resultMap.has(p.id));

        return programsWithResults.filter((program) => {
            switch (filter) {
                case "both":
                    // All stage & non-stage single items
                    return program.stage === true || program.stage === false;
                case "stage":
                    return program.stage === true;
                case "non-stage":
                    return program.stage === false;
                case "group":
                    return program.section === "group";
                case "general":
                    return program.section === "general";
                default:
                    return true;
            }
        });
    }, [programs, resultMap, filter]);

    // Calculate specific points based on current filter results
    const leaderboardData = useMemo(() => {
        const relevantProgramIds = new Set(filteredPrograms.map(p => p.id));
        const relevantResults = results.filter(r => relevantProgramIds.has(r.program_id));

        if (filter === "both" || filter === "stage" || filter === "non-stage") {
            // Calculate Student Points for this section
            const studentPoints = new Map<string, number>();
            const studentStagePoints = new Map<string, number>();
            const studentNonStagePoints = new Map<string, number>();

            relevantResults.forEach(result => {
                const prog = programMap.get(result.program_id);
                const isStage = prog?.stage === true;

                result.entries.forEach(entry => {
                    if (entry.student_id) {
                        if (filter === "stage" && !isStage) return;
                        if (filter === "non-stage" && isStage) return;

                        const current = studentPoints.get(entry.student_id) || 0;
                        studentPoints.set(entry.student_id, current + entry.score);

                        if (isStage) {
                            studentStagePoints.set(entry.student_id, (studentStagePoints.get(entry.student_id) || 0) + entry.score);
                        } else {
                            studentNonStagePoints.set(entry.student_id, (studentNonStagePoints.get(entry.student_id) || 0) + entry.score);
                        }
                    }
                });
            });

            // Return students with updated points
            let updatedStudents = students.map(s => ({
                ...s,
                total_points: studentPoints.get(s.id) || 0,
            })).filter(s => s.total_points > 0);

            // Filter for students who scored in BOTH stage and non-stage if strict toggle is enabled
            if (filter === "both" && bothOnlyStrict) {
                updatedStudents = updatedStudents.filter(
                    s => (studentStagePoints.get(s.id) || 0) > 0 && (studentNonStagePoints.get(s.id) || 0) > 0
                );
            }

            return { type: "student", data: updatedStudents };
        } else {
            // Calculate Team Points for this section
            const teamPoints = new Map<string, number>();

            relevantResults.forEach(result => {
                result.entries.forEach(entry => {
                    if (entry.team_id) {
                        const current = teamPoints.get(entry.team_id) || 0;
                        teamPoints.set(entry.team_id, current + entry.score);
                    } else if (entry.student_id) {
                        const student = students.find(s => s.id === entry.student_id);
                        if (student?.team_id) {
                            const current = teamPoints.get(student.team_id) || 0;
                            teamPoints.set(student.team_id, current + entry.score);
                        }
                    }
                });
            });

            const updatedTeams = teams.map(t => ({
                ...t,
                total_points: teamPoints.get(t.id) || 0
            })).filter(t => t.total_points > 0);

            return { type: "team", data: updatedTeams };
        }
    }, [filteredPrograms, results, students, teams, filter, programMap, bothOnlyStrict]);

    const filters: { id: FilterType; label: string }[] = [
        { id: "stage", label: "Stage Items" },
        { id: "non-stage", label: "Non-Stage" },
        { id: "both", label: "Both Sections" },
        { id: "group", label: "Group Items" },
        { id: "general", label: "General" },
    ];

    return (
        <div className="space-y-8 md:space-y-12">
            {/* Filter Scrollable Tabs */}
            <div className="sticky top-0 z-20 bg-[#fffcf5]/95 backdrop-blur-sm py-2 -mx-4 px-4 md:static md:bg-transparent md:p-0">
                <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 py-2 overflow-x-auto no-scrollbar w-full whitespace-nowrap">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`
                              relative px-4 py-2 md:px-6 md:py-3 rounded-full md:rounded-2xl font-semibold transition-all duration-300 flex-shrink-0 text-sm md:text-base selection:bg-transparent
                              ${filter === f.id
                                    ? "text-[#8B4513] bg-[#8B4513]/10 font-bold"
                                    : "bg-white text-gray-500 border border-gray-100 hover:text-[#8B4513] hover:bg-[#8B4513]/5"
                                }
                            `}
                        >
                            {f.label}
                            {filter === f.id && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 rounded-full md:rounded-2xl border-2 border-[#8B4513]/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section Leaderboard */}
            <motion.div
                key={filter + (bothOnlyStrict ? "-strict" : "")} // Re-animate on filter or toggle change
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/50 border border-gray-200/50 rounded-3xl p-4 md:p-8"
            >
                <div className="text-center mb-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                        {filter === "both"
                            ? "🏆 Both Sections Champions"
                            : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Leaderboard`}
                    </h3>
                    <p className="text-gray-500 text-sm md:text-base mt-1">
                        {filter === "both"
                            ? "Top champions and performers across both Stage and Non-Stage items"
                            : `Top performers in ${filter.replace("-", " ")} items`}
                    </p>

                    {filter === "both" && (
                        <div className="mt-4 inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs">
                            <button
                                type="button"
                                onClick={() => setBothOnlyStrict(false)}
                                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                                    !bothOnlyStrict
                                        ? "bg-[#8B4513] text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                All Combined Performers
                            </button>
                            <button
                                type="button"
                                onClick={() => setBothOnlyStrict(true)}
                                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                                    bothOnlyStrict
                                        ? "bg-[#8B4513] text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                Scored in Both Sections Only
                            </button>
                        </div>
                    )}
                </div>

                {leaderboardData.type === "student" ? (
                    <StudentLeaderboard
                        students={leaderboardData.data as Student[]}
                        teams={teams}
                    />
                ) : (
                    <TeamLeaderboard
                        teams={leaderboardData.data as Team[]}
                    />
                )}
            </motion.div>
        </div>
    );
}
