"use client";

import { ProgramsGrid } from "@/components/programs-grid";
import { useResultUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import type { Program, ResultRecord, Student, Team } from "@/lib/types";

interface ResultsRealtimeProps {
  programs: Program[];
  results: ResultRecord[];
  programMap: Map<string, Program>;
  students: Student[];
  teams: Team[];
}

export function ResultsRealtime({
  programs: initialPrograms,
  results: initialResults,
  programMap: initialProgramMap,
  students,
  teams,
}: ResultsRealtimeProps) {
  const router = useRouter();

  useResultUpdates(() => {
    router.refresh();
  });

  return (
    <ProgramsGrid
      programs={initialPrograms}
      results={initialResults}
      programMap={initialProgramMap}
      students={students}
      teams={teams}
    />
  );
}










