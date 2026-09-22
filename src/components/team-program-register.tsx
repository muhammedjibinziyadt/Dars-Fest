"use client";

import { useMemo, useState } from "react";
import type { Program, ProgramRegistration, PortalStudent } from "@/lib/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { showError, showWarning } from "@/lib/toast";

interface ProgramWithLimit extends Program {
  candidateLimit: number;
}

interface Props {
  programs: ProgramWithLimit[];
  allPrograms: ProgramWithLimit[];
  teamRegistrations: ProgramRegistration[];
  teamStudents: PortalStudent[];
  isOpen: boolean;
  registerAction: (formData: FormData) => Promise<void>;
  registerMultipleAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
}

function ProgramRegistrationCard({
  program,
  allPrograms,
  registrations,
  availableStudents,
  limitReached,
  remainingSlots,
  isGroupOrGeneral,
  isOpen,
  registerAction,
  registerMultipleAction,
  removeAction,
}: {
  program: ProgramWithLimit;
  allPrograms: ProgramWithLimit[];
  registrations: ProgramRegistration[];
  availableStudents: PortalStudent[];
  limitReached: boolean;
  remainingSlots: number;
  isGroupOrGeneral: boolean;
  isOpen: boolean;
  registerAction: (formData: FormData) => Promise<void>;
  registerMultipleAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
}) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Client-side participation limit check
  const checkStudentLimit = (studentId: string): {
    allowed: boolean;
    reason?: string;
    currentCount?: number;
    maxCount?: number;
  } => {
    // General events have no limit
    if (program.section === "general") {
      return { allowed: true };
    }

    // Get all registrations for this student
    const studentRegistrations = registrations.filter((reg) => reg.studentId === studentId);
    const programMap = new Map(allPrograms.map((p) => [p.id, p]));

    if (program.section === "single") {
      // Individual events: check based on stage (on-stage vs off-stage)
      const sameStageRegistrations = studentRegistrations.filter((reg) => {
        const regProgram = programMap.get(reg.programId);
        return (
          regProgram?.section === "single" &&
          regProgram?.stage === program.stage &&
          reg.programId !== program.id // Exclude current program if already registered
        );
      });

      const maxCount = 3;
      const currentCount = sameStageRegistrations.length;

      if (currentCount >= maxCount) {
        const stageType = program.stage ? "on-stage" : "off-stage";
        return {
          allowed: false,
          reason: `Maximum limit of ${maxCount} individual ${stageType} events reached.`,
          currentCount,
          maxCount,
        };
      }

      return { allowed: true, currentCount, maxCount };
    }

    if (program.section === "group") {
      // Group events: maximum 3
      const groupRegistrations = studentRegistrations.filter((reg) => {
        const regProgram = programMap.get(reg.programId);
        return regProgram?.section === "group" && reg.programId !== program.id;
      });

      const maxCount = 3;
      const currentCount = groupRegistrations.length;

      if (currentCount >= maxCount) {
        return {
          allowed: false,
          reason: `Maximum limit of ${maxCount} group events reached.`,
          currentCount,
          maxCount,
        };
      }

      return { allowed: true, currentCount, maxCount };
    }

    return { allowed: true };
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      // Check if adding this student would exceed the candidate limit
      if (prev.length >= remainingSlots) {
        showWarning(`Cannot select more students. Only ${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining for this program.`);
        return prev;
      }
      // Check participation limits
      const limitCheck = checkStudentLimit(studentId);
      if (!limitCheck.allowed) {
        const student = availableStudents.find(s => s.id === studentId);
        const studentName = student ? student.name : 'This student';
        showError(`${studentName}: ${limitCheck.reason || 'Participation limit reached'}`);
        return prev;
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    const selectableStudents = availableStudents.filter((student) => {
      const limitCheck = checkStudentLimit(student.id);
      return limitCheck.allowed;
    });
    const maxSelectable = Math.min(remainingSlots, selectableStudents.length);
    setSelectedStudents(selectableStudents.slice(0, maxSelectable).map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedStudents.length === 0) return;

    // Validate all selected students before submission
    const invalidStudents: string[] = [];
    for (const studentId of selectedStudents) {
      const limitCheck = checkStudentLimit(studentId);
      if (!limitCheck.allowed) {
        const student = availableStudents.find(s => s.id === studentId);
        invalidStudents.push(student ? student.name : studentId);
      }
    }

    if (invalidStudents.length > 0) {
      showError(`Cannot register: ${invalidStudents.join(', ')} - Participation limit reached.`);
      return;
    }

    // Check if selection exceeds remaining slots
    if (selectedStudents.length > remainingSlots) {
      showWarning(`Cannot register ${selectedStudents.length} students. Only ${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining.`);
      return;
    }

    // For group/general programs, register all selected students at once
    if (isGroupOrGeneral) {
      const formData = new FormData();
      formData.append("programId", program.id);
      formData.append("studentIds", selectedStudents.join(","));
      await registerMultipleAction(formData);
      setSelectedStudents([]);
    } else {
      // For single programs, use the form's default behavior
      const formData = new FormData(e.currentTarget);
      await registerAction(formData);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{program.name}</CardTitle>
          <CardDescription className="mt-1 text-white/70">
            Section: {program.section} · Category: {program.category}
          </CardDescription>
        </div>
        <Badge tone={limitReached ? "pink" : "emerald"}>
          Registered {registrations.length} / {program.candidateLimit}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        {registrations.length === 0 ? (
          <p className="text-sm text-white/60">No entries yet.</p>
        ) : (
          registrations.map((registration) => (
            <div
              key={registration.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-white">{registration.studentName}</p>
                <p className="text-white/60 text-xs">
                  Chest #{registration.studentChest} · {registration.teamName}
                </p>
              </div>
              {isOpen && (
                <form action={removeAction}>
                  <input type="hidden" name="registrationId" value={registration.id} />
                  <Button type="submit" variant="ghost" className="text-red-300 hover:text-red-100">
                    Remove
                  </Button>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      {isOpen && !limitReached && (
        <>
          {isGroupOrGeneral ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input type="hidden" name="programId" value={program.id} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    Select students ({selectedStudents.length} / {remainingSlots} selected)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={availableStudents.length === 0 || remainingSlots === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={selectedStudents.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  {availableStudents.length === 0 ? (
                    <p className="text-sm text-white/60 text-center py-4">
                      No available students to register.
                    </p>
                  ) : (
                    availableStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id);
                      const canSelectBySlots = selectedStudents.length < remainingSlots || isSelected;
                      const limitCheck = checkStudentLimit(student.id);
                      const canSelect = canSelectBySlots && limitCheck.allowed;
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                            isSelected
                              ? "border-fuchsia-400 bg-fuchsia-400/10 cursor-pointer"
                              : canSelect
                                ? "border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
                                : "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStudentToggle(student.id)}
                            disabled={!canSelect}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-white">{student.name}</p>
                            <p className="text-xs text-white/60">
                              Chest #{student.chestNumber} · {student.teamName}
                            </p>
                            {!limitCheck.allowed && (
                              <p className="text-xs text-amber-400 mt-1">{limitCheck.reason}</p>
                            )}
                            {limitCheck.allowed && limitCheck.currentCount !== undefined && (
                              <p className="text-xs text-white/50 mt-1">
                                {limitCheck.currentCount} / {limitCheck.maxCount} {program.section === "single" ? (program.stage ? "on-stage" : "off-stage") : "group"} events
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={selectedStudents.length === 0}
                  className="mt-3 w-full"
                >
                  Register {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </form>
          ) : (
            <form 
              action={async (formData: FormData) => {
                const studentId = formData.get("studentId") as string;
                if (!studentId) {
                  showError("Please select a student.");
                  return;
                }
                
                // Check participation limit before submitting
                const limitCheck = checkStudentLimit(studentId);
                if (!limitCheck.allowed) {
                  const student = availableStudents.find(s => s.id === studentId);
                  const studentName = student ? student.name : 'This student';
                  showError(`${studentName}: ${limitCheck.reason || 'Participation limit reached'}`);
                  return;
                }
                
                // Check if candidate limit is reached
                if (limitReached) {
                  showError("Candidate limit reached for this program.");
                  return;
                }
                
                await registerAction(formData);
                setSelectedStudentId(""); // Reset selection after successful submission
              }} 
              className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]"
            >
              <input type="hidden" name="programId" value={program.id} />
              <SearchSelect
                name="studentId"
                required
                value={selectedStudentId}
                onValueChange={(value) => {
                  setSelectedStudentId(value);
                  if (value) {
                    // Check participation limit when student is selected
                    const limitCheck = checkStudentLimit(value);
                    if (!limitCheck.allowed) {
                      const student = availableStudents.find(s => s.id === value);
                      const studentName = student ? student.name : 'This student';
                      showError(`${studentName}: ${limitCheck.reason || 'Participation limit reached'}`);
                      setSelectedStudentId(""); // Clear selection
                    } else if (limitReached) {
                      showError("Candidate limit reached for this program.");
                      setSelectedStudentId(""); // Clear selection
                    }
                  }
                }}
                defaultValue=""
                placeholder="Select a student"
                options={availableStudents.map((student) => {
                  // Check participation limit for single programs
                  const limitCheck = (() => {
                    if (program.section === "general") return { allowed: true };
                    const studentRegistrations = registrations.filter((reg) => reg.studentId === student.id);
                    const programMap = new Map(allPrograms.map((p) => [p.id, p]));
                    
                    if (program.section === "single") {
                      const sameStageRegistrations = studentRegistrations.filter((reg) => {
                        const regProgram = programMap.get(reg.programId);
                        return (
                          regProgram?.section === "single" &&
                          regProgram?.stage === program.stage &&
                          reg.programId !== program.id
                        );
                      });
                      const maxCount = 3;
                      return {
                        allowed: sameStageRegistrations.length < maxCount,
                        currentCount: sameStageRegistrations.length,
                        maxCount,
                      };
                    }
                    
                    if (program.section === "group") {
                      const groupRegistrations = studentRegistrations.filter((reg) => {
                        const regProgram = programMap.get(reg.programId);
                        return regProgram?.section === "group" && reg.programId !== program.id;
                      });
                      const maxCount = 3;
                      return {
                        allowed: groupRegistrations.length < maxCount,
                        currentCount: groupRegistrations.length,
                        maxCount,
                      };
                    }
                    
                    return { allowed: true };
                  })();
                  
                  const stageType = program.section === "single" ? (program.stage ? "on-stage" : "off-stage") : program.section;
                  const limitText = limitCheck.allowed && limitCheck.currentCount !== undefined
                    ? ` (${limitCheck.currentCount}/3 ${stageType})`
                    : !limitCheck.allowed
                      ? ` - LIMIT REACHED`
                      : "";
                  
                  return {
                    value: student.id,
                    label: `${student.name} · ${student.chestNumber} · ${student.teamName}${limitText}`,
                    meta: !limitCheck.allowed ? "Limit reached" : undefined,
                  };
                })}
              />
              <Button type="submit" disabled={availableStudents.length === 0}>
                Register
              </Button>
            </form>
          )}
        </>
      )}

      {!isOpen && (
        <p className="mt-4 text-sm text-amber-300">Registration window closed.</p>
      )}

      {isOpen && limitReached && (
        <p className="mt-4 text-sm text-amber-300">Candidate limit reached for this program.</p>
      )}
    </Card>
  );
}

export function TeamProgramRegister({
  programs,
  allPrograms,
  isOpen,
  registerAction,
  registerMultipleAction,
  removeAction,
  teamRegistrations,
  teamStudents,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((program) => program.name.toLowerCase().includes(q));
  }, [programs, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
        <p className="text-sm text-white/70">
          Registration window: {isOpen ? "Open" : "Closed"} (controls {isOpen ? "enabled" : "disabled"})
        </p>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search programs..."
          className="mt-3 bg-slate-900/40 text-white placeholder:text-white/50"
        />
      </div>

      {filteredPrograms.map((program) => {
        const registrations = teamRegistrations.filter(
          (registration) => registration.programId === program.id,
        );
        const availableStudents = teamStudents.filter(
          (student) => !registrations.some((registration) => registration.studentId === student.id),
        );
        const limitReached = registrations.length >= program.candidateLimit;
        const isGroupOrGeneral = program.section === "group" || program.section === "general";
        const remainingSlots = program.candidateLimit - registrations.length;

        return (
          <ProgramRegistrationCard
            key={program.id}
            program={program}
            allPrograms={allPrograms}
            registrations={registrations}
            availableStudents={availableStudents}
            limitReached={limitReached}
            remainingSlots={remainingSlots}
            isGroupOrGeneral={isGroupOrGeneral}
            isOpen={isOpen}
            registerAction={registerAction}
            registerMultipleAction={registerMultipleAction}
            removeAction={removeAction}
          />
        );
      })}
    </div>
  );
}
