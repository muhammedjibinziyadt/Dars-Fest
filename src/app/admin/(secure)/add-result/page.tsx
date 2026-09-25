import { redirect } from "next/navigation";
import { AddResultForm } from "@/components/forms/add-result-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getApprovedResults, getJuries, getPrograms, getStudents, getTeams, getOrCreateAdminJury } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import { ensureRegisteredCandidates } from "@/lib/registration-guard";
import { submitResultToPending, parsePlacementPayloads } from "@/lib/result-service";
import { redirectWithToast } from "@/lib/actions";
import { revalidatePath } from "next/cache";

type PenaltyFormPayload = {
  id: string;
  type: "student" | "team";
  points: number;
};

function parsePenaltyPayloads(formData: FormData): PenaltyFormPayload[] {
  const rowValue = String(formData.get("penalty_rows") ?? "");
  const rowIds = rowValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return rowIds
    .map((rowId) => {
      const target = String(formData.get(`penalty_target_${rowId}`) ?? "").trim();
      const type = String(formData.get(`penalty_type_${rowId}`) ?? "").trim();
      const pointsRaw = String(formData.get(`penalty_points_${rowId}`) ?? "").trim();
      const points = pointsRaw ? Math.abs(Number(pointsRaw)) : 0;
      if (!target || points <= 0 || (type !== "student" && type !== "team") || Number.isNaN(points)) {
        return null;
      }
      return {
        id: target,
        type,
        points,
      } satisfies PenaltyFormPayload;
    })
    .filter((penalty): penalty is PenaltyFormPayload => Boolean(penalty));
}

async function submitResultAction(formData: FormData) {
  "use server";
  try {
    const programId = String(formData.get("program_id") ?? "");
    let juryId = String(formData.get("jury_id") ?? "").trim();
    
    // If no jury is selected, default to admin jury
    if (!juryId) {
      // Try to get from hidden field first, otherwise create/fetch admin jury
      const defaultJuryId = String(formData.get("default_jury_id") ?? "").trim();
      if (defaultJuryId) {
        juryId = defaultJuryId;
      } else {
        const adminJury = await getOrCreateAdminJury();
        juryId = adminJury.id;
      }
    }

    // Collect winners dynamically (supports 1, 2, 3, 4 or more candidates)
    const winners = parsePlacementPayloads(formData);
    if (winners.length === 0) {
      redirectWithToast("/admin/add-result", "At least one candidate placement is required.", "error");
      return;
    }

    // Validate that candidates are unique
    const winnerIds = winners.map((w) => w.id);
    const uniqueWinnerIds = new Set(winnerIds);
    if (uniqueWinnerIds.size !== winners.length) {
      redirectWithToast("/admin/add-result", "Each candidate can only be awarded one placement.", "error");
      return;
    }

    const penalties = parsePenaltyPayloads(formData);

    await ensureRegisteredCandidates(programId, [
      ...winners.map((winner) => winner.id),
      ...penalties.map((penalty) => penalty.id),
    ]);

    const notes = String(formData.get("notes") ?? "").trim();

    try {
      await submitResultToPending({
        programId,
        juryId,
        winners,
        penalties,
        notes,
      });
      revalidatePath("/admin/pending-results");
      redirectWithToast("/admin/pending-results", "Result submitted successfully! Waiting for approval.", "success");
    } catch (error: any) {
      // Handle published program error
      if (error.message?.includes("Program already published") || error.message?.includes("already published")) {
        redirectWithToast("/admin/add-result", "Program already published", "error");
        return;
      }
      // Handle duplicate result submission error
      if (error.message?.includes("already exists") || error.message?.includes("already been approved")) {
        redirectWithToast("/admin/add-result", error.message, "error");
        return;
      }
      redirectWithToast("/admin/add-result", `Failed to submit result: ${error.message}`, "error");
    }
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    redirectWithToast("/admin/add-result", error?.message || "Failed to submit result", "error");
  }
}

export default async function AddResultPage() {
  const [programs, students, teams, juries, registrations, approvedResults, adminJury] = await Promise.all([
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
    getProgramRegistrations(),
    getApprovedResults(),
    getOrCreateAdminJury(),
  ]);

  // Filter out programs that are already approved/published
  const approvedProgramIds = new Set(approvedResults.map((result) => result.program_id));
  const availablePrograms = programs.filter((program) => !approvedProgramIds.has(program.id));

  if (availablePrograms.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Add result (3 steps)</h1>
        <Card className="border-amber-500/40 bg-amber-500/10 p-6">
          <CardTitle>No Programs Available</CardTitle>
          <CardDescription className="mt-2">
            All programs have been published. No results can be added at this time.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Add result (3 steps)</h1>
      <AddResultForm
        programs={availablePrograms}
        students={students}
        teams={teams}
        juries={juries}
        registrations={registrations}
        approvedResults={approvedResults}
        action={submitResultAction}
        defaultJuryId={adminJury.id}
      />
    </div>
  );
}

