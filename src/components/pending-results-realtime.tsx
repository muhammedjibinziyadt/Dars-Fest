"use client";

import { ResultManager } from "@/components/result-manager";
import { useResultUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { AssignedProgram, Jury, Program, ResultRecord, Student, Team } from "@/lib/types";

interface PendingResultsRealtimeProps {
  results: ResultRecord[];
  programs: Program[];
  juries: Jury[];
  students: Student[];
  teams: Team[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}

export function PendingResultsRealtime({
  results: initialResults,
  programs,
  juries,
  students,
  teams,
  approveAction,
  rejectAction,
}: PendingResultsRealtimeProps) {
  const router = useRouter();

  useResultUpdates(() => {
    router.refresh();
  });

  return (
    <div className="space-y-8">
      <ResultManager
        results={initialResults}
        programs={programs}
        juries={juries}
        students={students}
        teams={teams}
        deleteAction={rejectAction}
        approveAction={approveAction}
        rejectAction={rejectAction}
        isPending={true}
      />
    </div>
  );
}










