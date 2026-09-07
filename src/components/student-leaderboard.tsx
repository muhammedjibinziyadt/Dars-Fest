"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Search, Crown, ChevronRight } from "lucide-react";
import type { Student, Team } from "@/lib/types";
import { isValidImageUrl, getSafeImageUrl } from "@/lib/utils";
import Image from "next/image";

interface StudentLeaderboardProps {
    students: Student[];
    teams: Team[];
}

export function StudentLeaderboard({ students, teams }: StudentLeaderboardProps) {
    const [search, setSearch] = useState("");

    const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

    const sortedStudents = useMemo(() => {
        const sorted = [...students]
            .filter((s) => s.total_points > 0)
            .sort((a, b) => b.total_points - a.total_points);

        let currentRank = 1;
        return sorted.map((student, index) => {
            if (index > 0 && student.total_points < sorted[index - 1].total_points) {
                currentRank++;
            }
            return {
                ...student,
                rank: currentRank,
                teamName: teamMap.get(student.team_id)?.name || "Unknown Team",
                teamColor: teamMap.get(student.team_id)?.color || "#808080",
            };
        });
    }, [students, teamMap]);

    const filteredStudents = useMemo(() => {
        if (!search.trim()) return sortedStudents;
        const normalized = search.toLowerCase();
        return sortedStudents.filter(
            (s) =>
                s.name.toLowerCase().includes(normalized) ||
                s.chest_no.toLowerCase().includes(normalized) ||
                s.teamName.toLowerCase().includes(normalized)
        );
    }, [search, sortedStudents]);

    const topStudents = sortedStudents.slice(0, 3);
    const restStudents = filteredStudents.filter((s, index) => index >= 3 || search); // Fix filtering for display

    // Helper to determine podium label
    const getPodiumLabel = (rank: number) => {
        if (rank === 1) return "CHAMPION";
        if (rank === 2) return "2ND PLACE";
        if (rank === 3) return "3RD PLACE";
        return `${rank}TH PLACE`;
    };

    const getPodiumStyles = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    border: "border-yellow-400",
                    ring: "ring-4 ring-yellow-400/20",
                    badge: "bg-yellow-500",
                    text: "text-yellow-700",
                    bg: "bg-yellow-50",
                    borderSmall: "border-yellow-200",
                    iconColor: "text-yellow-500",
                    crown: true
                };
            case 2:
                return {
                    border: "border-gray-300",
                    ring: "ring-4 ring-gray-100",
                    badge: "bg-gray-600",
                    text: "text-gray-700",
                    bg: "bg-gray-50",
                    borderSmall: "border-gray-200",
                    iconColor: "text-gray-400",
                    crown: false
                };
            case 3:
                return {
                    border: "border-orange-300",
                    ring: "ring-4 ring-orange-100",
                    badge: "bg-orange-400",
                    text: "text-orange-700",
                    bg: "bg-orange-50",
                    borderSmall: "border-orange-200",
                    iconColor: "text-orange-400",
                    crown: false
                };
            default:
                return {
                    border: "border-blue-300",
                    ring: "",
                    badge: "bg-blue-400",
                    text: "text-gray-700",
                    bg: "bg-white",
                    borderSmall: "border-gray-200",
                    iconColor: "text-blue-400",
                    crown: false
                };
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 pt-4 md:pt-8 w-full">
            {/* Search Bar - Floating & Elegant */}
            <div className="relative max-w-lg mx-auto px-4 z-10">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#8B4513] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search student, chest no..."
                        className="block w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-md hidden md:block">
                            {filteredStudents.length} students
                        </span>
                    </div>
                </div>
            </div>

            {/* Top 3 Podium - Only show if no search filter */}
            {!search && topStudents.length > 0 && (
                <div className="relative mt-8 mb-12 px-4">
                    {/* Podium Container */}
                    <div className="flex items-start justify-center gap-2 md:gap-8 pt-14 pb-8">

                        {/* 2nd Slot (Left) */}
                        {topStudents[1] && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col items-center w-1/3 max-w-[140px] mt-8 md:mt-12"
                            >
                                <div className="relative mb-6 md:mb-8">
                                    {getPodiumStyles(topStudents[1].rank).crown && (
                                        <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                            <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                        </div>
                                    )}
                                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(topStudents[1].rank).border} ${getPodiumStyles(topStudents[1].rank).ring}`}>
                                        {isValidImageUrl(topStudents[1].avatar) ? (
                                            <Image
                                                src={getSafeImageUrl(topStudents[1].avatar)}
                                                alt={topStudents[1].name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                                                {topStudents[1].name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(topStudents[1].rank).badge}`}>
                                        {getPodiumStyles(topStudents[1].rank).crown && <Trophy className="w-3 h-3" />}
                                        {getPodiumLabel(topStudents[1].rank)}
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-lg px-1 text-center leading-tight mb-1">{topStudents[1].name}</h3>
                                    <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{topStudents[1].teamName}</p>
                                    <div className={`inline-block border shadow-sm rounded-lg px-2 md:px-3 py-1 ${getPodiumStyles(topStudents[1].rank).bg} ${getPodiumStyles(topStudents[1].rank).borderSmall}`}>
                                        <span className={`font-bold text-sm md:text-base ${getPodiumStyles(topStudents[1].rank).text}`}>{topStudents[1].total_points}</span>
                                        <span className="text-[10px] text-gray-400 ml-1">PTS</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 1st Slot (Center) */}
                        {topStudents[0] && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col items-center w-1/3 max-w-[160px] z-20"
                            >
                                <div className="relative mb-6 md:mb-8">
                                    {getPodiumStyles(topStudents[0].rank).crown && (
                                        <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                            <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                        </div>
                                    )}
                                    <div className={`w-24 h-24 md:w-36 md:h-36 rounded-full border-4 shadow-2xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(topStudents[0].rank).border} ${getPodiumStyles(topStudents[0].rank).ring}`}>
                                        {isValidImageUrl(topStudents[0].avatar) ? (
                                            <Image
                                                src={getSafeImageUrl(topStudents[0].avatar)}
                                                alt={topStudents[0].name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-400">
                                                {topStudents[0].name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(topStudents[0].rank).badge}`}>
                                        {getPodiumStyles(topStudents[0].rank).crown && <Trophy className="w-3 h-3" />}
                                        {getPodiumLabel(topStudents[0].rank)}
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-gray-900 text-sm md:text-xl px-1 text-center leading-tight mb-1">{topStudents[0].name}</h3>
                                    <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{topStudents[0].teamName}</p>
                                    <div className={`inline-block border shadow-sm rounded-lg px-3 md:px-4 py-1 ${getPodiumStyles(topStudents[0].rank).bg} ${getPodiumStyles(topStudents[0].rank).borderSmall}`}>
                                        <span className={`font-black text-base md:text-lg ${getPodiumStyles(topStudents[0].rank).text}`}>{topStudents[0].total_points}</span>
                                        <span className="text-[10px] text-gray-500/70 ml-1">PTS</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 3rd Slot (Right) */}
                        {topStudents[2] && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center w-1/3 max-w-[140px] mt-8 md:mt-12"
                            >
                                <div className="relative mb-6 md:mb-8">
                                    {getPodiumStyles(topStudents[2].rank).crown && (
                                        <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                            <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                        </div>
                                    )}
                                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(topStudents[2].rank).border} ${getPodiumStyles(topStudents[2].rank).ring}`}>
                                        {isValidImageUrl(topStudents[2].avatar) ? (
                                            <Image
                                                src={getSafeImageUrl(topStudents[2].avatar)}
                                                alt={topStudents[2].name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                                                {topStudents[2].name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(topStudents[2].rank).badge}`}>
                                        {getPodiumStyles(topStudents[2].rank).crown && <Trophy className="w-3 h-3" />}
                                        {getPodiumLabel(topStudents[2].rank)}
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-lg px-1 text-center leading-tight mb-1">{topStudents[2].name}</h3>
                                    <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{topStudents[2].teamName}</p>
                                    <div className={`inline-block border shadow-sm rounded-lg px-2 md:px-3 py-1 ${getPodiumStyles(topStudents[2].rank).bg} ${getPodiumStyles(topStudents[2].rank).borderSmall}`}>
                                        <span className={`font-bold text-sm md:text-base ${getPodiumStyles(topStudents[2].rank).text}`}>{topStudents[2].total_points}</span>
                                        <span className="text-[10px] text-gray-400 ml-1">PTS</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* List View - Card Style for Mobile */}
            <div className="px-4 pb-20">
                <div className="max-w-4xl mx-auto space-y-3">
                    {search.length > 0 || restStudents.length > 0 ? (
                        <AnimatePresence>
                            {(search ? filteredStudents : restStudents).map((student, index) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 overflow-hidden"
                                >
                                    {/* Rank Badge */}
                                    <div className={`
                                        flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold
                                        ${student.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50/50' :
                                            student.rank === 2 ? 'bg-gray-100 text-gray-700 ring-4 ring-gray-50/50' :
                                                student.rank === 3 ? 'bg-orange-100 text-orange-700 ring-4 ring-orange-50/50' :
                                                    'bg-gray-50 text-gray-500'}
                                    `}>
                                        {student.rank}
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                                            {isValidImageUrl(student.avatar) ? (
                                                <Image
                                                    src={getSafeImageUrl(student.avatar)}
                                                    alt={student.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                    {student.name[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-[#8B4513] transition-colors leading-tight">
                                            {student.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 rounded whitespace-nowrap">{student.chest_no}</span>
                                            <span className="text-[10px] md:text-xs text-gray-500 border-l border-gray-200 pl-2 leading-tight">
                                                {student.teamName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="flex-shrink-0 text-right pl-2">
                                        <div className="font-black text-gray-900 text-base md:text-xl">
                                            {student.total_points}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Points</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                            No students found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
