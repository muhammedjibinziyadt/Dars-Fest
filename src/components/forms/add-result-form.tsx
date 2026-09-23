"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchSelect } from "@/components/ui/search-select";
import { Plus, Trash2 } from "lucide-react";
import type {
  GradeType,
  Jury,
  Program,
  ProgramRegistration,
  ResultRecord,
  Student,
  Team,
} from "@/lib/types";

export interface PlacementItem {
  id: string;
  position: number;
  winnerId: string;
  grade: GradeType;
}

interface AddResultFormProps {
  programs: Program[];
  students: Student[];
  teams: Team[];
  juries: Jury[];
  registrations?: ProgramRegistration[];
  approvedResults?: ResultRecord[]; // List of approved results to check against
  action: (formData: FormData) => Promise<void>;
  lockProgram?: boolean;
  initial?:
    | Array<{ position: number; winnerId: string; grade?: GradeType }>
    | Partial<
        Record<
          number,
          {
            winnerId: string;
            grade?: GradeType;
          }
        >
      >;
  initialPenalties?: {
    targetId?: string;
    points?: number;
    type?: "student" | "team";
  }[];
  submitLabel?: string;
  mode?: "default" | "jury";
  juryName?: string;
  defaultJuryId?: string;
}

const gradeOptions = [
  { value: "A", label: "Grade A (+5)" },
  { value: "B", label: "Grade B (+3)" },
  { value: "C", label: "Grade C (+1)" },
  { value: "none", label: "None" },
];

const POSITION_OPTIONS = [
  { value: 1, label: "🥇 1st Place" },
  { value: 2, label: "🥈 2nd Place" },
  { value: 3, label: "🥉 3rd Place" },
  { value: 4, label: "🏅 4th Place" },
  { value: 5, label: "🏅 5th Place" },
  { value: 6, label: "🏅 6th Place" },
  { value: 7, label: "🏅 7th Place" },
  { value: 8, label: "🏅 8th Place" },
  { value: 9, label: "🏅 9th Place" },
  { value: 10, label: "🏅 10th Place" },
];

