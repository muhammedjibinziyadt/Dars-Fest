"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchSelect } from "@/components/ui/search-select";
import type {
  GradeType,
  Jury,
  Program,
  ProgramRegistration,
  ResultRecord,
  ScoringRules,
  Student,
  Team,
} from "@/lib/types";

interface AddResultFormProps {
  programs: Program[];
  students: Student[];
  teams: Team[];
  juries: Jury[];
  registrations?: ProgramRegistration[];
  approvedResults?: ResultRecord[]; // List of approved results to check against
  pendingResults?: ResultRecord[]; // List of pending results to check against
  action: (formData: FormData) => Promise<void>;
  lockProgram?: boolean;
  initial?: Partial<
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
  scoringRules?: ScoringRules;
}

export function AddResultForm({
  programs,
  students,
  teams,
  juries,
  registrations,
  approvedResults = [],
  pendingResults = [],
  action,
  lockProgram = false,
  initial,
  initialPenalties,
  submitLabel = "Submit for Approval",
  mode = "default",
  juryName,
  defaultJuryId,
  scoringRules,
}: AddResultFormProps) {
  const gradeOptions = useMemo(() => [
    { value: "A", label: scoringRules ? `Grade A (+${scoringRules.single.gradeA})` : "Grade A (+5)" },
    { value: "B", label: scoringRules ? `Grade B (+${scoringRules.single.gradeB})` : "Grade B (+3)" },
    { value: "C", label: scoringRules ? `Grade C (+${scoringRules.single.gradeC})` : "Grade C (+1)" },
    { value: "none", label: "None" },
  ], [scoringRules]);

  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [showRules, setShowRules] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);

  // Dynamic positions state (defaults to [1, 2, 3])
  const [positions, setPositions] = useState<number[]>(() => {
    if (initial) {
      const keys = Object.keys(initial).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
      if (keys.length > 0) return keys;
    }
    return [1, 2, 3];
  });

  const [winnerValues, setWinnerValues] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (initial) {
      Object.entries(initial).forEach(([pos, val]) => {
        if (val?.winnerId) map[Number(pos)] = val.winnerId;
      });
    }
    return map;
  });

  const [gradeValues, setGradeValues] = useState<Record<number, GradeType>>(() => {
    const map: Record<number, GradeType> = {};
    if (initial) {
      Object.entries(initial).forEach(([pos, val]) => {
        if (val?.grade) map[Number(pos)] = val.grade;
      });
    }
    return map;
  });

  const [duplicateError, setDuplicateError] = useState<string>("");

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const addPlacement = () => {
    const nextPos = positions.length > 0 ? Math.max(...positions) + 1 : 1;
    setPositions((prev) => [...prev, nextPos]);
  };

  const addThreeBelowPlacements = () => {
    setPositions((prev) => {
      const maxPos = prev.length > 0 ? Math.max(...prev) : 0;
      return [...prev, maxPos + 1, maxPos + 2, maxPos + 3];
    });
  };

  const removePlacementAtIndex = (indexToRemove: number) => {
    if (positions.length <= 1) return;

    // Collect current values in current order
    const currentEntries = positions.map((pos) => ({
      winnerId: winnerValues[pos] || "",
      grade: gradeValues[pos] || (pos <= 3 ? "A" : "none"),
    }));

    // Remove the chosen row
    currentEntries.splice(indexToRemove, 1);

    // Reconstruct sequential positions 1..N
    const newPositions = currentEntries.map((_, i) => i + 1);
    const newWinnerValues: Record<number, string> = {};
    const newGradeValues: Record<number, GradeType> = {};

    currentEntries.forEach((entry, i) => {
      const pos = i + 1;
      if (entry.winnerId) newWinnerValues[pos] = entry.winnerId;
      if (entry.grade) newGradeValues[pos] = entry.grade as GradeType;
    });

    setPositions(newPositions);
    setWinnerValues(newWinnerValues);
    setGradeValues(newGradeValues);
    setDuplicateError("");
  };

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
        defaultPoints: typeof penalty.points === "number" ? penalty.points : 5,
        type: penalty.type,
      }));
    }
    return [];
  });

  // Reset winners when program changes
  useEffect(() => {
    if (initial) {
      const keys = Object.keys(initial).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
      setPositions(keys.length > 0 ? keys : [1, 2, 3]);
      const wMap: Record<number, string> = {};
      const gMap: Record<number, GradeType> = {};
      Object.entries(initial).forEach(([pos, val]) => {
        if (val?.winnerId) wMap[Number(pos)] = val.winnerId;
        if (val?.grade) gMap[Number(pos)] = val.grade;
      });
      setWinnerValues(wMap);
      setGradeValues(gMap);
    } else {
      setPositions([1, 2, 3]);
      setWinnerValues({});
      setGradeValues({});
    }
    setDuplicateError("");
  }, [programId, initial]);

  // Set of program IDs that are already published or pending
  const publishedOrPendingIds = useMemo(() => {
    const set = new Set<string>();
    (approvedResults ?? []).forEach((r) => {
      if (r.program_id) set.add(String(r.program_id).trim());
    });
    (pendingResults ?? []).forEach((r) => {
      if (r.program_id) set.add(String(r.program_id).trim());
    });
    return set;
  }, [approvedResults, pendingResults]);

  // Filter programs so published/pending programs are completely excluded unless locked to an existing result (edit mode)
  const availablePrograms = useMemo(() => {
    if (lockProgram) return programs;
    return programs.filter((p) => !publishedOrPendingIds.has(String(p.id).trim()));
  }, [programs, publishedOrPendingIds, lockProgram]);

  const programOptions = useMemo(
    () =>
      availablePrograms.map((program) => ({
        value: program.id,
        label: program.name,
        meta: `${program.section} · Cat ${program.category}${
          program.stage ? " · On stage" : " · Off stage"
        }`,
      })),
    [availablePrograms],
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

  const selectedProgram = useMemo(
    () =>
      availablePrograms.find((program) => program.id === programId) ??
      programs.find((program) => program.id === programId) ??
      availablePrograms[0] ??
      programs[0],
    [programId, availablePrograms, programs],
  );

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
  const placementSelectOptions = registeredOptions;
  const penaltySelectOptions = placementSelectOptions;

  // Filter options to exclude already-selected candidates from other positions
  const getOptionsForPosition = (position: number) => {
    const otherSelectedIds = Object.entries(winnerValues)
      .filter(([p, id]) => Number(p) !== position && Boolean(id))
      .map(([_, id]) => id);
    return placementSelectOptions.filter((opt) => !otherSelectedIds.includes(opt.value));
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
        defaultPoints: 5,
      },
    ]);
  };

  const removePenaltyRow = (rowId: string) => {
    setPenaltyRows((rows) => rows.filter((row) => row.id !== rowId));
  };
  const hasEligibleCandidates = placementSelectOptions.length > 0;

  // If program is published/pending, reset to first available non-published program
  useEffect(() => {
    if (!lockProgram && availablePrograms.length > 0) {
      if (!availablePrograms.some((p) => p.id === programId)) {
        setProgramId(availablePrograms[0].id);
      }
    }
  }, [availablePrograms, lockProgram, programId]);

  // Check if program already has an approved result
  const isProgramPublished = useMemo(() => {
    if (!selectedProgram || !approvedResults.length) return false;
    return approvedResults.some((result) => String(result.program_id).trim() === String(selectedProgram.id).trim());
  }, [selectedProgram, approvedResults]);

  // Determine if program selector should be shown
  const showProgramSelector = !lockProgram;

  return (
    <>
      <form action={action} className="space-y-8">
        <input type="hidden" name="placement_positions" value={positions.join(",")} />
        {defaultJuryId && <input type="hidden" name="default_jury_id" value={defaultJuryId} />}
        {!showProgramSelector && <input type="hidden" name="program_id" value={programId} />}

        {showProgramSelector && (
          <Card>
            <Badge tone="cyan">Step 1 · Program & Jury</Badge>
            <CardTitle className="mt-4">Target Program</CardTitle>
            <CardDescription className="mt-2">
              Select the program you are reporting results for.
            </CardDescription>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SearchSelect
                name="program_id"
                required
                options={programOptions}
                value={programId}
                onValueChange={(next) => setProgramId(next)}
                disabled={lockProgram}
                placeholder="Search program..."
              />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p>Section: {selectedProgram?.section}</p>
              <p>Stage: {selectedProgram?.stage ? "On stage" : "Off stage"}</p>
              <p>Category: {selectedProgram?.category}</p>
            </div>
          </Card>
        )}

        <Card>
          <Badge tone="pink">Step 2 · Winners & Placements</Badge>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Placements & Scores</CardTitle>
              <CardDescription className="mt-2">
                Select {isSingle ? "students" : "teams"} for 1st, 2nd, 3rd and any additional below placements.
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
                Section: {selectedProgram?.section} · Category: {selectedProgram?.category}
              </p>
            </div>
          )}

          {!hasEligibleCandidates && (
            <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              No registered candidates for this program yet.
            </p>
          )}
          {duplicateError && (
            <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {duplicateError}
            </p>
          )}

          <div className="mt-6 grid gap-5">
            {positions.map((position, index) => {
              const positionOptions = getOptionsForPosition(position);
              const positionValue = winnerValues[position] ?? "";
              const isPodium = position <= 3;

              return (
                <div
                  key={position}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    position === 1
                      ? "border-amber-500/40 bg-amber-500/[0.05]"
                      : position === 2
                        ? "border-slate-400/40 bg-slate-400/[0.05]"
                        : position === 3
                          ? "border-amber-700/40 bg-amber-700/[0.05]"
                          : "border-cyan-500/30 bg-cyan-500/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {position === 1
                          ? "🥇 1st Place"
                          : position === 2
                            ? "🥈 2nd Place"
                            : position === 3
                              ? "🥉 3rd Place"
                              : `🎖️ ${getOrdinal(position)} Place (Below 3rd)`}
                      </span>
                      {!isPodium && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Additional Placement
                        </span>
                      )}
                    </div>
                    {positions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlacementAtIndex(index)}
                        className="text-xs text-red-400 hover:text-red-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer font-medium"
                        title={`Delete this ${getOrdinal(position)} place field`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Field
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <SearchSelect
                      name={`winner_${position}`}
                      required={index === 0}
                      value={positionValue}
                      onValueChange={(value) => {
                        setWinnerValues((prev) => ({ ...prev, [position]: value }));
                        setDuplicateError("");
                      }}
                      options={positionOptions}
                      placeholder={`Search ${isSingle ? "student" : "team"} for ${getOrdinal(position)} place...`}
                      disabled={!hasEligibleCandidates}
                    />
                  </div>

                  {isSingle ? (
                    <div className="mt-3">
                      <SearchSelect
                        name={`grade_${position}`}
                        value={gradeValues[position] ?? (isPodium ? "A" : "none")}
                        onValueChange={(val) => {
                          setGradeValues((prev) => ({ ...prev, [position]: val as GradeType }));
                        }}
                        disabled={!hasEligibleCandidates}
                        options={gradeOptions}
                        placeholder="Select grade"
                      />
                    </div>
                  ) : (
                    <input type="hidden" name={`grade_${position}`} value="none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons to Add More Fields, 3 Below Fields, or Delete Last Field */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={addPlacement}
              className="gap-2 border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
            >
              + Add Placement ({getOrdinal(positions.length > 0 ? Math.max(...positions) + 1 : 1)})
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={addThreeBelowPlacements}
              className="gap-2 border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 text-xs font-semibold"
            >
              + Add 3 Below Fields (
              {getOrdinal((positions.length > 0 ? Math.max(...positions) : 0) + 1)},{" "}
              {getOrdinal((positions.length > 0 ? Math.max(...positions) : 0) + 2)},{" "}
              {getOrdinal((positions.length > 0 ? Math.max(...positions) : 0) + 3)})
            </Button>

            {positions.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => removePlacementAtIndex(positions.length - 1)}
                className="gap-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold"
              >
                🗑️ Delete Last Field ({getOrdinal(positions[positions.length - 1])})
              </Button>
            )}
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
            <p className="text-white/80">Single events combine placement points and grade bonuses.</p>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="font-semibold text-white">Single · Podium Points</p>
              <p className="text-white/70">
                1st: {scoringRules?.single.first ?? 10} pts · 2nd: {scoringRules?.single.second ?? 7} pts · 3rd: {scoringRules?.single.third ?? 5} pts
              </p>
              <p className="font-semibold text-white mt-1">Grade Bonus Points</p>
              <p className="text-emerald-400">
                Grade A: +{scoringRules?.single.gradeA ?? 5} pts · Grade B: +{scoringRules?.single.gradeB ?? 3} pts · Grade C: +{scoringRules?.single.gradeC ?? 1} pts
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="font-semibold text-white">Group · Podium Points</p>
              <p className="text-white/70">
                1st: {scoringRules?.group.first ?? 20} pts · 2nd: {scoringRules?.group.second ?? 15} pts · 3rd: {scoringRules?.group.third ?? 10} pts
              </p>
              <p className="font-semibold text-white mt-1">General · Podium Points</p>
              <p className="text-white/70">
                1st: {scoringRules?.general.first ?? 25} pts · 2nd: {scoringRules?.general.second ?? 20} pts · 3rd: {scoringRules?.general.third ?? 15} pts
              </p>
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

