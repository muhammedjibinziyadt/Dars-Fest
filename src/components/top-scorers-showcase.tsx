"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  User,
  Star,
} from "lucide-react";
import type { TopScorerItem, TopScorerCategory, TopScorerDataResult } from "@/lib/top-scorer-service";

interface TopScorersShowcaseProps {
  data: TopScorerDataResult;
  showTitle?: boolean;
}

function resolveAvatarUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // If user pasted a Google Images search/preview URL, extract the direct image URL
  if (trimmed.includes("google.com/imgres")) {
    try {
      const parsed = new URL(trimmed);
      const direct = parsed.searchParams.get("imgurl");
      if (direct) return direct;
    } catch {}
  }
  return trimmed;
}

function StudentAvatarDisplay({
  src,
  name,
  className = "",
  initialsClassName = "text-xs font-bold text-gray-600",
}: {
  src?: string;
  name: string;
  className?: string;
  initialsClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = resolveAvatarUrl(src);

  const initials = (name || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!cleanSrc || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${initialsClassName}`}>
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanSrc}
      alt={name}
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
    />
  );
}

export function TopScorersShowcase({
  data,
  showTitle = true,
}: TopScorersShowcaseProps) {
  const [category, setCategory] = useState<TopScorerCategory>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const currentList = useMemo(() => {
    const list = data[category] || [];
    if (!searchQuery.trim()) {
      return list;
    }
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.student.name.toLowerCase().includes(q) ||
        item.student.chest_no.toLowerCase().includes(q) ||
        item.team.name.toLowerCase().includes(q),
    );
  }, [data, category, searchQuery]);

  // Top 3 for podium (only students with points > 0)
  const activeScorers = useMemo(() => {
    const key =
      category === "individual"
        ? "individualPoints"
        : category === "group"
        ? "groupPoints"
        : "totalPoints";
    return currentList.filter((item) => item[key] > 0);
  }, [currentList, category]);

  const topThree = activeScorers.slice(0, 3);
  const remaining = activeScorers.slice(3);

  const getActiveScore = (item: TopScorerItem) => {
    if (category === "individual") return item.individualPoints;
    if (category === "group") return item.groupPoints;
    return item.totalPoints;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 font-semibold text-xs tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            MAERIKA 2K26 CHAMPIONS
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#8B4513] font-bold">
            Top Scorers Leaderboard
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Live rankings of standout participants across individual and group events.
          </p>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category switcher */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full sm:w-auto border border-gray-200/80 shadow-inner">
          {[
            { id: "overall" as const, label: "Both (Overall)", icon: Trophy },
            { id: "individual" as const, label: "Individual", icon: User },
            { id: "group" as const, label: "Group", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-[#8B4513] shadow-sm bg-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#8B4513]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryTab"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or team..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513] shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeScorers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 mx-auto flex items-center justify-center text-amber-600">
            <Trophy className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? "No matching participants found" : "No results approved yet"}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
              {searchQuery
                ? `No student matches "${searchQuery}". Try clearing the search or switching categories.`
                : "Top scorers will automatically update in real time as the jury and admin approve program results."}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-[#8B4513] hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* PODIUM SECTION (Top 3) */}
          <div className="relative pt-6 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end">
              {/* 2nd Place (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1">
                  <PodiumCard
                    item={topThree[1]}
                    position={2}
                    category={category}
                    activeScore={getActiveScore(topThree[1])}
                    getInitials={getInitials}
                    isExpanded={expandedStudentId === topThree[1].student.id}
                    onToggle={() =>
                      setExpandedStudentId(
                        expandedStudentId === topThree[1].student.id
                          ? null
                          : topThree[1].student.id,
                      )
                    }
                  />
                </div>
              )}

              {/* 1st Place (Gold / Crown) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 md:-translate-y-4">
                  <PodiumCard
                    item={topThree[0]}
                    position={1}
                    category={category}
                    activeScore={getActiveScore(topThree[0])}
                    getInitials={getInitials}
                    isExpanded={expandedStudentId === topThree[0].student.id}
                    onToggle={() =>
                      setExpandedStudentId(
                        expandedStudentId === topThree[0].student.id
                          ? null
                          : topThree[0].student.id,
                      )
                    }
                  />
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {topThree[2] && (
                <div className="order-3 md:order-3">
                  <PodiumCard
                    item={topThree[2]}
                    position={3}
                    category={category}
                    activeScore={getActiveScore(topThree[2])}
                    getInitials={getInitials}
                    isExpanded={expandedStudentId === topThree[2].student.id}
                    onToggle={() =>
                      setExpandedStudentId(
                        expandedStudentId === topThree[2].student.id
                          ? null
                          : topThree[2].student.id,
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* LEADERBOARD LIST (Ranks 4 and beyond) */}
          {remaining.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Other Leading Performers ({remaining.length})
                </h3>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
                {remaining.map((item) => (
                  <div key={item.student.id} className="transition-colors hover:bg-amber-50/30">
                    <div
                      onClick={() =>
                        setExpandedStudentId(
                          expandedStudentId === item.student.id ? null : item.student.id,
                        )
                      }
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      {/* Left: Rank & Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 text-center font-bold text-sm text-gray-500">
                          #{item.rank}
                        </span>

                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <StudentAvatarDisplay
                            src={item.student.avatar}
                            name={item.student.name}
                            initialsClassName="text-xs font-bold text-gray-600"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 truncate">
                              {item.student.name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                              {item.student.chest_no}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.team.color }}
                            />
                            <span className="truncate">{item.team.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores & Medals */}
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Medals summary */}
                        <div className="hidden sm:flex items-center gap-1.5 text-xs">
                          {item.medals.gold > 0 && (
                            <span className="flex items-center text-yellow-700">
                              🥇 {item.medals.gold}
                            </span>
                          )}
                          {item.medals.silver > 0 && (
                            <span className="flex items-center text-slate-600">
                              🥈 {item.medals.silver}
                            </span>
                          )}
                          {item.medals.bronze > 0 && (
                            <span className="flex items-center text-amber-700">
                              🥉 {item.medals.bronze}
                            </span>
                          )}
                        </div>

                        {/* Point Badge */}
                        <div className="text-right">
                          <div className="text-base sm:text-lg font-black text-[#8B4513]">
                            {getActiveScore(item)}
                            <span className="text-[10px] font-normal text-gray-500 ml-1">pts</span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {category === "overall" ? (
                              <span>
                                Ind: {item.individualPoints} · Grp: {item.groupPoints}
                              </span>
                            ) : category === "individual" ? (
                              <span>Group: {item.groupPoints} pts</span>
                            ) : (
                              <span>Ind: {item.individualPoints} pts</span>
                            )}
                          </div>
                        </div>

                        <div className="text-gray-400">
                          {expandedStudentId === item.student.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Achievements */}
                    <AnimatePresence>
                      {expandedStudentId === item.student.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden bg-gray-50/70 border-t border-gray-100 px-4 py-3"
                        >
                          <AchievementsList item={item} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PodiumCardProps {
  item: TopScorerItem;
  position: 1 | 2 | 3;
  category: TopScorerCategory;
  activeScore: number;
  getInitials: (name: string) => string;
  isExpanded: boolean;
  onToggle: () => void;
}

function PodiumCard({
  item,
  position,
  category,
  activeScore,
  getInitials,
  isExpanded,
  onToggle,
}: PodiumCardProps) {
  const isFirst = position === 1;
  const isSecond = position === 2;
  const isThird = position === 3;

  const config = {
    1: {
      border: "border-amber-300 ring-2 ring-amber-400/40 shadow-amber-200/50",
      badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-amber-500/30",
      title: "1st Place · Champion",
      medalEmoji: "🥇",
      headerBg: "bg-gradient-to-b from-amber-100/70 via-amber-50/30 to-white",
      crownColor: "text-amber-500",
    },
    2: {
      border: "border-slate-300 ring-1 ring-slate-300/40 shadow-slate-200/40",
      badgeBg: "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-slate-500/30",
      title: "2nd Place · Runner-Up",
      medalEmoji: "🥈",
      headerBg: "bg-gradient-to-b from-slate-100/70 via-slate-50/30 to-white",
      crownColor: "text-slate-400",
    },
    3: {
      border: "border-orange-300 ring-1 ring-orange-300/40 shadow-orange-200/40",
      badgeBg: "bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-orange-500/30",
      title: "3rd Place",
      medalEmoji: "🥉",
      headerBg: "bg-gradient-to-b from-orange-100/60 via-orange-50/30 to-white",
      crownColor: "text-amber-700",
    },
  }[position];

  return (
    <div
      className={`relative bg-white rounded-3xl border ${config.border} shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl`}
    >
      {/* Top Accent Header */}
      <div className={`p-4 sm:p-5 ${config.headerBg} border-b border-gray-100 text-center relative`}>
        {/* Crown for 1st */}
        {isFirst && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white p-1 rounded-full shadow-lg">
            <Crown className="w-5 h-5 fill-white" />
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${config.badgeBg}`}
          >
            <span>{config.medalEmoji}</span>
            <span>{config.title}</span>
          </span>

          <span className="text-xs font-mono font-bold text-gray-500">
            CHEST: {item.student.chest_no}
          </span>
        </div>

        {/* Avatar */}
        <div className="relative mx-auto mb-3">
          <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden p-1 shadow-md ${
              isFirst
                ? "bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500"
                : isSecond
                ? "bg-gradient-to-tr from-slate-300 via-gray-200 to-slate-400"
                : "bg-gradient-to-tr from-orange-400 via-amber-300 to-orange-600"
            }`}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
              <StudentAvatarDisplay
                src={item.student.avatar}
                name={item.student.name}
                initialsClassName="text-base font-bold text-gray-700 bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Student Name & Team */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
          {item.student.name}
        </h3>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-gray-200 text-xs font-medium text-gray-700 mt-1 shadow-sm">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.team.color }}
          />
          <span className="truncate max-w-[140px]">{item.team.name}</span>
        </div>
      </div>

      {/* Points & Stats Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Main Score Display */}
        <div className="text-center py-2 bg-gradient-to-r from-gray-50 via-amber-50/40 to-gray-50 rounded-2xl border border-gray-100">
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
            {category === "individual"
              ? "Individual Points"
              : category === "group"
              ? "Group Points"
              : "Total Points"}
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#8B4513] tracking-tight mt-0.5">
            {activeScore}
            <span className="text-xs font-normal text-gray-500 ml-1">pts</span>
          </div>
        </div>

        {/* Points breakdown */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-amber-50/60 rounded-xl p-2 border border-amber-100">
            <span className="text-gray-500 block text-[10px]">Individual</span>
            <span className="font-bold text-amber-900 text-sm">{item.individualPoints} pts</span>
          </div>
          <div className="bg-orange-50/60 rounded-xl p-2 border border-orange-100">
            <span className="text-gray-500 block text-[10px]">Group</span>
            <span className="font-bold text-orange-900 text-sm">{item.groupPoints} pts</span>
          </div>
        </div>

        {/* Medals */}
        <div className="flex items-center justify-around py-2 border-t border-b border-gray-100 text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-1" title="Gold Medals">
            <span>🥇</span>
            <span>{item.medals.gold}</span>
          </div>
          <div className="flex items-center gap-1" title="Silver Medals">
            <span>🥈</span>
            <span>{item.medals.silver}</span>
          </div>
          <div className="flex items-center gap-1" title="Bronze Medals">
            <span>🥉</span>
            <span>{item.medals.bronze}</span>
          </div>
        </div>

        {/* View Programs Button */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#8B4513] bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
        >
          <span>{isExpanded ? "Hide Won Events" : "View Won Events"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Expanded Events */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <AchievementsList item={item} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AchievementsList({ item }: { item: TopScorerItem }) {
  if (item.achievements.length === 0) {
    return <p className="text-xs text-gray-500 py-1 text-center">No program placements on record.</p>;
  }

  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
        Winning Events ({item.achievements.length}):
      </div>
      {item.achievements.map((ach, idx) => (
        <div
          key={`${ach.programId}-${idx}`}
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-gray-100 text-xs shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">
              {ach.position === 1 ? "🥇" : ach.position === 2 ? "🥈" : "🥉"}
            </span>
            <div className="min-w-0">
              <span className="font-medium text-gray-900 truncate block">
                {ach.programName}
              </span>
              <span className="text-[10px] text-gray-500">
                {ach.isGroup ? "Group Program" : "Individual Program"}
                {ach.grade && ach.grade !== "none" ? ` · Grade ${ach.grade}` : ""}
              </span>
            </div>
          </div>
          <span className="font-bold text-[#8B4513] shrink-0">+{ach.score} pts</span>
        </div>
      ))}
    </div>
  );
}