function getInitialPlacementRows(initial?: AddResultFormProps["initial"]): PlacementItem[] {
  if (Array.isArray(initial) && initial.length > 0) {
    return initial.map((item, idx) => ({
      id: `placement-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      position: item.position ?? idx + 1,
      winnerId: item.winnerId ?? "",
      grade: item.grade ?? "A",
    }));
  }
  if (initial && typeof initial === "object") {
    const keys = Object.keys(initial)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    if (keys.length > 0) {
      return keys.map((pos) => {
        const item = (initial as Record<number, { winnerId: string; grade?: GradeType }>)[pos];
        return {
          id: `placement-${pos}-${Math.random().toString(36).slice(2, 7)}`,
          position: pos,
          winnerId: item?.winnerId ?? "",
          grade: item?.grade ?? "A",
        };
      });
    }
  }
  return [
    { id: "placement-1", position: 1, winnerId: "", grade: "A" },
    { id: "placement-2", position: 2, winnerId: "", grade: "A" },
    { id: "placement-3", position: 3, winnerId: "", grade: "A" },
  ];
}

export function AddResultForm({
  programs,
  students,
  teams,
  juries,
  registrations,
  approvedResults = [],
  action,
  lockProgram = false,
  initial,
  initialPenalties,
  submitLabel = "Submit for Approval",
  mode = "default",
  juryName,
  defaultJuryId,
}: AddResultFormProps) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [showRules, setShowRules] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  
  // Dynamic placement rows supporting 1, 2, 3, 4 or more candidates
  const [placementRows, setPlacementRows] = useState<PlacementItem[]>(() =>
    getInitialPlacementRows(initial),
  );
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [penaltyRows, setPenaltyRows] = useState<
    {
      id: string;
      defaultTarget?: string;
      defaultPoints?: number;
      type?: "student" | "team";
    }[]
  >(() => {
    if (initialPenalties?.length) {
      return initialPenalties.map((penalty, index) => ({
        id: `penalty-${index}`,
        defaultTarget: penalty.targetId,
        // Respect existing values; only fall back to 5 when nothing is set
        defaultPoints: typeof penalty.points === "number" ? penalty.points : 5,
        type: penalty.type,
      }));
    }
    // No penalty rows visible until user explicitly adds one
    return [];
  });
  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? programs[0],
    [programId, programs],
  );

  // Reset winners when program changes if not in locked initial edit mode
  useEffect(() => {
    if (!initial || (Array.isArray(initial) ? initial.length === 0 : Object.keys(initial).length === 0)) {
      setPlacementRows([
        { id: "placement-1", position: 1, winnerId: "", grade: "A" },
        { id: "placement-2", position: 2, winnerId: "", grade: "A" },
        { id: "placement-3", position: 3, winnerId: "", grade: "A" },
      ]);
    }
    setDuplicateError("");
  }, [programId]);

  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.id,
        label: program.name,
        meta: `${program.section}${
          program.stage ? " · On stage" : " · Off stage"
        }`,
      })),
    [programs],
  );

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: student.name,
        meta: `Chest ${student.chest_no}`,
      })),
    [students],
  );

  const teamOptions = useMemo(
    () =>
      teams.map((team) => ({
        value: team.id,
        label: team.name,
        meta: team.leader ? `Leader · ${team.leader}` : undefined,
      })),
    [teams],
  );

  const registrationMap = useMemo(() => {
    const map = new Map<string, ProgramRegistration[]>();
    (registrations ?? []).forEach((registration) => {
      const list = map.get(registration.programId) ?? [];
      list.push(registration);
      map.set(registration.programId, list);
    });
    return map;
  }, [registrations]);

  const isSingle = selectedProgram?.section === "single";
  const isJuryMode = mode === "jury";
  const activeJury = juries[0];
  const programRegistrations = selectedProgram
    ? registrationMap.get(selectedProgram.id) ?? []
    : [];

  const singleCandidateOptions = programRegistrations.map((registration) => ({
    value: registration.studentId,
    label: `${registration.studentName} · ${registration.studentChest}`,
    meta: registration.teamName,
  }));

  const teamCandidateOptions = Array.from(
    new Map(
      programRegistrations.map((registration) => [
        registration.teamId,
        { value: registration.teamId, label: registration.teamName, meta: registration.programName },
      ]),
    ).values(),
  );

  const registeredOptions = isSingle ? singleCandidateOptions : teamCandidateOptions;
  const fallbackOptions = isSingle ? studentOptions : teamOptions;
  // Never use fallback options - always require registered candidates for both admin and jury
  const useFallbackOptions = false;
  const placementSelectOptions = registeredOptions;
  const penaltySelectOptions = placementSelectOptions;

  // Filter options to exclude already-selected candidates from other rows
  const getRowCandidateOptions = (currentRowId: string) => {
    const otherSelectedIds = placementRows
      .filter((r) => r.id !== currentRowId && Boolean(r.winnerId))
      .map((r) => r.winnerId);
    return placementSelectOptions.filter((opt) => !otherSelectedIds.includes(opt.value));
  };

  const updateRowWinner = (rowId: string, winnerId: string) => {
    setPlacementRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, winnerId } : row)),
    );
    setDuplicateError("");
  };

  const updateRowGrade = (rowId: string, grade: GradeType) => {
    setPlacementRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, grade } : row)),
    );
  };

  const updateRowPosition = (rowId: string, position: number) => {
    setPlacementRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, position } : row)),
    );
    setDuplicateError("");
  };

  const removePlacementRow = (rowId: string) => {
    if (placementRows.length <= 1) {
      setDuplicateError("At least one candidate placement is required.");
      return;
    }
    setPlacementRows((rows) => rows.filter((row) => row.id !== rowId));
    setDuplicateError("");
  };

  const addPlacementRow = () => {
    setPlacementRows((rows) => {
      const maxPos = rows.reduce((max, r) => Math.max(max, r.position), 0);
      const nextPos = maxPos > 0 ? maxPos + 1 : rows.length + 1;
      return [
        ...rows,
        {
          id: `placement-${Math.random().toString(36).slice(2, 9)}`,
          position: nextPos,
          winnerId: "",
          grade: "A",
        },
      ];
    });
    setDuplicateError("");
  };

  const hasPenaltyOptions = penaltySelectOptions.length > 0;
  const penaltyTypeDefault =
    initialPenalties?.[0]?.type ?? (isSingle ? "student" : "team");
  const penaltyRowIds = penaltyRows.map((row) => row.id);

  const addPenaltyRow = () => {
    setPenaltyRows((rows) => [
      ...rows,
      {
        id: `penalty-${Math.random().toString(36).slice(2, 9)}`,
        // New rows default to 5 penalty points, but remain fully editable
        defaultPoints: 5,
      },
    ]);
  };

  const removePenaltyRow = (rowId: string) => {
    setPenaltyRows((rows) => rows.filter((row) => row.id !== rowId));
  };
  const hasEligibleCandidates = placementSelectOptions.length > 0;
  const showProgramSelector = !(isJuryMode && lockProgram);

  // Check if the selected program is already approved/published
  const isProgramPublished = useMemo(() => {
    if (!programId || approvedResults.length === 0) return false;
    return approvedResults.some((result) => result.program_id === programId);
  }, [programId, approvedResults]);

  // Handle form submission - check if program is published before submitting
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous duplicate error
    setDuplicateError("");
    
    // Check if program is already published before submission
    if (isProgramPublished) {
      setShowPublishedModal(true);
      return;
    }

    // Validate that at least one placement exists
    if (placementRows.length === 0) {
      setDuplicateError("Please add at least one candidate placement.");
      return;
    }

    // Validate that each placement field has a selected candidate
    const unselected = placementRows.find((r) => !r.winnerId);
    if (unselected) {
      setDuplicateError("Please select a candidate for all placement fields, or delete empty fields.");
      return;
    }

    // Validate that all candidates are unique
    const selectedWinnerIds = placementRows.map((r) => r.winnerId);
    const uniqueWinnerIds = new Set(selectedWinnerIds);
    if (uniqueWinnerIds.size !== selectedWinnerIds.length) {
      setDuplicateError("Each candidate can only be awarded one placement. Please select unique candidates for each field.");
      return;
    }

    // Create FormData from the form and submit
    const formData = new FormData(e.currentTarget);
    try {
      await action(formData);
    } catch (error: any) {
      // Handle backend error for published programs
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("Program already published") || errorMessage.includes("already published")) {
        setShowPublishedModal(true);
        return;
      }
      // For other errors, let Next.js handle them (they'll show in the UI)
      throw error;
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="program_id" value={selectedProgram?.id} />
      {isJuryMode && <input type="hidden" name="jury_id" value={activeJury?.id ?? ""} />}
      <input type="hidden" name="placement_rows" value={placementRows.map((r) => r.id).join(",")} />
      {placementRows.map((row) => (
        <input
          key={`hidden-pos-${row.id}`}
          type="hidden"
          name={`placement_position_${row.id}`}
          value={row.position}
        />
      ))}
      {/* Legacy compatibility inputs */}
      {placementRows.find((r) => r.position === 1) && (
        <input
          type="hidden"
          name="winner_1"
          value={placementRows.find((r) => r.position === 1)?.winnerId ?? ""}
        />
      )}
      {placementRows.find((r) => r.position === 2) && (
        <input
          type="hidden"
          name="winner_2"
          value={placementRows.find((r) => r.position === 2)?.winnerId ?? ""}
        />
      )}
      {placementRows.find((r) => r.position === 3) && (
        <input
          type="hidden"
          name="winner_3"
          value={placementRows.find((r) => r.position === 3)?.winnerId ?? ""}
        />
      )}

      {showProgramSelector && (
      <Card>
        <Badge tone="cyan">Step 1 · Program</Badge>
          <CardTitle className="mt-4">
            {isJuryMode && lockProgram ? "Program locked in" : "Select a program"}
          </CardTitle>
        <CardDescription className="mt-2">
            {isJuryMode && lockProgram
              ? "Admins have assigned this program to you. Review the details before entering results."
              : "We auto-fill stage, section, and scoring rules."}
        </CardDescription>
        <div className="mt-6">
            {isJuryMode && lockProgram ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Program</p>
                <p className="text-2xl font-semibold text-white">{selectedProgram?.name}</p>
              </div>
            ) : (
          <SearchSelect
            name="program_selector"
            options={programOptions}
            value={programId}
            onValueChange={(next) => setProgramId(next)}
            disabled={lockProgram}
            placeholder="Search program..."
          />
            )}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p>Section: {selectedProgram?.section}</p>
          <p>Stage: {selectedProgram?.stage ? "On stage" : "Off stage"}</p>
        </div>
      </Card>
      )}

      <Card>
        <Badge tone="pink">Step 2 · Winners</Badge>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Podium placements & candidate results</CardTitle>
            <CardDescription className="mt-2">
              Select {isSingle ? "students" : "teams"} and their placements. You can add more candidates or delete placements as needed.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowRules(true)}
          >
            View scoring matrix
          </Button>
        </div>
        {isJuryMode && !showProgramSelector && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-widest text-white/50">Program</p>
            <p className="text-xl font-semibold text-white">{selectedProgram?.name}</p>
            <p className="text-xs text-white/50 mt-1">
              Section: {selectedProgram?.section}
            </p>
          </div>
        )}
        {!useFallbackOptions && !hasEligibleCandidates && (
          <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No registered candidates for this program yet.
          </p>
        )}
        {duplicateError && (
          <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {duplicateError}
          </p>
        )}

        {/* Dynamic Placement Cards */}
        <div className="mt-6 space-y-4">
          {placementRows.map((row) => {
            const rowCandidateOptions = getRowCandidateOptions(row.id);
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 transition-all hover:border-white/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs uppercase tracking-wider text-white/60 font-semibold">Position:</span>
                    <select
                      value={row.position}
                      onChange={(e) => updateRowPosition(row.id, Number(e.target.value))}
                      className="rounded-xl border border-white/20 bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-white focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer"
                    >
                      {POSITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                      {!POSITION_OPTIONS.some((o) => o.value === row.position) && (
                        <option value={row.position} className="bg-slate-900 text-white">
                          🏅 {row.position}th Place
                        </option>
                      )}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlacementRow(row.id)}
                    disabled={placementRows.length <= 1}
                    className="h-8 px-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 transition-colors disabled:opacity-40"
                    title={placementRows.length <= 1 ? "At least one candidate placement is required" : "Delete this placement field"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>

                <div className="pt-1">
                  <SearchSelect
                    name={`winner_${row.id}`}
                    required
                    value={row.winnerId}
                    onValueChange={(value) => updateRowWinner(row.id, value)}
                    options={rowCandidateOptions}
                    placeholder={`Search ${isSingle ? "student" : "team"}...`}
                    disabled={!hasEligibleCandidates}
                  />
                </div>

                {isSingle ? (
                  <SearchSelect
                    name={`grade_${row.id}`}
                    value={row.grade}
                    onValueChange={(value) => updateRowGrade(row.id, value as GradeType)}
                    disabled={!hasEligibleCandidates}
                    options={gradeOptions}
                    placeholder="Select grade"
                  />
                ) : (
                  <input type="hidden" name={`grade_${row.id}`} value="none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Add Placement Button */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={addPlacementRow}
            className="gap-2 border-white/20 bg-white/10 hover:bg-white/15 text-white"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Add Placement</span>
          </Button>
          <span className="text-xs text-white/50">
            {placementRows.length} candidate {placementRows.length === 1 ? "field" : "fields"} configured
          </span>
        </div>
        {isJuryMode && !showProgramSelector && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-widest text-white/50">Logged in as</p>
            <p className="text-lg font-semibold text-white">{juryName ?? activeJury?.name}</p>
            <p className="text-xs text-white/50">
              Double-check placements before submitting — edits aren’t possible afterward.
            </p>
            <Button type="submit" className="mt-2 w-full" disabled={!hasEligibleCandidates}>
              Submit evaluation
            </Button>
          </div>
        )}
      </Card>

      <input type="hidden" name="penalty_rows" value={penaltyRowIds.join(",")} />
      {penaltyRows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 flex flex-wrap items-center justify-between gap-3">
          <p className="text-white/80">Need to deduct points for a no-show?</p>
          <Button
            type="button"
            variant="secondary"
            onClick={addPenaltyRow}
            disabled={!hasPenaltyOptions}
          >
            Add penalty
          </Button>
        </div>
      ) : (
        <Card>
          <Badge tone="amber">Optional · Minus Points</Badge>
          <CardTitle className="mt-4">No-show penalty</CardTitle>
          <CardDescription className="mt-2">
            Apply a deduction when a {isSingle ? "registered participant" : "team"} fails to appear.
            Leave blank to skip.
          </CardDescription>
          <div className="mt-6 space-y-4">
            {penaltyRows.map((row) => {
              const rowType = row.type ?? penaltyTypeDefault;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <input type="hidden" name={`penalty_type_${row.id}`} value={rowType} />
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <SearchSelect
                        name={`penalty_target_${row.id}`}
                        options={penaltySelectOptions}
                        placeholder={`Select a ${isSingle ? "participant" : "team"} to penalize`}
                        defaultValue={row.defaultTarget ?? ""}
                        disabled={!hasPenaltyOptions}
                      />
                    </div>
                    <div className="flex items-center gap-3 md:w-60">
                      <Input
                        name={`penalty_points_${row.id}`}
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Penalty points"
                        defaultValue={row.defaultPoints ?? 5}
                        disabled={!hasPenaltyOptions}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-white/80"
                        onClick={() => removePenaltyRow(row.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={addPenaltyRow}
              disabled={!hasPenaltyOptions}
            >
              Add penalty
            </Button>
          </div>
          <p className="mt-3 text-xs text-white/50">
            Enter the number of points to deduct. Each entry reduces the team total only.
          </p>
        </Card>
      )}

      {!isJuryMode && (
      <Card>
        <Badge tone="emerald">Step 3 · Submit</Badge>
        <CardTitle className="mt-4">Assign responsible jury (Optional)</CardTitle>
        <CardDescription className="mt-2">
          {defaultJuryId 
            ? "Leave blank to assign to Admin. Once you submit, the record lands in Pending Results for approval."
            : "Once you submit, the record lands in Pending Results for approval."}
        </CardDescription>
        {defaultJuryId && <input type="hidden" name="default_jury_id" value={defaultJuryId} />}
        <SearchSelect
          className="mt-6"
          name="jury_id"
          defaultValue={defaultJuryId ?? juries[0]?.id}
          disabled={lockProgram}
          options={juries.map((jury) => ({ value: jury.id, label: jury.name }))}
          placeholder="Select jury (defaults to Admin if not selected)"
        />
          <Button type="submit" className="mt-4" disabled={!hasEligibleCandidates}>
          {submitLabel}
        </Button>
      </Card>
      )}
      <Modal
        open={showRules}
        onClose={() => setShowRules(false)}
        title="Scoring Matrix"
        actions={
          <Button type="button" variant="secondary" onClick={() => setShowRules(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-sm">
          <p>Single events add grade bonus on top of podium points.</p>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-semibold">Single · Podium</p>
            <p>1st: 10 · 2nd: 7 · 3rd: 5</p>
            <p className="font-semibold">Grade Bonus</p>
            <p>A: +5 · B: +3 · C: +1</p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-semibold">Group</p>
            <p>1st 20 · 2nd 15 · 3rd 10</p>
            <p className="font-semibold">General</p>
            <p>1st 25 · 2nd 20 · 3rd 15</p>
          </div>
        </div>
      </Modal>
      
      {/* Published Program Modal */}
      <Modal
        open={showPublishedModal}
        onClose={() => setShowPublishedModal(false)}
        title="Program Already Published"
        actions={
          <Button type="button" variant="secondary" onClick={() => setShowPublishedModal(false)}>
            Close
          </Button>
        }
      >
        <p className="text-white/90">This program is already published.</p>
      </Modal>
    </form>
    </>
  );
}

