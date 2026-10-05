"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Program, ProgramRegistration, PortalStudent } from "@/lib/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { showError, showSuccess, showWarning } from "@/lib/toast";
import { useRegistrationUpdates } from "@/hooks/use-realtime";

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  registration?: ProgramRegistration;
  registrations?: ProgramRegistration[];
  registrationId?: string;
}

interface ProgramWithLimit extends Program {
  candidateLimit: number;
}

interface Props {
  programs: ProgramWithLimit[];
  allPrograms: ProgramWithLimit[];
  teamRegistrations: ProgramRegistration[];
  teamStudents: PortalStudent[];
  isOpen: boolean;
  registerAction: (formData: FormData) => Promise<ActionResponse>;
  registerMultipleAction: (formData: FormData) => Promise<ActionResponse>;
  removeAction: (formData: FormData) => Promise<ActionResponse>;
}

function ProgramRegistrationCard({
  program,
  registrations,
  availableStudents,
  limitReached,
  remainingSlots,
  isGroupOrGeneral,
  isOpen,
  registerAction,
  registerMultipleAction,
  removeAction,
  onRegistrationAdded,
  onMultipleRegistrationsAdded,
  onRegistrationRemoved,
}: {
  program: ProgramWithLimit;
  allPrograms: ProgramWithLimit[];
  registrations: ProgramRegistration[];
  availableStudents: PortalStudent[];
  limitReached: boolean;
  remainingSlots: number;
  isGroupOrGeneral: boolean;
  isOpen: boolean;
  registerAction: (formData: FormData) => Promise<ActionResponse>;
  registerMultipleAction: (formData: FormData) => Promise<ActionResponse>;
  removeAction: (formData: FormData) => Promise<ActionResponse>;
  onRegistrationAdded: (reg: ProgramRegistration) => void;
  onMultipleRegistrationsAdded: (regs: ProgramRegistration[]) => void;
  onRegistrationRemoved: (id: string) => void;
}) {
  const router = useRouter();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      if (prev.length >= remainingSlots) {
        showWarning(
          `Cannot select more students. Only ${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} remaining for this program.`
        );
        return prev;
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    const maxSelectable = Math.min(remainingSlots, availableStudents.length);
    setSelectedStudents(availableStudents.slice(0, maxSelectable).map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleGroupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedStudents.length === 0) {
      showError("Please select at least one student.");
      return;
    }

    if (selectedStudents.length > remainingSlots) {
      showWarning(
        `Cannot register ${selectedStudents.length} students. Only ${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} remaining.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("programId", program.id);
      formData.append("studentIds", selectedStudents.join(","));

      const result = await registerMultipleAction(formData);

      if (!result.success) {
        showError(result.error || "Registration failed.");
        return;
      }

      showSuccess(result.message || `Successfully registered ${selectedStudents.length} students!`);
      setSelectedStudents([]);

      if (result.registrations && result.registrations.length > 0) {
        onMultipleRegistrationsAdded(result.registrations);
      }

      router.refresh();
    } catch (error: any) {
      if (error?.message && !error.message.includes("NEXT_REDIRECT")) {
        showError(error.message || "Registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedStudentId) {
      showError("Please select a student.");
      return;
    }

    if (limitReached) {
      showError("Candidate limit reached for this program.");
      return;
    }

    const student = availableStudents.find((s) => s.id === selectedStudentId);
    if (!student) {
      showError("Selected student is not available.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("programId", program.id);
      formData.append("studentId", selectedStudentId);

      const result = await registerAction(formData);

      if (!result.success) {
        showError(result.error || "Registration failed.");
        return;
      }

      showSuccess(result.message || `Successfully registered ${student.name}!`);
      setSelectedStudentId("");

      if (result.registration) {
        onRegistrationAdded(result.registration);
      }

      router.refresh();
    } catch (error: any) {
      if (error?.message && !error.message.includes("NEXT_REDIRECT")) {
        showError(error.message || "Registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (registrationId: string) => {
    if (removingId) return;

    setRemovingId(registrationId);
    try {
      const formData = new FormData();
      formData.append("registrationId", registrationId);

      const result = await removeAction(formData);

      if (!result.success) {
        showError(result.error || "Failed to remove registration.");
        return;
      }

      showSuccess(result.message || "Registration removed.");
      onRegistrationRemoved(registrationId);
      router.refresh();
    } catch (error: any) {
      if (error?.message && !error.message.includes("NEXT_REDIRECT")) {
        showError(error.message || "Failed to remove registration.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{program.name}</CardTitle>
          <CardDescription className="mt-1 text-white/70">
            Section: {program.section}
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
          registrations.map((registration) => {
            const isRemoving = removingId === registration.id;
            return (
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRemoving || isSubmitting}
                    onClick={() => handleRemove(registration.id)}
                    className="text-red-300 hover:text-red-100 disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-300" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {isOpen && !limitReached && (
        <>
          {isGroupOrGeneral ? (
            <form onSubmit={handleGroupSubmit} className="mt-4 space-y-4">
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
                      disabled={isSubmitting || availableStudents.length === 0 || remainingSlots === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={isSubmitting || selectedStudents.length === 0}
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
                      const canSelect = selectedStudents.length < remainingSlots || isSelected;
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
                            disabled={!canSelect || isSubmitting}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-white">{student.name}</p>
                            <p className="text-xs text-white/60">
                              Chest #{student.chestNumber} · {student.teamName}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedStudents.length === 0}
                  className="mt-3 w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    `Register ${selectedStudents.length} Student${selectedStudents.length !== 1 ? "s" : ""}`
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSingleSubmit} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
              <SearchSelect
                name="studentId"
                required
                value={selectedStudentId}
                onValueChange={(value) => {
                  if (limitReached) {
                    showError("Candidate limit reached for this program.");
                    setSelectedStudentId("");
                    return;
                  }
                  setSelectedStudentId(value);
                }}
                defaultValue=""
                placeholder="Select a student"
                options={availableStudents.map((student) => ({
                  value: student.id,
                  label: `${student.name} · ${student.chestNumber} · ${student.teamName}`,
                }))}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !selectedStudentId || availableStudents.length === 0}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </span>
                ) : (
                  "Register"
                )}
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
  const router = useRouter();
  const [registrations, setRegistrations] = useState<ProgramRegistration[]>(teamRegistrations);
  const [query, setQuery] = useState("");

  // Sync state when props change
  useEffect(() => {
    setRegistrations(teamRegistrations);
  }, [teamRegistrations]);

  // Real-time updates subscription to lightweight system_meta/registrations
  useRegistrationUpdates(() => {
    router.refresh();
  });

  const handleRegistrationAdded = useCallback((newReg: ProgramRegistration) => {
    setRegistrations((prev) => {
      if (prev.some((r) => r.id === newReg.id)) return prev;
      return [...prev, newReg];
    });
  }, []);

  const handleMultipleRegistrationsAdded = useCallback((newRegs: ProgramRegistration[]) => {
    setRegistrations((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filtered = newRegs.filter((r) => !existingIds.has(r.id));
      return [...prev, ...filtered];
    });
  }, []);

  const handleRegistrationRemoved = useCallback((removedId: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== removedId));
  }, []);

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
        const programRegistrations = registrations.filter(
          (registration) => registration.programId === program.id
        );
        const availableStudents = teamStudents.filter(
          (student) => !registrations.some((registration) => registration.studentId === student.id && registration.programId === program.id)
        );
        const limitReached = programRegistrations.length >= program.candidateLimit;
        const isGroupOrGeneral = program.section === "group" || program.section === "general";
        const remainingSlots = Math.max(0, program.candidateLimit - programRegistrations.length);

        return (
          <ProgramRegistrationCard
            key={program.id}
            program={program}
            allPrograms={allPrograms}
            registrations={programRegistrations}
            availableStudents={availableStudents}
            limitReached={limitReached}
            remainingSlots={remainingSlots}
            isGroupOrGeneral={isGroupOrGeneral}
            isOpen={isOpen}
            registerAction={registerAction}
            registerMultipleAction={registerMultipleAction}
            removeAction={removeAction}
            onRegistrationAdded={handleRegistrationAdded}
            onMultipleRegistrationsAdded={handleMultipleRegistrationsAdded}
            onRegistrationRemoved={handleRegistrationRemoved}
          />
        );
      })}
    </div>
  );
}
