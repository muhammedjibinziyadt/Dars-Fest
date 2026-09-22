"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchSelect } from "@/components/ui/search-select";
import type {
  PortalTeam,
  PortalStudent,
  ProgramRegistration,
  Program,
} from "@/lib/types";

interface TeamDetailPageProps {
  team: PortalTeam;
  students: PortalStudent[];
  registrations: ProgramRegistration[];
  programs: Program[];
  allPrograms: Program[];
}

export function TeamDetailPage({
  team,
  students,
  registrations,
  programs,
  allPrograms,
}: TeamDetailPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const programOptions = useMemo(
    () => [
      { value: "", label: "All Programs" },
      ...allPrograms.map((program) => ({
        value: program.id,
        label: program.name,
        meta: `${program.section} · ${program.category !== "none" ? `Cat ${program.category}` : "General"}`,
      })),
    ],
    [allPrograms],
  );

  // Group registrations by student
  const studentRegistrationsMap = useMemo(() => {
    const map = new Map<string, ProgramRegistration[]>();
    registrations.forEach((reg) => {
      const existing = map.get(reg.studentId) || [];
      existing.push(reg);
      map.set(reg.studentId, existing);
    });
    return map;
  }, [registrations]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.chestNumber.toLowerCase().includes(query),
      );
    }

    // Filter by program
    if (selectedProgramId) {
      filtered = filtered.filter((s) => {
        const studentRegs = studentRegistrationsMap.get(s.id) || [];
        return studentRegs.some((reg) => reg.programId === selectedProgramId);
      });
    }

    return filtered;
  }, [students, searchQuery, selectedProgramId, studentRegistrationsMap]);

  const tableData = useMemo(() => {
    return filteredStudents.map((student) => {
      const studentRegs = studentRegistrationsMap.get(student.id) || [];
      const programNames = studentRegs.map((reg) => reg.programName).join(", ");
      return {
        student,
        programs: studentRegs,
        programNames,
      };
    });
  }, [filteredStudents, studentRegistrationsMap]);

  function exportToCSV() {
    const headers = ["Student Name", "Chest Number", "Assigned Programs"];
    const rows: string[][] = [];

    tableData.forEach(({ student, programNames }) => {
      rows.push([student.name, student.chestNumber, programNames || "None"]);
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${team.teamName}_candidates_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportToPDF() {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(18);
      doc.text(`${team.teamName} - Team Candidates`, 14, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.text(`Leader: ${team.leaderName}`, 14, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Candidates & Assigned Programs", 14, yPos);
      yPos += 8;

      if (tableData.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const colWidths = [50, 40, 100];
        const startX = 14;

        doc.setFont("helvetica", "bold");
        const headers = ["Student Name", "Chest #", "Assigned Programs"];
        let xPos = startX;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 6;

        doc.setFont("helvetica", "normal");
        tableData.forEach(({ student, programNames }) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          xPos = startX;
          const row = [student.name, student.chestNumber, programNames || "None"];
          row.forEach((cell, i) => {
            const cellText = doc.splitTextToSize(cell, colWidths[i] - 2);
            doc.text(cellText, xPos, yPos);
            xPos += colWidths[i];
          });
          yPos += 7;
        });
      }

      doc.save(
        `${team.teamName}_candidates_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export requires jsPDF library. Please install it: npm install jspdf");
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => router.push("/admin/team-details")}
            variant="ghost"
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>
          <h1 className="text-3xl font-bold">{team.teamName}</h1>
          <p className="text-sm text-white/70">Leader: {team.leaderName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="secondary" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={exportToPDF} variant="secondary" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
          <Search className="mr-2 h-4 w-4 text-white/50 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Search by student name or chest number..."
            className="border-none bg-transparent px-0 placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <SearchSelect
          name="program_filter"
          options={programOptions}
          value={selectedProgramId}
          onValueChange={setSelectedProgramId}
          placeholder="Filter by program"
        />
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-semibold text-white/90">
                  Student Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-white/90">
                  Chest Number
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-white/90">
                  Assigned Programs
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-white/60">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                tableData.map(({ student, programs: studentPrograms }) => (
                  <tr
                    key={student.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-white">{student.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge tone="cyan">{student.chestNumber}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {studentPrograms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {studentPrograms.map((reg) => (
                            <Badge key={reg.id} tone="emerald" className="text-xs">
                              {reg.programName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-white/50">No programs assigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tableData.length > 0 && (
          <div className="mt-4 text-sm text-white/60">
            Showing {tableData.length} of {students.length} candidates
          </div>
        )}
      </Card>
    </div>
  );
}

