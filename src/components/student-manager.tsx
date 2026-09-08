"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Eye, 
  Pencil, 
  Search, 
  Trash2, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  ExternalLink,
  Award,
  Trophy 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchSelect } from "@/components/ui/search-select";
import { useDebounce } from "@/hooks/use-debounce";
import type { Student, Team, Program, ProgramRegistration } from "@/lib/types";

interface StudentManagerProps {
  students: Student[];
  teams: Team[];
  programs?: Program[];
  registrations?: ProgramRegistration[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  bulkDeleteAction: (formData: FormData) => Promise<void>;
}

type SortOption = "latest" | "az" | "chest";

const pageSizeOptions = [
  { label: "8 / page", value: "8" },
  { label: "15 / page", value: "15" },
  { label: "25 / page", value: "25" },
];

export const StudentManager = React.memo(function StudentManager({
  students,
  teams,
  programs = [],
  registrations = [],
  updateAction,
  deleteAction,
  bulkDeleteAction,
}: StudentManagerProps) {
  const teamOptions = useMemo(
    () => [{ value: "", label: "All Teams" }, ...teams.map((team) => ({ value: team.id, label: team.name }))],
    [teams],
  );
  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);
  
  const programOptions = useMemo(
    () => [
      { value: "", label: "All Programs" },
      ...programs.map((program) => ({
        value: program.id,
        label: program.name,
        meta: `${program.section} · ${program.category !== "none" ? `Cat ${program.category}` : "General"}`,
      })),
    ],
    [programs],
  );
  const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program.name])), [programs]);
  
  const studentRegistrationsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    registrations.forEach((registration) => {
      if (!map.has(registration.studentId)) {
        map.set(registration.studentId, new Set());
      }
      map.get(registration.studentId)!.add(registration.programId);
    });
    return map;
  }, [registrations]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [teamFilter, setTeamFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(Number(pageSizeOptions[0].value));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, teamFilter, programFilter, sort]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query = debouncedSearchQuery.trim().toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(query) || student.chest_no.toLowerCase().includes(query);
      const matchesTeam = teamFilter ? student.team_id === teamFilter : true;
      const matchesProgram = programFilter
        ? studentRegistrationsMap.get(student.id)?.has(programFilter) ?? false
        : true;
      return matchesSearch && matchesTeam && matchesProgram;
    });
  }, [students, debouncedSearchQuery, teamFilter, programFilter, studentRegistrationsMap]);

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "chest") {
      list.sort((a, b) => a.chest_no.localeCompare(b.chest_no));
    } else {
      list.sort((a, b) => b.id.localeCompare(a.id));
    }
    return list;
  }, [filteredStudents, sort]);

  useEffect(() => {
    const available = new Set(sortedStudents.map((student) => student.id));
    setSelected((prev) => {
      const filtered = new Set(Array.from(prev).filter((id) => available.has(id)));
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [sortedStudents]);

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize)) || 1;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const visibleStudents = sortedStudents.slice(startIndex, startIndex + pageSize);
  const showingFrom = sortedStudents.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, sortedStudents.length);
  const hasSelection = selected.size > 0;
  const selectedIdsValue = Array.from(selected).join(",");
  const allSelected = sortedStudents.length > 0 && sortedStudents.every((student) => selected.has(student.id));

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelected(new Set(sortedStudents.map((student) => student.id)));
    } else {
      setSelected(new Set());
    }
  }, [sortedStudents]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const viewStudent = viewStudentId ? students.find((student) => student.id === viewStudentId) : null;

  const exportToCSV = () => {
    const headers = [
      "Chest Number",
      "Student Name",
      "Team",
      "Total Points",
      "Position Points",
      "Grade Points",
      "1st Place",
      "2nd Place",
      "3rd Place",
      "Grade A",
      "Grade B",
      "Grade C",
    ];
    const rows = sortedStudents.map((student) => [
      student.chest_no,
      student.name,
      teamMap.get(student.team_id) ?? "Unknown",
      (student.total_points ?? 0).toString(),
      (student.position_points ?? 0).toString(),
      (student.grade_points ?? 0).toString(),
      (student.positions_count?.first ?? 0).toString(),
      (student.positions_count?.second ?? 0).toString(),
      (student.positions_count?.third ?? 0).toString(),
      (student.grades_count?.A ?? 0).toString(),
      (student.grades_count?.B ?? 0).toString(),
      (student.grades_count?.C ?? 0).toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_with_scores_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Students Festival Roster & Scores", 14, 22);
      
      doc.setFontSize(11);
      const dateStr = new Date().toLocaleDateString();
      let yPos = 30;
      doc.text(`Generated on: ${dateStr}`, 14, yPos);
      yPos += 8;
      
      if (teamFilter) {
        doc.text(`Team: ${teamMap.get(teamFilter) ?? "Unknown"}`, 14, yPos);
        yPos += 6;
      }
      if (programFilter) {
        doc.text(`Program: ${programMap.get(programFilter) ?? "Unknown"}`, 14, yPos);
        yPos += 6;
      }
      
      yPos += 4;
      
      const headers = ["Chest #", "Name", "Team", "Points", "1/2/3", "A/B/C"];
      const colWidths = [25, 55, 45, 25, 20, 20];
      const startX = 14;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      let xPos = startX;
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      sortedStudents.forEach((student) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        xPos = startX;
        const positions = `${student.positions_count?.first || 0}/${student.positions_count?.second || 0}/${student.positions_count?.third || 0}`;
        const grades = `${student.grades_count?.A || 0}/${student.grades_count?.B || 0}/${student.grades_count?.C || 0}`;
        const rowData = [
          student.chest_no,
          student.name,
          teamMap.get(student.team_id) ?? "Unknown",
          `${student.total_points ?? 0} pts`,
          positions,
          grades,
        ];
        
        rowData.forEach((cell, i) => {
          const cellText = doc.splitTextToSize(cell, colWidths[i] - 2);
          doc.text(cellText, xPos, yPos);
          xPos += colWidths[i];
        });
        
        yPos += 7;
      });

      doc.save(`students_roster_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export requires jsPDF library. Please install it: npm install jspdf");
    }
  };

  return (
    <>
      <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.35)] print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Students roster</p>
          <h2 className="text-2xl font-semibold text-white">Manage participants</h2>
          <p className="text-sm text-white/60">Search, filter, edit, or bulk-delete student entries.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        window.print();
                      }}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <Printer className="h-4 w-4 text-cyan-400" />
                      <div>
                        <p className="font-semibold">Print Roster</p>
                        <p className="text-xs text-white/60">Paper / official print layout</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportToCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold">Export as CSV</p>
                        <p className="text-xs text-white/60">Includes scores, grades & positions</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await exportToPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="font-semibold">Export as PDF</p>
                        <p className="text-xs text-white/60">Includes scores, grades & positions</p>
                      </div>
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <Link
                      href="/admin/reports"
                      onClick={() => setShowExportMenu(false)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-amber-300">All Reports & Export Center</p>
                        <p className="text-xs text-white/60">Teams, programs, scores & single type</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            disabled={!hasSelection}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Bulk delete ({selected.size})
          </Button>
        </div>
      </div>

      <div className="relative z-20 grid gap-3 md:grid-cols-5">
        <div className="relative z-20 md:col-span-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 transition-all duration-200 hover:border-white/20 focus-within:border-fuchsia-400/50 focus-within:ring-2 focus-within:ring-fuchsia-400/30 focus-within:bg-white/10">
          <Search className="mr-2 h-4 w-4 text-white/50 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Search by name or chest number"
            className="border-none bg-transparent px-0 placeholder:text-white/40"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <SearchSelect
          name="team_filter"
          options={teamOptions}
          value={teamFilter}
          onValueChange={setTeamFilter}
          placeholder="Filter by team"
        />
        {programOptions.length > 1 && (
          <SearchSelect
            name="program_filter"
            options={programOptions}
            value={programFilter}
            onValueChange={(value) => setProgramFilter(value)}
            placeholder="Filter by program"
          />
        )}
        <SearchSelect
          name="page_size"
          options={pageSizeOptions}
          value={String(pageSize)}
          onValueChange={(value) => setPageSize(Number(value))}
          placeholder="Page size"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/50">Quick sort</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Latest", value: "latest" },
            { label: "A-Z Name", value: "az" },
            { label: "Chest No.", value: "chest" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value as SortOption)}
              className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                sort === option.value
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-white/60">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {sortedStudents.length} students
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest text-white/50">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
            />
            Select all
          </div>
          <span className="flex-1">Student</span>
          <span>Team</span>
          <span>Chest No.</span>
          <span>Actions</span>
        </div>

        {visibleStudents.map((student) => {
          const isSelected = selected.has(student.id);
          const isEditing = editingId === student.id;
          return (
            <div
              key={student.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 px-4 py-4 shadow-[0_15px_60px_rgba(15,23,42,0.45)] transition hover:border-fuchsia-400/40"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(student.id)}
                  />
                  <div className="relative w-11 h-11 shrink-0 rounded-full overflow-hidden border border-white/20 bg-gradient-to-br from-fuchsia-500/25 to-cyan-500/25 shadow-md flex items-center justify-center">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white/70 uppercase">
                        {student.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/40">#{student.id.slice(0, 8)}</p>
                    <p className="text-lg font-semibold text-white">{student.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/60 w-full xl:flex-1">
                  <span className="rounded-full border border-white/15 px-3 py-1">
                    {teamMap.get(student.team_id) ?? "Unknown team"}
                  </span>
                  <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-cyan-300 font-bold">
                    Chest #{student.chest_no}
                  </span>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold px-3 py-1">
                    {student.total_points ?? 0} pts
                  </span>
                  {((student.grades_count?.A || 0) > 0 || (student.grades_count?.B || 0) > 0 || (student.grades_count?.C || 0) > 0) && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[11px]">
                      {student.grades_count?.A ? `${student.grades_count.A} A ` : ""}
                      {student.grades_count?.B ? `${student.grades_count.B} B ` : ""}
                      {student.grades_count?.C ? `${student.grades_count.C} C` : ""}
                    </span>
                  )}
                  {((student.positions_count?.first || 0) > 0 || (student.positions_count?.second || 0) > 0 || (student.positions_count?.third || 0) > 0) && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-0.5 text-[11px]">
                      {student.positions_count?.first ? `🥇 ${student.positions_count.first} ` : ""}
                      {student.positions_count?.second ? `🥈 ${student.positions_count.second} ` : ""}
                      {student.positions_count?.third ? `🥉 ${student.positions_count.third}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:ml-auto xl:w-auto xl:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewStudentId(student.id)}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 border border-white/15 bg-white/5"
                    onClick={() => setEditingId((prev) => (prev === student.id ? null : student.id))}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={student.id} />
                    <Button type="submit" variant="danger" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
              {isEditing && (
                <form
                  action={updateAction}
                  className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white md:grid-cols-3"
                >
                  <input type="hidden" name="id" value={student.id} />
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Student Name</label>
                    <Input name="name" defaultValue={student.name} placeholder="Student name" required />
                  </div>
                  <input type="hidden" name="chest_no" value={student.chest_no} />
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Chest Number</label>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                      Chest: {student.chest_no}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Team</label>
                    <SearchSelect
                      name="team_id"
                      defaultValue={student.team_id}
                      options={teams.map((team) => ({ value: team.id, label: team.name }))}
                      placeholder="Select team"
                    />
                  </div>
                  <div className="md:col-span-3 flex items-center gap-4 py-1">
                    <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white/50 uppercase">
                          {student.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/60 mb-1 block">
                        Update Student Photo (Optional)
                      </label>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        className="w-full text-xs text-white/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/15 file:cursor-pointer cursor-pointer rounded-xl border border-white/10 bg-white/5 p-1.5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-3">
                    <Button type="submit" className="flex-1">
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
        {visibleStudents.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/60">
            No students match your filters.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        <p>
          Showing{" "}
          <span className="font-semibold text-white">
            {sortedStudents.length === 0 ? 0 : `${showingFrom}-${showingTo}`}
          </span>{" "}
          of <span className="font-semibold text-white">{sortedStudents.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-white/5"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="rounded-xl border border-white/10 px-4 py-1 text-xs uppercase tracking-widest text-white/80">
            Page {page} of {totalPages}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-white/5"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || sortedStudents.length === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>

      {/* ================= OFFICIAL PRINTABLE REPORT (VISIBLE ONLY WHEN PRINTING) ================= */}
      <div className="hidden print:block text-black bg-white w-full p-2">
        {/* Official Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-black">DARS FEST 2026</h1>
              <h2 className="text-base font-bold text-gray-800">OFFICIAL PARTICIPANT DIRECTORY & SCORE SHEET</h2>
              <p className="text-xs text-gray-600 mt-1">
                Filter: {teamFilter ? (teamMap.get(teamFilter) ?? "Specific Team") : "All Teams"}
                {programFilter ? ` | Program: ${programMap.get(programFilter) ?? "Specific Program"}` : ""}
              </p>
            </div>
            <div className="text-right text-xs text-gray-700">
              <p className="font-bold">Total Students: {sortedStudents.length}</p>
              <p>Generated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              <p className="font-mono text-[10px] text-gray-500">Fest Command Center</p>
            </div>
          </div>
        </div>

        {/* Official Printable Table */}
        <table className="w-full text-left text-xs border-collapse border border-black text-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-black font-bold uppercase">
              <th className="py-2.5 px-3 border border-black w-10 text-center">#</th>
              <th className="py-2.5 px-3 border border-black w-24 font-mono">Chest No</th>
              <th className="py-2.5 px-4 border border-black">Student Name</th>
              <th className="py-2.5 px-4 border border-black">Team</th>
              <th className="py-2.5 px-3 border border-black text-center w-28">Positions (1/2/3)</th>
              <th className="py-2.5 px-3 border border-black text-center w-28">Grades (A/B/C)</th>
              <th className="py-2.5 px-4 border border-black text-right w-24 font-bold">Total Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {sortedStudents.map((student, idx) => (
              <tr key={student.id} className="border-b border-gray-300">
                <td className="py-2 px-3 border border-black text-center text-gray-700">{idx + 1}</td>
                <td className="py-2 px-3 border border-black font-mono font-bold text-black">{student.chest_no}</td>
                <td className="py-2 px-4 border border-black font-semibold text-black">{student.name}</td>
                <td className="py-2 px-4 border border-black text-gray-800">{teamMap.get(student.team_id) ?? "Unknown"}</td>
                <td className="py-2 px-3 border border-black text-center font-mono">
                  {student.positions_count?.first || 0} / {student.positions_count?.second || 0} / {student.positions_count?.third || 0}
                </td>
                <td className="py-2 px-3 border border-black text-center font-mono">
                  {student.grades_count?.A || 0} / {student.grades_count?.B || 0} / {student.grades_count?.C || 0}
                </td>
                <td className="py-2 px-4 border border-black text-right font-black">
                  {student.total_points ?? 0} pts
                </td>
              </tr>
            ))}
            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 italic border border-black">
                  No student records match the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Verification Signatures Footer */}
        <div className="mt-12 pt-8 border-t border-gray-400 flex items-end justify-between text-xs text-gray-700">
          <div className="text-center w-48">
            <div className="border-b border-black mb-2 pb-6"></div>
            <p className="font-bold text-black uppercase">Controller of Examinations</p>
            <p className="text-[10px] text-gray-500">Sign & Date</p>
          </div>
          <div className="text-center text-[10px] text-gray-500">
            <p className="font-semibold text-gray-700">Certified Official Festival Record</p>
            <p>DARS FEST Control System</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black mb-2 pb-6"></div>
            <p className="font-bold text-black uppercase">General Convener / Admin</p>
            <p className="text-[10px] text-gray-500">Sign & Date</p>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(viewStudent)}
        onClose={() => setViewStudentId(null)}
        title={viewStudent?.name ?? ""}
        actions={
          <Button variant="secondary" onClick={() => setViewStudentId(null)}>
            Close
          </Button>
        }
      >
        {viewStudent && (
          <div className="space-y-4 text-sm text-white/80">
            <div className="flex flex-col items-center justify-center text-center pb-2">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 shadow-xl flex items-center justify-center mb-3">
                {viewStudent.avatar ? (
                  <img
                    src={viewStudent.avatar}
                    alt={viewStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white/60 uppercase">
                    {viewStudent.name.slice(0, 2)}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{viewStudent.name}</h3>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mt-1">
                Chest #{viewStudent.chest_no}
              </span>
            </div>
            <div className="space-y-2.5 border-t border-white/10 pt-3">
              <p className="flex justify-between">
                <span className="text-white/50">Student ID:</span> 
                <span className="font-mono text-white/80">{viewStudent.id}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/50">Team:</span> 
                <span className="font-semibold text-white">{teamMap.get(viewStudent.team_id) ?? "Unknown"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/50">Total Accumulated Score:</span> 
                <span className="font-bold text-cyan-300">{viewStudent.total_points ?? 0} pts</span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/50">Position Points / Grade Points:</span> 
                <span className="text-white/80">{viewStudent.position_points ?? 0} pts / {viewStudent.grade_points ?? 0} pts</span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/50">Podium Finishes (1st / 2nd / 3rd):</span> 
                <span className="text-amber-300 font-semibold">
                  {viewStudent.positions_count?.first || 0} / {viewStudent.positions_count?.second || 0} / {viewStudent.positions_count?.third || 0}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/50">Grades Awarded (A / B / C):</span> 
                <span className="text-emerald-300 font-semibold">
                  {viewStudent.grades_count?.A || 0} / {viewStudent.grades_count?.B || 0} / {viewStudent.grades_count?.C || 0}
                </span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm bulk delete"
        actions={
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
        }
      >
        <p className="text-sm text-white/70">
          You are deleting {selected.size} student{selected.size === 1 ? "" : "s"}. This cannot be undone.
        </p>
        <form action={bulkDeleteAction} className="space-y-4">
          <input type="hidden" name="student_ids" value={selectedIdsValue} />
          <Button type="submit" variant="danger" className="w-full" disabled={!hasSelection}>
            Delete {selected.size} student{selected.size === 1 ? "" : "s"}
          </Button>
        </form>
      </Modal>
    </>
  );
});


