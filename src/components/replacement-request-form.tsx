"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { SearchSelect } from "@/components/ui/search-select";
import { Textarea } from "@/components/ui/textarea";
import type { Program, ProgramRegistration, PortalStudent } from "@/lib/types";

interface ReplacementRequestFormProps {
  programs: Program[];
  teamRegistrations: ProgramRegistration[];
  teamStudents: PortalStudent[];
  submitAction: (formData: FormData) => Promise<void>;
}

export function ReplacementRequestForm({
  programs,
  teamRegistrations,
  teamStudents,
  submitAction,
}: ReplacementRequestFormProps) {
  const [programId, setProgramId] = useState("");
  const [oldStudentId, setOldStudentId] = useState("");
  const [newStudentId, setNewStudentId] = useState("");

  const programOptions = programs
    .filter((program) => teamRegistrations.some((r) => r.programId === program.id))
    .map((program) => ({
      value: program.id,
      label: program.name,
      meta: `${program.section} · ${program.category !== "none" ? `Cat ${program.category}` : "General"}`,
    }));

  const currentStudentOptions = teamRegistrations
    .map((registration) => {
      const student = teamStudents.find((s) => s.id === registration.studentId);
      if (!student) return null;
      return {
        value: student.id,
        label: `${student.name} (Chest: ${student.chestNumber})`,
        meta: registration.programName,
      };
    })
    .filter((option): option is { value: string; label: string; meta: string } => option !== null);

  const replacementStudentOptions = teamStudents.map((student) => ({
    value: student.id,
    label: `${student.name} (Chest: ${student.chestNumber})`,
    meta: `Team: ${student.teamName}`,
  }));

  const filteredCurrentStudentOptions = programId
    ? currentStudentOptions.filter((option) => {
        const registration = teamRegistrations.find(
          (r) => r.studentId === option.value && r.programId === programId,
        );
        return registration !== undefined;
      })
    : currentStudentOptions;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submitAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-white/90">Program</label>
        <SearchSelect
          name="programId"
          options={programOptions}
          placeholder="Search and select a program"
          value={programId}
          onValueChange={(value) => {
            setProgramId(value);
            setOldStudentId(""); // Reset old student when program changes
          }}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-white/90">
          Current Registered Student
        </label>
        <SearchSelect
          name="oldStudentId"
          options={filteredCurrentStudentOptions}
          placeholder={
            programId
              ? "Search and select current registered student"
              : "Please select a program first"
          }
          value={oldStudentId}
          onValueChange={setOldStudentId}
          disabled={!programId}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-white/90">
          Replacement Student
        </label>
        <SearchSelect
          name="newStudentId"
          options={replacementStudentOptions}
          placeholder="Search and select replacement student"
          value={newStudentId}
          onValueChange={setNewStudentId}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-white/90">Reason</label>
        <Textarea
          name="reason"
          placeholder="Please provide a reason for this replacement request..."
          required
          rows={4}
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" className="w-full">
        Submit Request
      </Button>
    </form>
  );
}

