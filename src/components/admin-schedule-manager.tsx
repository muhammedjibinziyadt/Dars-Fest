"use client";

import React, { useState, useTransition, useMemo } from "react";
import type { Program } from "@/lib/types";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Radio,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Sparkles,
  AlertCircle,
  Layers,
} from "lucide-react";
import {
  updateProgramScheduleAction,
  markProgramEndedAction,
  markProgramLiveAction,
  clearProgramScheduleAction,
} from "@/app/admin/(secure)/schedule/actions";

interface AdminScheduleManagerProps {
  programs: Program[];
}

export function AdminScheduleManager({ programs: initialPrograms }: AdminScheduleManagerProps) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "live" | "upcoming" | "ended">("all");

  // Form State for Scheduling
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState<"upcoming" | "live" | "ended">("upcoming");
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit helper: fills the form with a program's current data
  const handleEdit = (p: Program) => {
    setSelectedProgramId(p.id);
    setScheduledDate(p.scheduledDate || "");
    setScheduledTime(p.scheduledTime || "");
    setScheduleStatus(p.scheduleStatus || "upcoming");
    setFormMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save Schedule Handler
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      setFormMessage({ type: "error", text: "Please select a program first." });
      return;
    }

    startTransition(async () => {
      setFormMessage(null);
      const res = await updateProgramScheduleAction(
        selectedProgramId,
        scheduledDate,
        scheduledTime,
        scheduleStatus
      );

      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === selectedProgramId
              ? {
                  ...p,
                  scheduledDate,
                  scheduledTime,
                  scheduleStatus,
                }
              : p
          )
        );
        setFormMessage({ type: "success", text: "Schedule updated successfully!" });
        // Clear selection after 2s
        setTimeout(() => setFormMessage(null), 3500);
      } else {
        setFormMessage({ type: "error", text: res.error || "Failed to update schedule." });
      }
    });
  };

  // Quick Action: Mark as Ended
  const handleMarkEnded = (programId: string) => {
    startTransition(async () => {
      const res = await markProgramEndedAction(programId);
      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) => (p.id === programId ? { ...p, scheduleStatus: "ended" } : p))
        );
      }
    });
  };

  // Quick Action: Mark as Live
  const handleMarkLive = (programId: string) => {
    startTransition(async () => {
      const res = await markProgramLiveAction(programId);
      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) => (p.id === programId ? { ...p, scheduleStatus: "live" } : p))
        );
      }
    });
  };

  // Quick Action: Clear Schedule
  const handleClearSchedule = (programId: string) => {
    if (!confirm("Are you sure you want to remove the schedule for this program?")) return;
    startTransition(async () => {
      const res = await clearProgramScheduleAction(programId);
      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === programId
              ? { ...p, scheduledDate: "", scheduledTime: "", scheduleStatus: "upcoming" }
              : p
          )
        );
      }
    });
  };

  // Format Helpers
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "Not set";
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

  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return "Not set";
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

  // Statistics
  const stats = useMemo(() => {
    let live = 0;
    let upcoming = 0;
    let ended = 0;
    let scheduled = 0;

    programs.forEach((p) => {
      if (p.scheduledDate || p.scheduledTime) scheduled++;
      const s = p.scheduleStatus || "upcoming";
      if (s === "live") live++;
      else if (s === "ended") ended++;
      else upcoming++;
    });

    return { total: programs.length, scheduled, live, upcoming, ended };
  }, [programs]);

  // Filtered List
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!p.name.toLowerCase().includes(q) && !p.section.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (filterStatus === "scheduled") {
        if (!p.scheduledDate && !p.scheduledTime) return false;
      } else if (filterStatus === "live") {
        if (p.scheduleStatus !== "live") return false;
      } else if (filterStatus === "upcoming") {
        if (p.scheduleStatus && p.scheduleStatus !== "upcoming") return false;
      } else if (filterStatus === "ended") {
        if (p.scheduleStatus !== "ended") return false;
      }

      return true;
    });
  }, [programs, searchQuery, filterStatus]);

  return (
    <div className="space-y-8 text-white">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-white/50 font-medium">Total Events</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-emerald-400 font-medium">Live Now</p>
            <p className="text-2xl font-bold text-emerald-300 mt-0.5">{stats.live}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-amber-400 font-medium">Upcoming</p>
            <p className="text-2xl font-bold text-amber-300 mt-0.5">{stats.upcoming}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400 font-medium">Ended / Completed</p>
            <p className="text-2xl font-bold text-slate-300 mt-0.5">{stats.ended}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Schedule Setter Form */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {selectedProgramId ? "Edit Program Schedule" : "Schedule a Program"}
            </h2>
            <p className="text-xs text-white/60">
              Select any program to set its scheduled date, time, and live status
            </p>
          </div>
        </div>

        {formMessage && (
          <div
            className={`mb-5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm ${
              formMessage.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/15 border-red-500/30 text-red-300"
            }`}
          >
            {formMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{formMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Select Program */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-white/80">Select Program</label>
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProgramId(id);
                  const p = programs.find((item) => item.id === id);
                  if (p) {
                    setScheduledDate(p.scheduledDate || "");
                    setScheduledTime(p.scheduledTime || "");
                    setScheduleStatus(p.scheduleStatus || "upcoming");
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 outline-none"
              >
                <option value="">-- Choose a Program --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 outline-none"
              />
            </div>

            {/* Time Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">Scheduled Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 outline-none"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">Program Status</label>
              <select
                value={scheduleStatus}
                onChange={(e) => setScheduleStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 outline-none"
              >
                <option value="upcoming">Upcoming (വരാനിരിക്കുന്നു)</option>
                <option value="live">Live Now (നടന്നുകൊണ്ടിരിക്കുന്നു)</option>
                <option value="ended">Ended (കഴിഞ്ഞു)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || !selectedProgramId}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {isPending ? "Saving..." : "Save Program Schedule"}
            </button>

            {selectedProgramId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProgramId("");
                  setScheduledDate("");
                  setScheduledTime("");
                  setScheduleStatus("upcoming");
                  setFormMessage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs transition-colors"
              >
                Cancel Selection
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Program Schedule List & One-Click Control */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">All Festival Programs</h3>
            <p className="text-xs text-white/60">
              Manage schedules and quickly toggle live/ended state with one click
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm placeholder-white/40 focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {(
            [
              { key: "all", label: `All (${programs.length})` },
              { key: "scheduled", label: `Scheduled (${stats.scheduled})` },
              { key: "live", label: `Live Now (${stats.live})` },
              { key: "upcoming", label: `Upcoming (${stats.upcoming})` },
              { key: "ended", label: `Ended (${stats.ended})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === item.key
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Programs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Program Name</th>
                <th className="py-3 px-3">Section</th>
                <th className="py-3 px-3">Scheduled Date</th>
                <th className="py-3 px-3">Scheduled Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    No programs found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((p) => {
                  const status = p.scheduleStatus || "upcoming";
                  const isLive = status === "live";
                  const isEnded = status === "ended";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {p.name}
                        {p.stage && (
                          <span className="ml-2 text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                            Stage
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-white/70 uppercase text-xs">
                        {p.section}
                      </td>
                      <td className="py-3.5 px-3 text-white/80">
                        {p.scheduledDate ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            {formatDateDisplay(p.scheduledDate)}
                          </span>
                        ) : (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-white/80">
                        {p.scheduledTime ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {formatTimeDisplay(p.scheduledTime)}
                          </span>
                        ) : (
                          <span className="text-white/30 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Now
                          </span>
                        ) : isEnded ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/60 border border-white/15">
                            <CheckCircle2 className="w-3 h-3 text-white/50" />
                            Ended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Upcoming
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* One-Click: Mark as Ended */}
                          {!isEnded && (
                            <button
                              onClick={() => handleMarkEnded(p.id)}
                              disabled={isPending}
                              title="Mark as Ended"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs flex items-center gap-1 border border-white/10 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden md:inline">Mark Ended</span>
                            </button>
                          )}

                          {/* One-Click: Set Live */}
                          {!isLive && (
                            <button
                              onClick={() => handleMarkLive(p.id)}
                              disabled={isPending}
                              title="Set Live Now"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs flex items-center gap-1 border border-emerald-500/30 transition-colors"
                            >
                              <Radio className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden md:inline">Go Live</span>
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => handleEdit(p)}
                            title="Edit schedule"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                          </button>

                          {/* Clear Schedule */}
                          {(p.scheduledDate || p.scheduledTime) && (
                            <button
                              onClick={() => handleClearSchedule(p.id)}
                              title="Clear schedule"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
