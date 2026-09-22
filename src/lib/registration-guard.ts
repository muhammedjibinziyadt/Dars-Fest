import { getPrograms } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";

export async function ensureRegisteredCandidates(programId: string, winnerIds: string[]) {
  const [programs, registrations] = await Promise.all([getPrograms(), getProgramRegistrations()]);
  const program = programs.find((item) => item.id === programId);
  if (!program) {
    throw new Error("Program not found");
  }
  const programRegistrations = registrations.filter((registration) => registration.programId === programId);
  if (programRegistrations.length === 0) {
    throw new Error("No registered candidates for this program.");
  }
  const allowedIds =
    program.section === "single"
      ? new Set(programRegistrations.map((registration) => registration.studentId))
      : new Set(programRegistrations.map((registration) => registration.teamId));
  for (const winnerId of winnerIds) {
    if (!allowedIds.has(winnerId)) {
      throw new Error("Winner must be selected from registered candidates.");
    }
  }
}

