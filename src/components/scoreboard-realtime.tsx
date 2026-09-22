"use client";

import { ScoreboardTable } from "@/components/scoreboard-table";
import { useScoreboardUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import type { Program, ResultRecord, Student, Team } from "@/lib/types";

interface ScoreboardRealtimeProps {
  teams: Team[];
  programs: Program[];
  results: ResultRecord[];
  students: Student[];
  liveScores: Map<string, number>;
}

export function ScoreboardRealtime({
  teams: initialTeams,
  programs,
  results: initialResults,
  students,
  liveScores: initialLiveScores,
}: ScoreboardRealtimeProps) {
  const router = useRouter();

  useScoreboardUpdates(() => {
    router.refresh();
  });

  return (
    <ScoreboardTable
      teams={initialTeams}
      programs={programs}
      results={initialResults}
      students={students}
      liveScores={initialLiveScores}
    />
  );
}










