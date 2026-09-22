import { getCurrentJury } from "@/lib/auth";
import { getAssignments, getPrograms } from "@/lib/data";
import { JuryProgramsRealtime } from "@/components/jury-programs-realtime";

export default async function JuryProgramsPage() {
  const jury = await getCurrentJury();
  const [assignments, programs] = await Promise.all([
    getAssignments(),
    getPrograms(),
  ]);
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const myAssignments = assignments.filter(
    (assignment) => assignment.jury_id === jury?.id,
  );

  const enrichedAssignments = myAssignments
    .map((assignment) => {
      const program = programMap.get(assignment.program_id);
      if (!program) return null;
      return {
        id: `${assignment.program_id}-${assignment.jury_id}`,
        programId: assignment.program_id,
        programName: program.name,
        section: program.section,
        category: program.category,
        stage: program.stage,
        status: assignment.status,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      programId: string;
      programName: string;
      section: string;
      category: string;
      stage: boolean;
      status: (typeof myAssignments)[number]["status"];
    }>;

  return <JuryProgramsRealtime assignments={enrichedAssignments} />;
}

