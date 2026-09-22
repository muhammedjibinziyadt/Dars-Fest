"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, FileSpreadsheet, Search, Users, Award, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchSelect } from "@/components/ui/search-select";
import type {
  PortalTeam,
  PortalStudent,
  ProgramRegistration,
  Program,
  ResultRecord,
} from "@/lib/types";

interface TeamDetailsViewProps {
  teams: PortalTeam[];
  students: PortalStudent[];
  registrations: ProgramRegistration[];
  programs: Program[];
  allPrograms: Program[];
  results: ResultRecord[];
}

export function TeamDetailsView({
  teams,
  students,
  registrations,
  programs,
  allPrograms,
  results,
}: TeamDetailsViewProps) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const teamOptions = useMemo(
    () => [
      { value: "", label: "All Teams" },
      ...teams.map((team) => ({
        value: team.id,
        label: team.teamName,
        meta: `Leader: ${team.leaderName}`,
      })),
    ],
    [teams],
  );

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId),
    [teams, selectedTeamId],
  );

  const filteredData = useMemo(() => {
    let teamStudents = selectedTeamId
      ? students.filter((s) => s.teamId === selectedTeamId)
      : students;
    let teamRegistrations = selectedTeamId
      ? registrations.filter((r) => r.teamId === selectedTeamId)
      : registrations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      teamStudents = teamStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.chestNumber.toLowerCase().includes(query),
      );
      teamRegistrations = teamRegistrations.filter(
        (r) =>
          r.studentName.toLowerCase().includes(query) ||
          r.programName.toLowerCase().includes(query) ||
          r.studentChest.toLowerCase().includes(query),
      );
    }

    return { teamStudents, teamRegistrations };
  }, [selectedTeamId, searchQuery, students, registrations]);

  // Pagination calculations
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.teamStudents.slice(startIndex, endIndex);
  }, [filteredData.teamStudents, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.teamStudents.length / itemsPerPage);
  }, [filteredData.teamStudents.length, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeamId, searchQuery]);

  const teamStats = useMemo(() => {
    if (!selectedTeamId) {
      return teams.map((team) => {
        const teamStudents = students.filter((s) => s.teamId === team.id);
        const teamRegs = registrations.filter((r) => r.teamId === team.id);
        const uniquePrograms = new Set(teamRegs.map((r) => r.programId));
        return {
          team,
          studentCount: teamStudents.length,
          registrationCount: teamRegs.length,
          programCount: uniquePrograms.size,
          totalPoints: teamStudents.reduce((sum, s) => sum + s.score, 0),
        };
      });
    }

    const teamStudents = students.filter((s) => s.teamId === selectedTeamId);
    const teamRegs = registrations.filter((r) => r.teamId === selectedTeamId);
    const uniquePrograms = new Set(teamRegs.map((r) => r.programId));
    const programStatuses = uniquePrograms.size;

    return [
      {
        team: selectedTeam!,
        studentCount: teamStudents.length,
        registrationCount: teamRegs.length,
        programCount: programStatuses,
        totalPoints: teamStudents.reduce((sum, s) => sum + s.score, 0),
      },
    ];
  }, [selectedTeamId, teams, students, registrations, selectedTeam]);

  const programStatusMap = useMemo(() => {
    const statusMap = new Map<string, { registered: boolean; hasResult: boolean }>();
    registrations.forEach((reg) => {
      statusMap.set(`${reg.teamId}-${reg.programId}`, { registered: true, hasResult: false });
    });
    results.forEach((result) => {
      const key = `${result.entries[0]?.team_id ?? ""}-${result.program_id}`;
      const existing = statusMap.get(key);
      if (existing) {
        existing.hasResult = true;
      }
    });
    return statusMap;
  }, [registrations, results]);

  function exportToCSV() {
    const headers = [
      "Student Name",
      "Chest Number",
      "Team",
      "Total Points",
      "Registered Programs",
    ];
    const rows: string[][] = [];

    filteredData.teamStudents.forEach((student) => {
      const studentRegs = filteredData.teamRegistrations.filter(
        (r) => r.studentId === student.id,
      );
      const programNames = studentRegs.map((reg) => reg.programName).join("; ");
      rows.push([
        student.name,
        student.chestNumber,
        student.teamName,
        student.score.toString(),
        programNames || "None",
      ]);
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
      `students_${selectedTeamId && selectedTeam ? selectedTeam.teamName : "all"}_${new Date().toISOString().split("T")[0]}.csv`,
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
      doc.text(
        selectedTeamId && selectedTeam ? `${selectedTeam.teamName} - Team Details` : "All Teams - Details Report",
        14,
        yPos,
      );
      yPos += 10;

      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 8;

      if (selectedTeamId) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Team Information", 14, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Team: ${selectedTeam ? selectedTeam.teamName : ""}`, 14, yPos);
        yPos += 6;
        doc.text(`Leader: ${selectedTeam ? selectedTeam.leaderName : ""}`, 14, yPos);
        yPos += 6;
        doc.text(`Total Students: ${filteredData.teamStudents.length}`, 14, yPos);
        yPos += 6;
        doc.text(`Total Registrations: ${filteredData.teamRegistrations.length}`, 14, yPos);
        yPos += 10;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("All Students", 14, yPos);
      yPos += 8;

      const tableData: string[][] = [];
      filteredData.teamStudents.forEach((student) => {
        const studentRegs = filteredData.teamRegistrations.filter(
          (r) => r.studentId === student.id,
        );
        const programNames = studentRegs.map((reg) => reg.programName).join(", ");
        tableData.push([
          student.name,
          student.chestNumber,
          student.teamName,
          student.score.toString(),
          programNames || "None",
        ]);
      });

      if (tableData.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const colWidths = [50, 30, 40, 25, 45];
        const startX = 14;

        doc.setFont("helvetica", "bold");
        const headers = ["Student Name", "Chest", "Team", "Points", "Programs"];
        let xPos = startX;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 6;

        doc.setFont("helvetica", "normal");
        tableData.forEach((row) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          xPos = startX;
          row.forEach((cell, i) => {
            const cellText = doc.splitTextToSize(cell, colWidths[i] - 2);
            doc.text(cellText, xPos, yPos);
            xPos += colWidths[i];
          });
          yPos += 7;
        });
      }

      doc.save(
        `team_details_${selectedTeamId && selectedTeam ? selectedTeam.teamName : "all"}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export requires jsPDF library. Please install it: npm install jspdf");
    }
  }

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Team Details & Management</h1>
        <p className="text-sm text-white/70">
          View detailed information about teams, their candidates, program assignments, and status.
        </p>
      </div>

      

      <div className="grid gap-4 md:grid-cols-3">
        {teamStats.map((stat) => {
          const teamStudents = students.filter((s) => s.teamId === stat.team.id);
          const teamRegs = registrations.filter((r) => r.teamId === stat.team.id);
          
          return (
            <Card key={stat.team.id} className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">{stat.team.teamName}</CardTitle>
                <Badge tone="cyan">{stat.team.id}</Badge>
              </div>
              <CardDescription className="text-white/70 mb-4">
                Leader: {stat.team.leaderName}
              </CardDescription>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Students</p>
                    <p className="text-lg font-semibold">{stat.studentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Registrations</p>
                    <p className="text-lg font-semibold">{stat.registrationCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Programs</p>
                    <p className="text-lg font-semibold">{stat.programCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Total Points</p>
                    <p className="text-lg font-semibold">{stat.totalPoints}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/admin/team-details/${stat.team.id}`)}
                variant="secondary"
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          All Students {selectedTeamId && `- ${selectedTeam?.teamName}`}
        </h2>

        <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
          <Search className="mr-2 h-4 w-4 text-white/50 shrink-0" />
          <Input
            type="text"
            placeholder="Search students or programs..."
            className="border-none bg-transparent px-0 placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <SearchSelect
          name="team_filter"
          options={teamOptions}
          value={selectedTeamId}
          onValueChange={setSelectedTeamId}
          placeholder="Filter by team"
        />
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="secondary" className="gap-2 flex-1">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportToPDF} variant="secondary" className="gap-2 flex-1">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
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
                    Team
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-white/90">
                    Total Points
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-white/90">
                    Registered Programs
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/60">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                    const studentRegs = filteredData.teamRegistrations.filter(
                      (r) => r.studentId === student.id,
                    );
                    return (
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
                          <p className="text-sm text-white/70">{student.teamName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-white">{student.score}</p>
                        </td>
                        <td className="py-4 px-4">
                          {studentRegs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {studentRegs.map((reg) => (
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredData.teamStudents.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.teamStudents.length)} of{" "}
                {filteredData.teamStudents.length} students
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-white/70">Rows per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-fuchsia-400 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-white/50">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "secondary"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[2.5rem]"
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

