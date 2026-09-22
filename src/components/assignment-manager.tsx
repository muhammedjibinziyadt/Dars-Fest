"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAssignmentUpdates } from "@/hooks/use-realtime";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CheckCircle2,
  Clock,
  FileCheck,
  Search,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Award,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { AssignedProgram, Jury, Program } from "@/lib/types";

interface AssignmentManagerProps {
  assignments: AssignedProgram[];
  programs: Program[];
  juries: Jury[];
  deleteAction: (formData: FormData) => Promise<void>;
}

type StatusFilter = "all" | "pending" | "submitted" | "completed";
type ViewMode = "by-jury" | "all";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Clock,
    description: "Awaiting evaluation",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: FileCheck,
    description: "Results submitted",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
    description: "Evaluation complete",
  },
};

export const AssignmentManager = React.memo(function AssignmentManager({
  assignments,
  programs,
  juries,
  deleteAction,
}: AssignmentManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("by-jury");
  const [expandedJuries, setExpandedJuries] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    programId: string;
    juryId: string;
    programName: string;
    juryName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to real-time assignment updates
  useAssignmentUpdates(() => {
    router.refresh();
  });

  // Create maps with proper error handling
  const programMap = useMemo(() => {
    const map = new Map<string, Program>();
    programs.forEach((p) => {
      if (p?.id && p?.name) {
        map.set(p.id, p);
      }
    });
    return map;
  }, [programs]);

  const juryMap = useMemo(() => {
    const map = new Map<string, Jury>();
    juries.forEach((j) => {
      if (j?.id && j?.name) {
        map.set(j.id, j);
      }
    });
    return map;
  }, [juries]);

  // Group assignments by jury
  const assignmentsByJury = useMemo(() => {
    const grouped = new Map<string, AssignedProgram[]>();
    assignments.forEach((assignment) => {
      const existing = grouped.get(assignment.jury_id) || [];
      grouped.set(assignment.jury_id, [...existing, assignment]);
    });
    return grouped;
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const program = programMap.get(assignment.program_id);
      const jury = juryMap.get(assignment.jury_id);
      const matchesSearch =
        program?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        jury?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, debouncedSearchQuery, statusFilter, programMap, juryMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === "pending").length;
    const submitted = assignments.filter((a) => a.status === "submitted").length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    return { total, pending, submitted, completed };
  }, [assignments]);

  const toggleJuryExpansion = useCallback((juryId: string) => {
    setExpandedJuries((prev) => {
      const next = new Set(prev);
      if (next.has(juryId)) {
        next.delete(juryId);
      } else {
        next.add(juryId);
      }
      return next;
    });
  }, []);

  const expandAll = () => {
    setExpandedJuries(new Set(Array.from(assignmentsByJury.keys())));
  };

  const collapseAll = () => {
    setExpandedJuries(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">Total</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-white/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300/70">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-amber-300">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-300/70">Submitted</p>
                <p className="mt-1 text-2xl font-semibold text-blue-300">{stats.submitted}</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-300/70">Completed</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="relative z-20 bg-slate-900/70 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative z-20 flex-1 min-w-[200px] flex items-center rounded-xl border border-white/10 bg-white/5 px-3 transition-all duration-200 hover:border-white/20 focus-within:border-fuchsia-400/50 focus-within:ring-2 focus-within:ring-fuchsia-400/30 focus-within:bg-white/10">
              <Search className="mr-2 h-4 w-4 text-white/50 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Search by program or jury..."
                className="border-none bg-transparent px-0 placeholder:text-white/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SearchSelect
              name="status_filter"
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              className="w-full sm:w-auto"
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "submitted", label: "Submitted" },
                { value: "completed", label: "Completed" },
              ]}
              placeholder="Filter by status"
            />
            <div className="flex gap-2">
              <Button
                variant={viewMode === "by-jury" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("by-jury")}
              >
                By Jury
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("all")}
              >
                All Assignments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "by-jury" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Assignments by Jury</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
          {Array.from(assignmentsByJury.entries()).map(([juryId, juryAssignments]) => {
            const jury = juryMap.get(juryId);
            const isExpanded = expandedJuries.has(juryId);
            const filtered = juryAssignments.filter((assignment) => {
              const program = programMap.get(assignment.program_id);
              const matchesSearch =
                program?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                jury?.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
              const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
              return matchesSearch && matchesStatus;
            });

            if (filtered.length === 0) return null;

            const juryStats = {
              total: juryAssignments.length,
              pending: juryAssignments.filter((a) => a.status === "pending").length,
              submitted: juryAssignments.filter((a) => a.status === "submitted").length,
              completed: juryAssignments.filter((a) => a.status === "completed").length,
            };

            return (
              <motion.div
                key={juryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/50 border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleJuryExpansion(juryId)}
                    className="w-full"
                  >
                    <CardContent className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-rose-500/20 flex items-center justify-center ring-2 ring-fuchsia-400/30">
                            <Users className="h-6 w-6 text-fuchsia-300" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-lg font-semibold text-white">{jury?.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                              <span>{juryStats.total} assigned</span>
                              <span>•</span>
                              <span className="text-amber-300">{juryStats.pending} pending</span>
                              <span>•</span>
                              <span className="text-blue-300">{juryStats.submitted} submitted</span>
                              <span>•</span>
                              <span className="text-emerald-300">{juryStats.completed} completed</span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-white/60" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-white/60" />
                        )}
                      </div>
                    </CardContent>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {filtered.map((assignment) => {
                          const program = programMap.get(assignment.program_id);
                          const jury = juryMap.get(assignment.jury_id);
                          const statusInfo = statusConfig[assignment.status];
                          const StatusIcon = statusInfo.icon;

                          // Fallback if program not found
                          const programName = program?.name || `Program ID: ${assignment.program_id}`;
                          const juryName = jury?.name || `Jury ID: ${assignment.jury_id}`;
                          const programSection = program?.section || "Unknown";
                          const programCategory = program?.category || "N/A";
                          const programStage = program?.stage !== undefined ? program.stage : false;

                          return (
                            <motion.div
                              key={`${assignment.program_id}-${assignment.jury_id}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Award className="h-4 w-4 text-fuchsia-400 shrink-0" />
                                    <h5 className="font-semibold text-white truncate">
                                      {programName}
                                    </h5>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                                    <span className="capitalize">{programSection}</span>
                                    <span>•</span>
                                    <span>Cat {programCategory}</span>
                                    <span>•</span>
                                    <span>{programStage ? "On Stage" : "Off Stage"}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 lg:justify-end">
                                  <div
                                    className={cn(
                                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                                      statusInfo.color,
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    <span>{statusInfo.label}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setDeleteTarget({
                                        programId: assignment.program_id,
                                        juryId: assignment.jury_id,
                                        programName,
                                        juryName,
                                      })
                                    }
                                    className=" p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        {filtered.length === 0 && (
                          <p className="text-sm text-white/60 text-center py-4">
                            No assignments match the filters.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
          {Array.from(assignmentsByJury.keys()).length === 0 && (
            <Card className="bg-slate-900/70">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No jury assignments found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const program = programMap.get(assignment.program_id);
            const jury = juryMap.get(assignment.jury_id);
            const statusInfo = statusConfig[assignment.status];
            const StatusIcon = statusInfo.icon;

            // Fallback if program/jury not found
            const programName = program?.name || `Program ID: ${assignment.program_id}`;
            const juryName = jury?.name || `Jury ID: ${assignment.jury_id}`;
            const programSection = program?.section || "Unknown";
            const programCategory = program?.category || "N/A";

            return (
              <motion.div
                key={`${assignment.program_id}-${assignment.jury_id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-800/50 p-4 hover:border-fuchsia-400/40 transition-all"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="h-5 w-5 text-fuchsia-400 shrink-0" />
                      <h5 className="font-semibold text-white truncate">{programName}</h5>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{juryName}</span>
                      </div>
                      <span>•</span>
                      <span className="capitalize">{programSection}</span>
                      <span>•</span>
                      <span>Cat {programCategory}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 lg:justify-end">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shrink-0",
                        statusInfo.color,
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span>{statusInfo.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteTarget({
                          programId: assignment.program_id,
                          juryId: assignment.jury_id,
                          programName,
                          juryName,
                        })
                      }
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredAssignments.length === 0 && (
            <Card className="bg-slate-900/70">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No assignments match your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Delete Assignment"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                setIsDeleting(true);
                
                // Set a timeout fallback to reset state if redirect doesn't happen quickly
                const timeoutId = setTimeout(() => {
                  setIsDeleting(false);
                  setDeleteTarget(null);
                }, 2000);
                
                try {
                  const formData = new FormData();
                  formData.append("program_id", deleteTarget.programId);
                  formData.append("jury_id", deleteTarget.juryId);
                  await deleteAction(formData);
                  clearTimeout(timeoutId);
                  // If we reach here, redirect didn't happen, reset state
                  setIsDeleting(false);
                  setDeleteTarget(null);
                } catch (error: any) {
                  clearTimeout(timeoutId);
                  // Handle redirect - Next.js redirects throw a special error
                  if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
                    // Redirect is happening, reset state immediately
                    setIsDeleting(false);
                    setDeleteTarget(null);
                  } else {
                    // Other errors - reset state
                    setIsDeleting(false);
                  }
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-white/80">
          <p>
            Are you sure you want to remove the assignment of{" "}
            <strong className="text-white">{deleteTarget?.programName}</strong> from{" "}
            <strong className="text-white">{deleteTarget?.juryName}</strong>?
          </p>
          <p className="text-sm text-amber-300">
            This action cannot be undone. The jury will no longer be able to evaluate this program.
          </p>
        </div>
      </Modal>
    </div>
  );
});

