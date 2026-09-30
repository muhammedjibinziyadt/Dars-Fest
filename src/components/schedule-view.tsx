"use client";

import React, { useState, useMemo } from "react";
import type { Program } from "@/lib/types";
import { Search, Calendar, Clock, CheckCircle2, Radio, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleViewProps {
  programs: Program[];
}

export function ScheduleView({ programs }: ScheduleViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "live" | "ended">("all");

  // Format date helper
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "TBA";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format time helper (e.g. "14:30" to "2:30 PM")
  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return "TBA";
    try {
      const [hStr, mStr] = timeStr.split(":");
      const h = parseInt(hStr, 10);
      if (isNaN(h)) return timeStr;
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${mStr || "00"} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Extract all unique dates from programs for the Date dropdown
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    programs.forEach((p) => {
      if (p.scheduledDate && p.scheduledDate.trim()) {
        dates.add(p.scheduledDate);
      }
    });
    return Array.from(dates).sort();
  }, [programs]);

  // Today string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);

  // Filtered programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      // 1. Search by program name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = program.name.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // 2. Filter by date
      if (selectedDate !== "all") {
        if (selectedDate === "today") {
          if (program.scheduledDate !== todayStr) return false;
        } else {
          if (program.scheduledDate !== selectedDate) return false;
        }
      }

      // 3. Filter by status (upcoming, live, ended)
      const currentStatus = program.scheduleStatus || "upcoming";
      if (statusFilter !== "all") {
        if (currentStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [programs, searchQuery, selectedDate, statusFilter, todayStr]);

  // Quick counts
  const counts = useMemo(() => {
    let upcoming = 0;
    let live = 0;
    let ended = 0;
    programs.forEach((p) => {
      const s = p.scheduleStatus || "upcoming";
      if (s === "live") live++;
      else if (s === "ended") ended++;
      else upcoming++;
    });
    return { all: programs.length, upcoming, live, ended };
  }, [programs]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge className="bg-amber-100 text-amber-900 border-amber-200 px-3 py-1 text-xs sm:text-sm font-semibold">
          Festival Program Schedule · സമയക്രമം
        </Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#8B4513] font-bold tracking-tight">
          Event Schedule
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Track upcoming performances, live events, and completed programs
        </p>
      </div>

      {/* Search & Filters Container (Matching Image 2 Sample) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search by Program Name */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513] text-sm text-gray-900 placeholder-gray-400 outline-none transition-all bg-gray-50/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative min-w-[200px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-[#8B4513] text-sm text-gray-900 bg-gray-50/50 focus:bg-white outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              {availableDates.includes(todayStr) && (
                <option value="today">Today</option>
              )}
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateDisplay(d)}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Status Filter Chips (All, Upcoming, Live, Ended) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#8B4513] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter("upcoming")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "upcoming"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>

          <button
            onClick={() => setStatusFilter("live")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === "live"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Now ({counts.live})
          </button>

          <button
            onClick={() => setStatusFilter("ended")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === "ended"
                ? "bg-gray-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ended ({counts.ended})
          </button>
        </div>
      </div>

      {/* Program Grid (Matching Image 2 Card Style) */}
      {filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-800">
            No matching programs found
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Try adjusting your search query or switching date/status filters.
          </p>
          {(searchQuery || selectedDate !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDate("all");
                setStatusFilter("all");
              }}
              className="text-sm text-[#8B4513] font-medium hover:underline pt-2 inline-block"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {filteredPrograms.map((program) => {
            const status = program.scheduleStatus || "upcoming";
            const isLive = status === "live";
            const isEnded = status === "ended";

            return (
              <div
                key={program.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
              >
                {/* Header: Program Name & Category Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug">
                      {program.name}
                    </h3>
                    <span className="shrink-0 text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {program.section}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">
                    {program.stage ? "Stage Performance" : "Off-Stage Program"}
                  </p>
                </div>

                {/* Scheduled Date & Time Row (Image 2 style) */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                  {/* Date */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-[#8B4513] flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 block uppercase font-medium">Date</span>
                      <span className="text-xs font-semibold text-gray-800 truncate block">
                        {formatDateDisplay(program.scheduledDate)}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-100/70 text-cyan-800 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 block uppercase font-medium">Time</span>
                      <span className="text-xs font-semibold text-gray-800 truncate block">
                        {formatTimeDisplay(program.scheduledTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Footer Badge */}
                <div className="flex items-center justify-between pt-1">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Now · നടന്നുകൊണ്ടിരിക്കുന്നു
                    </span>
                  ) : isEnded ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                      Program Ended · കഴിഞ്ഞു
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Upcoming · വരാനിരിക്കുന്നു
                    </span>
                  )}

                  <span className="text-[11px] text-gray-400 font-medium">
                    {program.stage ? "Stage" : "Non-stage"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
