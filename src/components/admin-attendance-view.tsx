"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Search,
  Printer,
  Users,
  RotateCcw,
  Check,
  Camera,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmbeddedQRScanner } from "@/components/embedded-qr-scanner";
import type {
  Program,
  ProgramRegistration,
  Student,
  Team,
  AttendanceRecord,
} from "@/lib/types";

interface AdminAttendanceViewProps {
  programs: Program[];
  registrations: ProgramRegistration[];
  students: Student[];
  teams: Team[];
  initialAttendance: AttendanceRecord[];
}

interface ParticipantAttendanceItem {
  registrationId: string;
  studentId: string;
  studentName: string;
  studentChest: string;
  teamId: string;
  teamName: string;
  teamColor?: string;
  avatar?: string;
  isPresent: boolean;
  markedAt?: string;
  markedBy?: string;
}

interface ScanNotification {
  type: "success" | "already" | "not_registered" | "not_found" | "error";
  title: string;
  message: string;
  student?: {
    name: string;
    chest_no: string;
    avatar?: string;
    teamName?: string;
    teamColor?: string;
  };
  timestamp: string;
}

// Web Audio API synthesiser for clean zero-dependency sound effects
function playScanSound(type: "success" | "already" | "error" = "success") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "success") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === "already") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio policy issues
  }
}

