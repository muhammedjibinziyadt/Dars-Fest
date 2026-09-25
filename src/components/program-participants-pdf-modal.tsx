"use client";

import React, { useState, useRef, useMemo } from "react";
import { Download, Printer, FileText, Loader2, X, Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramRegistration, Student } from "@/lib/types";

interface ProgramParticipantsPdfModalProps {
  open: boolean;
  onClose: () => void;
  programs: Program[];
  registrations: ProgramRegistration[];
  students?: Student[];
  selectedProgramIds?: string[];
}

export function ProgramParticipantsPdfModal({
  open,
  onClose,
  programs,
  registrations,
  students = [],
  selectedProgramIds = [],
}: ProgramParticipantsPdfModalProps) {
  const [filterMode, setFilterMode] = useState<"all" | "selected">(
    selectedProgramIds.length > 0 ? "selected" : "all"
  );
  const [stageFilter, setStageFilter] = useState<"all" | "stage" | "non_stage">("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Map studentId -> chest_no
  const studentMap = useMemo(() => {
    return new Map<string, Student>(students.map((s) => [s.id, s]));
  }, [students]);

  // Stage counts for quick stats
  const stageStats = useMemo(() => {
    let stageCount = 0;
    let nonStageCount = 0;
    programs.forEach((p) => {
      if (p.stage) stageCount++;
      else nonStageCount++;
    });
    return { stageCount, nonStageCount, total: programs.length };
  }, [programs]);

  // Group participant codes by programId
  const programParticipantsMap = useMemo(() => {
    const map = new Map<string, string[]>();

    registrations.forEach((reg) => {
      const code =
        reg.studentChest?.trim() ||
        studentMap.get(reg.studentId)?.chest_no?.trim() ||
        reg.teamName?.trim() ||
        "";

      if (code) {
        const existing = map.get(reg.programId) || [];
        if (!existing.includes(code)) {
          existing.push(code);
        }
        map.set(reg.programId, existing);
      }
    });

    // Sort codes naturally (e.g. TE001, TE002...)
    map.forEach((codes, pId) => {
      codes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      map.set(pId, codes);
    });

    return map;
  }, [registrations, studentMap]);

  // Filter programs based on user selection, stage, and section
  const filteredPrograms = useMemo(() => {
    let list = [...programs];

    if (filterMode === "selected" && selectedProgramIds.length > 0) {
      const selectedSet = new Set(selectedProgramIds);
      list = list.filter((p) => selectedSet.has(p.id));
    }

    if (stageFilter === "stage") {
      list = list.filter((p) => p.stage === true);
    } else if (stageFilter === "non_stage") {
      list = list.filter((p) => p.stage === false);
    }

    if (sectionFilter !== "all") {
      list = list.filter((p) => p.section === sectionFilter);
    }

    return list;
  }, [programs, filterMode, selectedProgramIds, stageFilter, sectionFilter]);

  // Total count of participants across displayed programs
  const totalParticipantsCount = useMemo(() => {
    let count = 0;
    filteredPrograms.forEach((p) => {
      const codes = programParticipantsMap.get(p.id) || [];
      count += codes.length;
    });
    return count;
  }, [filteredPrograms, programParticipantsMap]);

  // Get report subtitle text based on current stage filter
  const reportSubtitle = useMemo(() => {
    if (stageFilter === "stage") {
      return "STAGE (ON-STAGE) PROGRAMS - PARTICIPANTS ROSTER (STUDENT CODES)";
    }
    if (stageFilter === "non_stage") {
      return "NON-STAGE (OFF-STAGE) PROGRAMS - PARTICIPANTS ROSTER (STUDENT CODES)";
    }
    return "PROGRAM-WISE PARTICIPANTS ROSTER (STUDENT CODES)";
  }, [stageFilter]);

  // Generate & Download PDF
  const handleDownloadPdf = async (customStage?: "all" | "stage" | "non_stage") => {
    if (!printContainerRef.current) return;

    const effectiveStage = customStage || stageFilter;

    // If customStage is requested and doesn't match current, switch state and wait for DOM render
    if (customStage && customStage !== stageFilter) {
      setStageFilter(customStage);
      setIsGenerating(true);
      // Allow React to commit state and re-render the preview container
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    try {
      setIsGenerating(true);

      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas").then((m) => m.default || m),
      ]);

      const element = printContainerRef.current;
      if (!element) return;

      // Render DOM element to canvas at 2x resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = pdfHeight - margin * 2;

      // Calculate canvas height for 1 A4 page content
      const pageCanvasHeight = Math.floor((canvas.width * contentHeight) / contentWidth);
      let renderedHeight = 0;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext("2d");

        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const pageDataUrl = pageCanvas.toDataURL("image/png");
          if (renderedHeight > 0) {
            pdf.addPage();
          }

          const renderedMmHeight = (sliceHeight * contentWidth) / canvas.width;
          pdf.addImage(pageDataUrl, "PNG", margin, margin, contentWidth, renderedMmHeight);
        }

        renderedHeight += sliceHeight;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const stageSlug =
        effectiveStage === "stage"
          ? "stage_programs"
          : effectiveStage === "non_stage"
            ? "non_stage_programs"
            : "all_programs";
      pdf.save(`maerika_${stageSlug}_participants_${timestamp}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. You can also use the Print button to save as PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Browser Print
  const handlePrint = () => {
    if (!printContainerRef.current) return;

    const printContents = printContainerRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the roster.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Program Participants - Maerika 2k26</title>
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1.5px solid #000;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              font-size: 13px;
            }
            .code-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 8px 16px;
            }
            .code-item {
              font-family: monospace;
              font-weight: 600;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Program Participants PDF Export</h2>
              <p className="text-xs text-white/60">
                Download roster showing student codes (Chest Numbers) for each program
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-white/10 bg-slate-900/50 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Stage Filter: All vs Stage vs Non-Stage */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setStageFilter("all")}
                className={`rounded-lg px-3 py-1 font-medium transition ${
                  stageFilter === "all"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                All ({stageStats.total})
              </button>
              <button
                type="button"
                onClick={() => setStageFilter("stage")}
                className={`rounded-lg px-3 py-1 font-medium transition ${
                  stageFilter === "stage"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Stage ({stageStats.stageCount})
              </button>
              <button
                type="button"
                onClick={() => setStageFilter("non_stage")}
                className={`rounded-lg px-3 py-1 font-medium transition ${
                  stageFilter === "non_stage"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Non-Stage ({stageStats.nonStageCount})
              </button>
            </div>

            {/* All vs Selected */}
            {selectedProgramIds.length > 0 && (
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setFilterMode("selected")}
                  className={`rounded-lg px-3 py-1 font-medium transition ${
                    filterMode === "selected"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Selected ({selectedProgramIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`rounded-lg px-3 py-1 font-medium transition ${
                    filterMode === "all"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  All
                </button>
              </div>
            )}

            {/* Section Filter */}
            <div className="flex items-center gap-2">
              <span className="text-white/50">Section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Sections</option>
                <option value="single">Single</option>
                <option value="group">Group</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-white/60">
            <span>
              Programs: <strong className="text-white">{filteredPrograms.length}</strong>
            </span>
            <span>
              Total Codes: <strong className="text-amber-300">{totalParticipantsCount}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          <div className="mb-3 flex items-center justify-between text-xs text-white/50">
            <span>PDF Print Preview</span>
            <span>Document format: Standard A4</span>
          </div>

          {/* Printable Document Sheet (Exact match to user's test image) */}
          <div
            ref={printContainerRef}
            className="mx-auto bg-white text-black p-8 rounded-xl shadow-lg"
            style={{ width: "100%", maxWidth: "800px" }}
          >
            {/* Document Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#111827",
                }}
              >
                MAERIKA 2K26 - DARS ARTS FEST
              </h1>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#4b5563",
                  textTransform: "uppercase",
                }}
              >
                {reportSubtitle}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#6b7280" }}>
                Generated on: {new Date().toLocaleString()}
              </p>
            </div>

            {/* Table matching user's sketch */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid #000000",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1.5px solid #000000",
                      padding: "10px 8px",
                      width: "55px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    no
                  </th>
                  <th
                    style={{
                      border: "1.5px solid #000000",
                      padding: "10px 14px",
                      width: "240px",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "14px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    programs
                  </th>
                  <th
                    style={{
                      border: "1.5px solid #000000",
                      padding: "10px 14px",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "14px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    students id
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        border: "1.5px solid #000000",
                        padding: "24px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontStyle: "italic",
                      }}
                    >
                      No programs found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((program, index) => {
                    const codes = programParticipantsMap.get(program.id) || [];

                    return (
                      <tr key={program.id}>
                        {/* Serial Number */}
                        <td
                          style={{
                            border: "1.5px solid #000000",
                            padding: "12px 8px",
                            textAlign: "center",
                            verticalAlign: "top",
                            fontWeight: "bold",
                            fontSize: "13px",
                            color: "#111827",
                          }}
                        >
                          {index + 1}
                        </td>

                        {/* Program Name */}
                        <td
                          style={{
                            border: "1.5px solid #000000",
                            padding: "12px 14px",
                            verticalAlign: "top",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "15px",
                              lineHeight: "1.3",
                              color: "#111827",
                            }}
                          >
                            {program.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#6b7280",
                              marginTop: "4px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {program.section} • {program.stage ? "On Stage" : "Off Stage"}
                          </div>
                        </td>

                        {/* Student IDs / Codes */}
                        <td
                          style={{
                            border: "1.5px solid #000000",
                            padding: "12px 14px",
                            verticalAlign: "top",
                          }}
                        >
                          {codes.length === 0 ? (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                fontStyle: "italic",
                              }}
                            >
                              No participants registered
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px 18px",
                                alignItems: "center",
                              }}
                            >
                              {codes.map((code, cIdx) => (
                                <span
                                  key={cIdx}
                                  style={{
                                    fontFamily:
                                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    color: "#111827",
                                  }}
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-4 bg-slate-950/60">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span>Quick download:</span>
            <button
              type="button"
              onClick={() => handleDownloadPdf("stage")}
              disabled={isGenerating || stageStats.stageCount === 0}
              className="text-amber-400 underline hover:text-amber-300 disabled:opacity-40"
            >
              Stage Only PDF ({stageStats.stageCount})
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleDownloadPdf("non_stage")}
              disabled={isGenerating || stageStats.nonStageCount === 0}
              className="text-amber-400 underline hover:text-amber-300 disabled:opacity-40"
            >
              Non-Stage Only PDF ({stageStats.nonStageCount})
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isGenerating || filteredPrograms.length === 0}
              className="gap-2 border-white/20 text-white hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleDownloadPdf()}
              disabled={isGenerating || filteredPrograms.length === 0}
              loading={isGenerating}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-lg shadow-orange-500/20"
            >
              <Download className="h-4 w-4" />
              Download {stageFilter === "stage" ? "Stage" : stageFilter === "non_stage" ? "Non-Stage" : "All"} PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
