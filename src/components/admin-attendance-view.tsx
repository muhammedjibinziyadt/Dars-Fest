"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  CheckCircle2,
  Clock,
  Search,
  Printer,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  RotateCcw,
  Check,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Web Audio API synthesiser for clean, zero-dependency sound effects
function playScanSound(type: "success" | "already" | "error" = "success") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "success") {
      // Pleasant high-pitch two-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6

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
      // Warm alert tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Low buzzer
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
    // Ignore audio policy errors
  }
}

export function AdminAttendanceView({
  programs,
  registrations,
  students,
  teams,
  initialAttendance,
}: AdminAttendanceViewProps) {
  // State for active program
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs.length > 0 ? programs[0].id : ""
  );
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualChestInput, setManualChestInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "present" | "absent">("all");
  const [lastNotification, setLastNotification] = useState<ScanNotification | null>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  const rosterContainerRef = useRef<HTMLDivElement>(null);

  // Lookup maps for fast access
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
        teamName: reg.teamName || team?.name || "Unknown Squad",
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
      // Tab filter
      if (activeTab === "present" && !p.isPresent) return false;
      if (activeTab === "absent" && p.isPresent) return false;

      // Search query filter
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

  // Handle Scanning QR Code
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

        // Play appropriate chime
        playScanSound(isAlready ? "already" : "success");

        // Optimistically update attendance state
        if (!isAlready && data.record) {
          setAttendanceRecords((prev) => {
            const filtered = prev.filter(
              (r) => !(r.programId === selectedProgramId && r.studentId === data.record.studentId)
            );
            return [...filtered, data.record];
          });
        }

        // Highlight student card
        if (data.student?.id) {
          setHighlightedStudentId(data.student.id);
          setTimeout(() => setHighlightedStudentId(null), 3500);
        }

        setLastNotification({
          type: isAlready ? "already" : "success",
          title: isAlready ? "Already Marked Present" : "Verified & Marked Present!",
          message: data.message,
          student: data.student,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });
      } else {
        // Error or Not Registered
        playScanSound("error");
        setLastNotification({
          type: data.reason === "not_registered" ? "not_registered" : "not_found",
          title: data.reason === "not_registered" ? "Not Registered For This Program" : "Student Not Found",
          message: data.message || "Scanned code could not be verified.",
          student: data.student,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });
      }
    } catch (err: unknown) {
      console.error("Scan processing error:", err);
      playScanSound("error");
      setLastNotification({
        type: "error",
        title: "Scan Error",
        message: (err as Error)?.message || "Failed to communicate with attendance server.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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

  // Mark All Students
  const handleMarkAll = async (status: "present" | "absent") => {
    const confirmMsg = status === "present"
      ? `Are you sure you want to mark all ${participants.length} students as PRESENT for this program?`
      : `Are you sure you want to mark all students as ABSENT?`;

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
    if (!window.confirm("Reset all attendance records for this program? This will clear all present check-ins.")) {
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
          <td style="text-align: center; font-weight: bold; font-size: 14px;">
            #${idx + 1}
          </td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 15px;">
            ${p.studentChest}
          </td>
          <td style="font-weight: 600; font-size: 14px;">
            ${p.studentName}
          </td>
          <td style="font-size: 13px;">
            ${p.teamName}
          </td>
          <td style="text-align: center; font-weight: bold; font-size: 13px; color: ${
            p.isPresent ? "#059669" : "#dc2626"
          };">
            ${p.isPresent ? "✓ PRESENT" : "✗ ABSENT"}
          </td>
          <td style="width: 140px; border-bottom: 1px dashed #94a3b8; text-align: center; font-size: 11px; color: #64748b;">
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
            .title {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 1px;
              margin: 0;
            }
            .subtitle {
              font-size: 13px;
              color: #475569;
              margin-top: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .prog-box {
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .prog-name {
              font-size: 18px;
              font-weight: bold;
            }
            .prog-meta {
              font-size: 12px;
              color: #64748b;
              margin-top: 2px;
            }
            .stats {
              text-align: right;
            }
            .stat-badge {
              font-size: 16px;
              font-weight: bold;
              color: #059669;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              font-size: 13px;
            }
            th {
              background-color: #e2e8f0;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MAERIKA 2K26</h1>
            <div class="subtitle">OFFICIAL PARTICIPANT ATTENDANCE & VERIFICATION CALL SHEET</div>
          </div>

          <div class="prog-box">
            <div>
              <div class="prog-name">${currentProgram.name}</div>
              <div class="prog-meta">
                Section: ${currentProgram.section.toUpperCase()} • ${currentProgram.stage ? "ON STAGE" : "OFF STAGE"}
              </div>
            </div>
            <div class="stats">
              <div class="stat-badge">${presentCount} / ${totalCount} Present (${attendancePercentage}%)</div>
              <div class="prog-meta">Verified via QR Scanner</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">#</th>
                <th style="width: 100px; text-align: center;">Chest No</th>
                <th>Student Name</th>
                <th>Team</th>
                <th style="width: 110px; text-align: center;">Status</th>
                <th style="width: 140px; text-align: center;">Check-in Time / Sign</th>
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
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 shrink-0">
              <UserCheck className="h-8 w-8 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Stage Verification · Live Gatekeeper
                </span>
                <Badge tone="emerald" className="text-xs px-2.5 py-0.5">
                  Instant QR Scanner
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Program Attendance
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                Select a program, inspect participating candidates, and scan their ID card QR codes to verify and mark attendance instantly.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pods */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center">
              <span className="text-xs font-semibold text-emerald-200/80 uppercase">Present</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-0.5">
                {presentCount}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-center">
              <span className="text-xs font-semibold text-amber-200/80 uppercase">Absent / Pending</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                {absentCount}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="flex-1 h-3 rounded-full bg-slate-950/60 overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-md shadow-emerald-500/30"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-300 shrink-0 font-mono">
              {attendancePercentage}% Checked In
            </span>
          </div>

          <div className="text-xs text-white/50">
            Total Candidates: <strong className="text-white font-bold">{totalCount}</strong>
          </div>
        </div>
      </div>

      {/* Program Selector & Section Filter */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Section Filter Pills */}
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
              Filter by Section:
            </label>
            <div className="flex flex-wrap gap-1.5">
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
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    sectionFilter === opt.value
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Program Select Dropdown */}
          <div className="md:col-span-8">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
              Select Program ({filteredPrograms.length} available):
            </label>
            <div className="relative">
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setSearchQuery("");
                  setLastNotification(null);
                }}
                className="w-full appearance-none rounded-2xl border border-white/20 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 cursor-pointer pr-10"
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
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Selected Program Bar & Batch Buttons */}
        {currentProgram && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Active Program</p>
              <h2 className="text-xl font-bold text-white mt-0.5">{currentProgram.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                <span className="capitalize font-semibold text-emerald-300">{currentProgram.section} Event</span>
                <span>•</span>
                <span>{currentProgram.stage ? "On Stage" : "Off Stage"}</span>
                <span>•</span>
                <span>{totalCount} participating candidate(s)</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("present")}
                disabled={totalCount === 0}
                className="gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark All Present
              </Button>

              {presentCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAttendance}
                  className="gap-1.5 border-white/15 text-white/60 hover:text-white hover:bg-white/10"
                  title="Clear all present check-ins for this program"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={totalCount === 0}
                className="gap-1.5 border-white/15 text-white hover:bg-white/10"
              >
                <Printer className="h-4 w-4" />
                Print Call Sheet
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: QR Scanner & Scan Results + Candidate Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Scanner & Live Verification Card (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scanner Card */}
          <EmbeddedQRScanner
            onScan={handleQRScan}
            isScanning={isScanning}
            onToggleScanning={() => setIsScanning((prev) => !prev)}
            isProcessing={isProcessing}
          />

          {/* Manual Chest Number Entry Bar */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Manual Chest Entry Backup
            </h4>
            <p className="text-xs text-white/50">
              If camera is unavailable or ID badge is unreadable, type the chest number to verify and check in:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualChestInput}
                onChange={(e) => setManualChestInput(e.target.value)}
                placeholder="e.g. RA001"
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/40 font-mono uppercase focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <Button
                type="submit"
                disabled={!manualChestInput.trim() || isProcessing}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl px-4 text-xs shrink-0"
              >
                Check In
              </Button>
            </form>
          </div>

          {/* Last Scan Feedback Notification Alert */}
          {lastNotification && (
            <div
              className={`rounded-3xl border p-5 backdrop-blur-sm shadow-xl transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${
                lastNotification.type === "success"
                  ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-900 shadow-emerald-500/10"
                  : lastNotification.type === "already"
                  ? "border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 shadow-amber-500/10"
                  : "border-red-500/40 bg-gradient-to-br from-red-500/20 via-slate-900 to-slate-900 shadow-red-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {lastNotification.type === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  )}
                  {lastNotification.type === "already" && (
                    <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                  )}
                  {(lastNotification.type === "not_registered" ||
                    lastNotification.type === "not_found" ||
                    lastNotification.type === "error") && (
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  )}
                  <h4
                    className={`font-black text-sm tracking-tight ${
                      lastNotification.type === "success"
                        ? "text-emerald-300"
                        : lastNotification.type === "already"
                        ? "text-amber-300"
                        : "text-red-300"
                    }`}
                  >
                    {lastNotification.title}
                  </h4>
                </div>
                <span className="text-[10px] text-white/40 font-mono">
                  {lastNotification.timestamp}
                </span>
              </div>

              {/* Student details if available */}
              {lastNotification.student ? (
                <div className="mt-3.5 flex items-center gap-3.5 p-3 rounded-2xl bg-black/30 border border-white/10">
                  {lastNotification.student.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lastNotification.student.avatar}
                      alt={lastNotification.student.name}
                      className="h-12 w-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {lastNotification.student.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-white/70">
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        #{lastNotification.student.chest_no}
                      </span>
                      {lastNotification.student.teamName && (
                        <span>• {lastNotification.student.teamName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="mt-3 text-xs text-white/80 leading-relaxed">
                {lastNotification.message}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Participating Students Roster (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4" ref={rosterContainerRef}>
          {/* Roster Controls: Tabs and Search */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("present")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "present"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("absent")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "absent"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Pending ({absentCount})
              </button>
            </div>

            {/* Candidate Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, chest #, team..."
                className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {displayedParticipants.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {displayedParticipants.map((participant) => {
                  const isHighlighted = highlightedStudentId === participant.studentId;

                  return (
                    <div
                      key={participant.registrationId}
                      className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isHighlighted
                          ? "ring-2 ring-emerald-400 bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.01]"
                          : participant.isPresent
                          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 shadow-sm"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Student Photo */}
                        <div className="relative shrink-0">
                          {participant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={participant.avatar}
                              alt={participant.studentName}
                              className="h-14 w-14 rounded-2xl object-cover border-2 shadow-md"
                              style={{ borderColor: participant.teamColor }}
                            />
                          ) : (
                            <div
                              className="h-14 w-14 rounded-2xl bg-white/10 border-2 flex items-center justify-center text-white/80 font-bold text-lg"
                              style={{ borderColor: participant.teamColor }}
                            >
                              {participant.studentName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Present Checkmark Mini Badge */}
                          {participant.isPresent && (
                            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Name & Metadata */}
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate">
                            {participant.studentName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {/* Chest Badge */}
                            <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                              Chest #{participant.studentChest}
                            </span>

                            {/* Team Badge */}
                            <span
                              className="text-xs px-2 py-0.5 rounded-md font-medium border text-white/90 truncate max-w-[140px]"
                              style={{
                                backgroundColor: `${participant.teamColor}22`,
                                borderColor: `${participant.teamColor}55`,
                              }}
                            >
                              {participant.teamName}
                            </span>
                          </div>

                          {/* Check-in Timestamp */}
                          {participant.isPresent && participant.markedAt && (
                            <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Checked in at {new Date(participant.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {participant.markedBy && ` · ${participant.markedBy}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Status Pill & Toggle Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {/* Status Indicator */}
                        {participant.isPresent ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Present</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-xs">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span>Awaiting Scan</span>
                          </div>
                        )}

                        {/* Toggle Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleAttendance(participant)}
                          className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-auto transition-all ${
                            participant.isPresent
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                          }`}
                        >
                          {participant.isPresent ? (
                            <>
                              <UserX className="h-3.5 w-3.5 mr-1" />
                              Mark Absent
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Mark Present
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 rounded-3xl border border-white/10 bg-slate-900/40">
                <Users className="mx-auto h-12 w-12 text-white/20 mb-3" />
                <h4 className="text-base font-bold text-white">No Students Found</h4>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                  {searchQuery
                    ? `No candidates matching "${searchQuery}".`
                    : activeTab !== "all"
                    ? `No ${activeTab} students for this program.`
                    : "No students registered for this program yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
