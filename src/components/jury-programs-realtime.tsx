"use client";

import { useAssignmentUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import { JuryAssignmentsBoard } from "@/components/jury-assignments-board";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { AssignedProgram } from "@/lib/types";

interface EnrichedAssignment {
  id: string;
  programId: string;
  programName: string;
  section: string;
  category: string;
  stage: boolean;
  status: AssignedProgram["status"];
}

interface JuryProgramsRealtimeProps {
  assignments: EnrichedAssignment[];
}

export function JuryProgramsRealtime({ assignments: initialAssignments }: JuryProgramsRealtimeProps) {
  const router = useRouter();

  useAssignmentUpdates(() => {
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/50">
          Jury workspace
        </p>
        <h1 className="text-3xl font-bold text-white">Assigned Programs</h1>
        <p className="text-sm text-white/70">
          Track everything assigned to you, filter by status, and jump into result forms without
          losing context.
        </p>
      </div>

      {initialAssignments.length === 0 ? (
        <Card>
          <CardTitle>No assignments yet</CardTitle>
          <CardDescription>
            Once admins assign events to you, they will appear here.
          </CardDescription>
        </Card>
      ) : (
        <JuryAssignmentsBoard assignments={initialAssignments} />
      )}
    </div>
  );
}