export function AdminAttendanceView({
  programs,
  registrations,
  students,
  teams,
  initialAttendance,
}: AdminAttendanceViewProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs.length > 0 ? programs[0].id : ""
  );
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualChestInput, setManualChestInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "present" | "absent">("all");
  const [lastNotification, setLastNotification] = useState<ScanNotification | null>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  // Auto-dismiss notification banner after 4 seconds
  useEffect(() => {
    if (!lastNotification) return;
    const timer = setTimeout(() => {
      setLastNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [lastNotification]);

  // Lookup maps
  const studentMap = useMemo(() => {
    return new Map<string, Student>(students.map((s) => [s.id, s]));
  }, [students]);

  const teamMap = useMemo(() => {
    return new Map<string, Team>(teams.map((t) => [t.id, t]));
  }, [teams]);

  // Selected program details
  const currentProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId);
  }, [programs, selectedProgramId]);

  // Filtered program dropdown
  const filteredPrograms = useMemo(() => {
    if (sectionFilter === "all") return programs;
    return programs.filter((p) => p.section === sectionFilter);
  }, [programs, sectionFilter]);

  // Attendance map for selected program
  const programAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of attendanceRecords) {
      if (record.programId === selectedProgramId) {
        map.set(record.studentId, record);
      }
    }
    return map;
  }, [attendanceRecords, selectedProgramId]);

  // Base registered candidates for selected program
  const participants = useMemo<ParticipantAttendanceItem[]>(() => {
    if (!selectedProgramId) return [];

    const programRegs = registrations.filter((r) => r.programId === selectedProgramId);

    return programRegs.map((reg, idx) => {
      const student = studentMap.get(reg.studentId);
      const chestNo =
        reg.studentChest?.trim() ||
        student?.chest_no?.trim() ||
        `P${idx + 1}`;

      const team = student?.team_id ? teamMap.get(student.team_id) : undefined;
      const attRecord = programAttendanceMap.get(reg.studentId);
      const isPresent = attRecord?.status === "present";

      return {
        registrationId: reg.id,
        studentId: reg.studentId,
        studentName: reg.studentName || student?.name || "Participant",
        studentChest: chestNo.toUpperCase(),
        teamId: reg.teamId,
        teamName: reg.teamName || team?.name || "Team",
        teamColor: team?.color || "#0ea5e9",
        avatar: student?.avatar,
        isPresent,
        markedAt: attRecord?.markedAt,
        markedBy: attRecord?.markedBy,
      };
    });
  }, [selectedProgramId, registrations, studentMap, teamMap, programAttendanceMap]);

  // Metrics
  const totalCount = participants.length;
  const presentCount = participants.filter((p) => p.isPresent).length;
  const absentCount = totalCount - presentCount;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered displayed list based on search and tab
  const displayedParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (activeTab === "present" && !p.isPresent) return false;
      if (activeTab === "absent" && p.isPresent) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = p.studentName.toLowerCase().includes(q);
        const chestMatch = p.studentChest.toLowerCase().includes(q);
        const teamMatch = p.teamName.toLowerCase().includes(q);
        return nameMatch || chestMatch || teamMatch;
      }

      return true;
    });
  }, [participants, activeTab, searchQuery]);

  // Handle Scanning QR Code or Chest Number
  const handleQRScan = async (scannedCode: string) => {
    if (!selectedProgramId || isProcessing) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan",
          programId: selectedProgramId,
          scannedCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const isAlready = data.alreadyMarked;

        playScanSound(isAlready ? "already" : "success");

        if (!isAlready && data.record) {
          setAttendanceRecords((prev) => {
            const filtered = prev.filter(
              (r) => !(r.programId === selectedProgramId && r.studentId === data.record.studentId)
            );
            return [...filtered, data.record];
          });
        }

        if (data.student?.id) {
          setHighlightedStudentId(data.student.id);
          setTimeout(() => setHighlightedStudentId(null), 3000);
        }

        setLastNotification({
          type: isAlready ? "already" : "success",
          title: isAlready ? "Already Marked" : "Checked In!",
          message: data.message,
          student: data.student,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        playScanSound("error");
        setLastNotification({
          type: data.reason === "not_registered" ? "not_registered" : "not_found",
          title: data.reason === "not_registered" ? "Not Registered" : "Student Not Found",
          message: data.message || "Code could not be verified.",
          student: data.student,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } catch (err: unknown) {
      console.error("Scan processing error:", err);
      playScanSound("error");
      setLastNotification({
        type: "error",
        title: "Scan Error",
        message: (err as Error)?.message || "Failed to communicate with server.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual Chest Number Entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChestInput.trim()) return;
    handleQRScan(manualChestInput.trim());
    setManualChestInput("");
  };

  // Toggle Single Student Attendance Manually
  const handleToggleAttendance = async (participant: ParticipantAttendanceItem) => {
    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          programId: selectedProgramId,
          studentId: participant.studentId,
          studentChest: participant.studentChest,
          studentName: participant.studentName,
          teamId: participant.teamId,
          teamName: participant.teamName,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.record) {
        setAttendanceRecords((prev) => {
          const filtered = prev.filter(
            (r) => !(r.programId === selectedProgramId && r.studentId === participant.studentId)
          );
          return [...filtered, data.record];
        });

        const newStatus = data.record.status === "present";
        playScanSound(newStatus ? "success" : "already");

        setLastNotification({
          type: "success",
          title: newStatus ? "Marked Present" : "Marked Absent",
          message: `${participant.studentName} marked ${newStatus ? "PRESENT" : "ABSENT"}.`,
          student: {
            name: participant.studentName,
            chest_no: participant.studentChest,
            avatar: participant.avatar,
            teamName: participant.teamName,
            teamColor: participant.teamColor,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } catch (err: unknown) {
      console.error("Failed to toggle attendance:", err);
    }
  };

  // Mark All Students Present
  const handleMarkAll = async (status: "present" | "absent") => {
    const confirmMsg =
      status === "present"
        ? `Mark all ${participants.length} students as PRESENT for this program?`
        : `Mark all students as ABSENT?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_all",
          programId: selectedProgramId,
          status,
          students: participants.map((p) => ({
            studentId: p.studentId,
            studentChest: p.studentChest,
            studentName: p.studentName,
            teamId: p.teamId,
            teamName: p.teamName,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.records) {
        setAttendanceRecords((prev) => {
          const filtered = prev.filter((r) => r.programId !== selectedProgramId);
          return [...filtered, ...data.records];
        });
        playScanSound("success");
      }
    } catch (err) {
      console.error("Batch mark error:", err);
    }
  };

  // Reset Program Attendance
  const handleResetAttendance = async () => {
    if (!window.confirm("Clear all attendance check-ins for this program?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear",
          programId: selectedProgramId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceRecords((prev) => prev.filter((r) => r.programId !== selectedProgramId));
        setLastNotification(null);
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  // Print Official Attendance Call Sheet
  const handlePrint = () => {
    if (!currentProgram || participants.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the attendance call sheet.");
      return;
    }

    const rowsHtml = participants
      .map(
        (p, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold; font-size: 13px;">#${idx + 1}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 14px;">${p.studentChest}</td>
          <td style="font-weight: 600; font-size: 13px;">${p.studentName}</td>
          <td style="font-size: 12px;">${p.teamName}</td>
          <td style="text-align: center; font-weight: bold; font-size: 12px; color: ${
            p.isPresent ? "#059669" : "#dc2626"
          };">
            ${p.isPresent ? "✓ PRESENT" : "✗ ABSENT"}
          </td>
          <td style="width: 130px; border-bottom: 1px dashed #94a3b8; text-align: center; font-size: 11px; color: #64748b;">
            ${p.markedAt ? new Date(p.markedAt).toLocaleTimeString() : ""}
          </td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance - ${currentProgram.name} - Maerika 2k26</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #111;
              margin: 0;
              padding: 10px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title { font-size: 22px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 12px; color: #475569; margin-top: 4px; text-transform: uppercase; }
            .prog-box {
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .prog-name { font-size: 16px; font-weight: bold; }
            .prog-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
            .stats { text-align: right; font-size: 15px; font-weight: bold; color: #059669; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }
            th { background-color: #f1f5f9; text-transform: uppercase; font-size: 11px; }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MAERIKA 2K26</h1>
            <div class="subtitle">PARTICIPANT ATTENDANCE & VERIFICATION CALL SHEET</div>
          </div>
          <div class="prog-box">
            <div>
              <div class="prog-name">${currentProgram.name}</div>
              <div class="prog-meta">Section: ${currentProgram.section.toUpperCase()} • ${currentProgram.stage ? "ON STAGE" : "OFF STAGE"}</div>
            </div>
            <div class="stats">${presentCount} / ${totalCount} Present (${attendancePercentage}%)</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="width: 90px; text-align: center;">Chest No</th>
                <th>Student Name</th>
                <th>Team</th>
                <th style="width: 100px; text-align: center;">Status</th>
                <th style="width: 130px; text-align: center;">Check-in / Signature</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <span>Printed on: ${new Date().toLocaleString()}</span>
            <span>Stage Official Signature: _______________________</span>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-4">
      {/* Sleek Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-400" />
            Program Attendance
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Select a program, mark check-ins, or scan participant QR badges.
          </p>
        </div>

        {/* Quick Header Stats & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compact Attendance Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-xs font-semibold shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                presentCount === totalCount && totalCount > 0
                  ? "bg-emerald-400"
                  : presentCount > 0
                  ? "bg-amber-400"
                  : "bg-white/30"
              }`}
            />
            <span className="text-white">
              <strong className="text-emerald-400 font-bold">{presentCount}</strong> / {totalCount} Present
            </span>
            <span className="text-white/40 font-mono text-[11px]">({attendancePercentage}%)</span>
          </div>

          {/* Scan QR Button */}
          <Button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl px-3.5 shadow-md shadow-emerald-500/20"
          >
            <Camera className="h-3.5 w-3.5" />
            Scan QR
          </Button>

          {/* Mark All Present */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("present")}
            disabled={totalCount === 0 || presentCount === totalCount}
            className="border-white/15 text-white/80 hover:text-white hover:bg-white/10 text-xs gap-1.5 rounded-xl"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Mark All
          </Button>

          {/* Reset */}
          {presentCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetAttendance}
              className="text-white/50 hover:text-white text-xs gap-1.5 rounded-xl"
              title="Clear all check-ins for this program"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}

          {/* Print Sheet */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={totalCount === 0}
            className="border-white/15 text-white/80 hover:text-white hover:bg-white/10 text-xs gap-1.5 rounded-xl"
            title="Print official call sheet"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Program Selector & Quick Action Controls Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3.5 sm:p-4 backdrop-blur-sm space-y-3 shadow-lg">
        {/* Row 1: Section Filter Pills + Program Select Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Section Pills */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            {[
              { value: "all", label: "All" },
              { value: "single", label: "Single" },
              { value: "group", label: "Group" },
              { value: "general", label: "General" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSectionFilter(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sectionFilter === opt.value
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Program Select Dropdown */}
          <div className="relative flex-1">
            <select
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value);
                setSearchQuery("");
                setLastNotification(null);
              }}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer pr-10"
            >
              {filteredPrograms.map((p) => {
                const regCount = registrations.filter((r) => r.programId === p.id).length;
                return (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name} ({p.section.toUpperCase()} • {p.stage ? "On Stage" : "Off Stage"} • {regCount} candidates)
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Row 2: Fast Chest Number Input + Filter Tabs + Search */}
        <div className="pt-2 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Chest Check-in Input */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/40">
                #
              </span>
              <input
                type="text"
                value={manualChestInput}
                onChange={(e) => setManualChestInput(e.target.value)}
                placeholder="Type chest # (e.g. RA001) & press Enter..."
                className="w-full rounded-xl border border-white/15 bg-white/5 pl-7 pr-3 py-1.5 text-xs text-white placeholder-white/40 font-mono uppercase focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!manualChestInput.trim() || isProcessing}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl px-3 py-1.5 h-auto shrink-0 shadow-sm"
            >
              Check In
            </Button>
          </form>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all" ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("present")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "present"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-emerald-400/70 hover:text-emerald-300"
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("absent")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "absent"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-amber-400/70 hover:text-amber-300"
                }`}
              >
                Pending ({absentCount})
              </button>
            </div>

            {/* Candidate Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name or chest..."
                className="w-full sm:w-44 rounded-xl border border-white/15 bg-white/5 pl-8 pr-3 py-1 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Inline Quick Scan Toast Notification */}
      {lastNotification && (
        <div
          className={`rounded-2xl border px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-md transition-all animate-in fade-in duration-200 ${
            lastNotification.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : lastNotification.type === "already"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {lastNotification.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            {lastNotification.type === "already" && (
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            {lastNotification.type !== "success" && lastNotification.type !== "already" && (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className="font-bold">{lastNotification.title}:</span>
            <span className="truncate opacity-90">{lastNotification.message}</span>
            {lastNotification.student && (
              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0">
                #{lastNotification.student.chest_no}
              </span>
            )}
          </div>
          <button
            onClick={() => setLastNotification(null)}
            className="p-1 text-white/50 hover:text-white rounded-md shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Simplified Clean Roster Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden backdrop-blur-sm shadow-xl">
        {displayedParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-white/50">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-32">Chest No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 w-36">Check-in Time</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {displayedParticipants.map((p, idx) => {
                  const isHighlighted = highlightedStudentId === p.studentId;
                  return (
                    <tr
                      key={p.registrationId}
                      className={`transition-colors duration-200 ${
                        isHighlighted
                          ? "bg-emerald-500/20 ring-1 ring-inset ring-emerald-400"
                          : p.isPresent
                          ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-mono text-white/40">
                        {idx + 1}
                      </td>

                      {/* Chest No */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          #{p.studentChest}
                        </span>
                      </td>

                      {/* Student Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.avatar}
                              alt={p.studentName}
                              className="h-8 w-8 rounded-full object-cover border border-white/20 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div
                              className="h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                              style={{
                                backgroundColor: `${p.teamColor}33`,
                                borderColor: `${p.teamColor}66`,
                              }}
                            >
                              {p.studentName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-white truncate max-w-xs">
                            {p.studentName}
                          </span>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium border text-white/90 truncate max-w-[150px]"
                          style={{
                            backgroundColor: `${p.teamColor}22`,
                            borderColor: `${p.teamColor}55`,
                          }}
                        >
                          {p.teamName}
                        </span>
                      </td>

                      {/* Check-in Time */}
                      <td className="py-3 px-4 text-white/60 font-mono text-[11px]">
                        {p.isPresent && p.markedAt ? (
                          <span className="text-emerald-400/90 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(p.markedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {p.isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Check className="h-3 w-3 stroke-[3]" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-white/40 border border-white/10">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Single Action Toggle Button */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={p.isPresent ? "ghost" : "default"}
                          onClick={() => handleToggleAttendance(p)}
                          className={`rounded-xl text-xs font-semibold px-3 py-1 h-auto transition-all ${
                            p.isPresent
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-sm shadow-emerald-500/20"
                          }`}
                        >
                          {p.isPresent ? "Mark Absent" : "Mark Present"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="mx-auto h-10 w-10 text-white/20 mb-2" />
            <h4 className="text-sm font-bold text-white">No Students Found</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No candidates matching "${searchQuery}".`
                : activeTab !== "all"
                ? `No ${activeTab} candidates for this program.`
                : "No students registered for this program."}
            </p>
          </div>
        )}
      </div>

      {/* QR Code Scanner Dedicated Modal */}
      <Modal
        open={isScannerOpen}
        title="Scan Participant QR Code"
        onClose={() => setIsScannerOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/60">
            Align candidate ID card QR code in front of camera to automatically verify and check in.
          </p>

          <EmbeddedQRScanner
            onScan={handleQRScan}
            isScanning={isScannerOpen}
            isProcessing={isProcessing}
            hideHeader
          />

          {/* Live scan feedback inside modal */}
          {lastNotification && (
            <div
              className={`rounded-xl p-3 text-xs border flex items-center gap-2.5 transition-all ${
                lastNotification.type === "success"
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                  : lastNotification.type === "already"
                  ? "border-amber-500/40 bg-amber-500/20 text-amber-200"
                  : "border-red-500/40 bg-red-500/20 text-red-200"
              }`}
            >
              {lastNotification.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
              {lastNotification.type === "already" && (
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              {lastNotification.type !== "success" && lastNotification.type !== "already" && (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{lastNotification.title}</p>
                <p className="opacity-80 text-[11px] truncate">{lastNotification.message}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(false)}
              className="rounded-xl border-white/20 text-white text-xs px-4 hover:bg-white/10"
            >
              Done Scanning
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
