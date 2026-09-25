"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shuffle,
  X,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  User,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Program, ProgramRegistration, Student } from "@/lib/types";

interface ProgramChestLotModalProps {
  open: boolean;
  onClose: () => void;
  programs: Program[];
  registrations: ProgramRegistration[];
  students?: Student[];
  initialProgramId?: string;
}

interface ParticipantLot {
  registrationId: string;
  studentId: string;
  studentName: string;
  studentChest: string;
  teamId: string;
  teamName: string;
  avatar?: string;
  lotLetter?: string; // "A", "B", "C", "D"...
  originalIndex: number;
}

// Generate lot letters: A, B, C ... Z, AA, AB ...
function getLotLetter(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < 26) {
    return letters[index];
  }
  const first = letters[Math.floor(index / 26) - 1];
  const second = letters[index % 26];
  return `${first}${second}`;
}

export function ProgramChestLotModal({
  open,
  onClose,
  programs,
  registrations,
  students = [],
  initialProgramId,
}: ProgramChestLotModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    initialProgramId || (programs.length > 0 ? programs[0].id : "")
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledParticipants, setShuffledParticipants] = useState<ParticipantLot[]>([]);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [copied, setCopied] = useState(false);

  // Student photo/avatar lookup map
  const studentMap = useMemo(() => {
    return new Map<string, Student>(students.map((s) => [s.id, s]));
  }, [students]);

  // When initialProgramId changes or modal opens
  useEffect(() => {
    if (initialProgramId) {
      setSelectedProgramId(initialProgramId);
    } else if (!selectedProgramId && programs.length > 0) {
      setSelectedProgramId(programs[0].id);
    }
  }, [initialProgramId, programs, selectedProgramId]);

  // Selected program object
  const currentProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId);
  }, [programs, selectedProgramId]);

  // Filtered registrations for the selected program
  const baseParticipants = useMemo<ParticipantLot[]>(() => {
    if (!selectedProgramId) return [];

    const programRegs = registrations.filter((r) => r.programId === selectedProgramId);

    return programRegs.map((reg, idx) => {
      const student = studentMap.get(reg.studentId);
      const chestNo =
        reg.studentChest?.trim() ||
        student?.chest_no?.trim() ||
        reg.teamName ||
        `P${idx + 1}`;

      return {
        registrationId: reg.id,
        studentId: reg.studentId,
        studentName: reg.studentName || student?.name || "Participant",
        studentChest: chestNo,
        teamId: reg.teamId,
        teamName: reg.teamName,
        avatar: student?.avatar,
        originalIndex: idx + 1,
      };
    });
  }, [selectedProgramId, registrations, studentMap]);

  // Load existing shuffled lot for current program from localStorage if available
  useEffect(() => {
    if (!selectedProgramId || baseParticipants.length === 0) {
      setShuffledParticipants([]);
      setHasShuffled(false);
      return;
    }

    try {
      const saved = localStorage.getItem(`maerika_chest_lot_${selectedProgramId}`);
      if (saved) {
        const parsed: { registrationId: string; lotLetter: string }[] = JSON.parse(saved);
        const map = new Map(parsed.map((item) => [item.registrationId, item.lotLetter]));

        // Check if all current participants have saved lots
        const allMatched = baseParticipants.every((p) => map.has(p.registrationId));
        if (allMatched && parsed.length === baseParticipants.length) {
          const restored = [...baseParticipants]
            .map((p) => ({
              ...p,
              lotLetter: map.get(p.registrationId),
            }))
            .sort((a, b) => (a.lotLetter || "").localeCompare(b.lotLetter || ""));

          setShuffledParticipants(restored);
          setHasShuffled(true);
          return;
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Default to unshuffled
    setShuffledParticipants(baseParticipants);
    setHasShuffled(false);
  }, [selectedProgramId, baseParticipants]);

  // Handle Shuffle
  const handleShuffle = () => {
    if (baseParticipants.length === 0) return;

    setIsShuffling(true);

    setTimeout(() => {
      // Fisher-Yates random shuffle
      const array = [...baseParticipants];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }

      // Assign Lot Letters: A, B, C, D...
      const withLots = array.map((participant, index) => ({
        ...participant,
        lotLetter: getLotLetter(index),
      }));

      setShuffledParticipants(withLots);
      setHasShuffled(true);
      setIsShuffling(false);

      // Persist to localStorage
      try {
        localStorage.setItem(
          `maerika_chest_lot_${selectedProgramId}`,
          JSON.stringify(
            withLots.map((p) => ({
              registrationId: p.registrationId,
              lotLetter: p.lotLetter,
            }))
          )
        );
      } catch {
        // Ignore localStorage error
      }
    }, 350);
  };

  // Reset to original registration order
  const handleReset = () => {
    setShuffledParticipants(baseParticipants);
    setHasShuffled(false);
    try {
      localStorage.removeItem(`maerika_chest_lot_${selectedProgramId}`);
    } catch {
      // Ignore
    }
  };

  // Copy lot results to clipboard
  const handleCopy = () => {
    if (!currentProgram || shuffledParticipants.length === 0) return;

    const lines = [
      `🎯 MAERIKA 2K26 - CHEST NUMBER LOT SHEET`,
      `Program: ${currentProgram.name} (${currentProgram.section} • ${currentProgram.stage ? "Stage" : "Non-Stage"})`,
      `Total Participants: ${shuffledParticipants.length}`,
      `----------------------------------------`,
      ...shuffledParticipants.map(
        (p) =>
          `[${p.lotLetter || "-"}] Chest: ${p.studentChest} - ${p.studentName} (${p.teamName})`
      ),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Lot Sheet
  const handlePrint = () => {
    if (!currentProgram || shuffledParticipants.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the lot sheet.");
      return;
    }

    const rowsHtml = shuffledParticipants
      .map(
        (p, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold; font-size: 16px; background-color: #f1f5f9;">
            ${p.lotLetter ? `(${p.lotLetter})` : `#${idx + 1}`}
          </td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 15px;">
            ${p.studentChest}
          </td>
          <td style="font-weight: 600;">
            ${p.studentName}
          </td>
          <td>
            ${p.teamName}
          </td>
          <td style="width: 120px; border-bottom: 1px dashed #94a3b8;"></td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chest Lots - ${currentProgram.name} - Maerika 2k26</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
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
              font-size: 22px;
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
              padding: 10px 14px;
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
              margin-top: 24px;
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
            <div class="subtitle">STAGE CALL SHEET · CHEST NUMBER LOT ASSIGNMENT</div>
          </div>

          <div class="prog-box">
            <div>
              <div class="prog-name">${currentProgram.name}</div>
              <div class="prog-meta">
                Section: ${currentProgram.section.toUpperCase()} • ${currentProgram.stage ? "ON STAGE" : "OFF STAGE"}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold;">${shuffledParticipants.length} Participants</div>
              <div class="prog-meta">Order: ${hasShuffled ? "Shuffled (A, B, C...)" : "Registered"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Lot Code</th>
                <th style="width: 110px; text-align: center;">Chest No</th>
                <th>Student Name</th>
                <th>Team</th>
                <th style="width: 120px;">Signature / Score</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <span>Generated on: ${new Date().toLocaleString()}</span>
            <span>Stage Manager Signature: ___________________</span>
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

  // Filtered displayed participants by local search query
  const displayedParticipants = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return shuffledParticipants;

    return shuffledParticipants.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.studentChest.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        (p.lotLetter && p.lotLetter.toLowerCase().includes(q))
    );
  }, [shuffledParticipants, searchFilter]);

  // Filtered program list for program search dropdown
  const filteredProgramsList = useMemo(() => {
    const q = programSearch.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, programSearch]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative border-b border-white/10 px-5 sm:px-7 py-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Shuffle className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Stage Management · Lot Selection
                  </span>
                  <Badge tone={hasShuffled ? "emerald" : "amber"} className="text-[10px] px-2 py-0.5">
                    {hasShuffled ? "Shuffled (A, B, C...)" : "Registered Order"}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  Chest Number Lot & Shuffle
                </h2>
                <p className="text-xs text-white/60">
                  Select a program to view participants, then shuffle to assign performance stage codes (A, B, C, D...).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Program Selector & Controls Bar */}
        <div className="border-b border-white/10 bg-slate-950/60 p-4 sm:px-7 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Program Dropdown */}
            <div className="md:col-span-7">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60 block mb-1">
                Select Program:
              </label>
              <div className="relative">
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value);
                    setSearchFilter("");
                  }}
                  className="w-full appearance-none rounded-xl border border-white/20 bg-slate-900/90 px-4 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer pr-10"
                >
                  {programs.map((p) => {
                    const count = registrations.filter((r) => r.programId === p.id).length;
                    return (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name} ({p.section.toUpperCase()} • {p.stage ? "Stage" : "Non-Stage"} • {count} candidates)
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Quick Stats on Selected Program */}
            <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                <span className="text-[10px] text-white/50 block">Section</span>
                <span className="text-xs font-bold text-cyan-300 uppercase">
                  {currentProgram?.section || "-"}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                <span className="text-[10px] text-white/50 block">Platform</span>
                <span className="text-xs font-bold text-fuchsia-300">
                  {currentProgram?.stage ? "On Stage" : "Off Stage"}
                </span>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-center">
                <span className="text-[10px] text-cyan-200/70 block">Candidates</span>
                <span className="text-sm font-black text-cyan-300">
                  {baseParticipants.length}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar: Shuffle, Print, Copy */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleShuffle}
                disabled={isShuffling || baseParticipants.length === 0}
                className="gap-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 px-5"
              >
                <Shuffle className={`h-4 w-4 ${isShuffling ? "animate-spin" : ""}`} />
                {hasShuffled ? "Shuffle Again" : "Shuffle Lots (A, B, C...)"}
              </Button>

              {hasShuffled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 border-white/15 text-white/70 hover:text-white hover:bg-white/10"
                  title="Reset to original registration order"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Order
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={baseParticipants.length === 0}
                className="gap-1.5 border-white/15 text-white hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Lots"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={baseParticipants.length === 0}
                className="gap-1.5 border-white/15 text-white hover:bg-white/10"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Call Sheet
              </Button>
            </div>
          </div>
        </div>

        {/* Local Search Filter */}
        <div className="px-5 sm:px-7 py-2.5 bg-slate-950/40 border-b border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search candidate, chest no, or lot (A, B)..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="text-white/50 text-[11px]">
            {hasShuffled ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Lots Assigned: (A, B, C...)
              </span>
            ) : (
              <span>Original Registration Order</span>
            )}
          </div>
        </div>

        {/* Participants Cards / Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {displayedParticipants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {displayedParticipants.map((participant, index) => {
                const lot = participant.lotLetter;

                return (
                  <div
                    key={participant.registrationId}
                    className={`rounded-2xl border p-3.5 transition-all duration-200 flex items-center justify-between gap-3 ${
                      lot
                        ? "border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 shadow-sm"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Lot Letter Badge (A, B, C, D...) */}
                      <div
                        className={`h-11 w-11 rounded-2xl flex flex-col items-center justify-center font-black text-base shrink-0 shadow-md ${
                          lot
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-400/50"
                            : "bg-white/10 text-white/60 border border-white/10 text-sm font-semibold"
                        }`}
                        title={lot ? `Stage Lot: (${lot})` : "Lot not yet shuffled"}
                      >
                        {lot ? `(${lot})` : `#${participant.originalIndex}`}
                      </div>

                      {/* Photo / Avatar */}
                      <div className="relative shrink-0">
                        {participant.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={participant.avatar}
                            alt={participant.studentName}
                            className="h-10 w-10 rounded-xl object-cover border border-white/20 shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/70">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Name & Chest */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {participant.studentName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/50 mt-0.5">
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                            Chest #{participant.studentChest}
                          </span>
                          <span>•</span>
                          <span className="truncate">{participant.teamName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lot Indicator on Right */}
                    <div className="shrink-0 text-right">
                      {lot ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            Lot Code
                          </span>
                          <span className="text-lg font-black text-amber-300">
                            ({lot})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/40 italic">
                          Click shuffle
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="mx-auto h-12 w-12 text-white/20 mb-3" />
              <h4 className="text-base font-semibold text-white">No Participants Registered</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                {searchFilter
                  ? `No participant matching "${searchFilter}".`
                  : "No students registered for this program yet."}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-5 sm:px-7 py-3 bg-slate-950/80 flex items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span>Total Participants: {baseParticipants.length}</span>
            {hasShuffled && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-semibold">
                  Shuffled Stage Order: A ➔ {getLotLetter(baseParticipants.length - 1)}
                </span>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
