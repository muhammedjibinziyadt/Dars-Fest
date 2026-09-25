import { getCurrentJury } from "@/lib/auth";
import { getApprovedResults, getAssignments, getPendingResults, getPrograms } from "@/lib/data";
import { JuryProgramsRealtime } from "@/components/jury-programs-realtime";

export default async function JuryProgramsPage() {
  const jury = await getCurrentJury();
  const [assignments, programs, pendingResults, approvedResults] = await Promise.all([
    getAssignments(),
    getPrograms(),
    getPendingResults(),
    getApprovedResults(),
  ]);
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const myAssignments = assignments.filter(
    (assignment) => assignment.jury_id === jury?.id,
  );

  const enrichedAssignments = myAssignments
    .map((assignment) => {
      const program = programMap.get(assignment.program_id);
      if (!program) return null;

      const resultNote =
        pendingResults.find((r) => r.program_id === assignment.program_id && r.jury_id === jury?.id)?.notes ||
        approvedResults.find((r) => r.program_id === assignment.program_id && r.jury_id === jury?.id)?.notes ||
        assignment.notes ||
        "";

      return {
        id: `${assignment.program_id}-${assignment.jury_id}`,
        programId: assignment.program_id,
        programName: program.name,
        section: program.section,
        stage: program.stage,
        status: assignment.status,
        notes: resultNote,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      programId: string;
      programName: string;
      section: string;
      stage: boolean;
      status: (typeof myAssignments)[number]["status"];
      notes: string;
    }>;

  return <JuryProgramsRealtime assignments={enrichedAssignments} />;
}

