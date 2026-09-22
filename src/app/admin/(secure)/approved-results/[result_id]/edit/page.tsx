import { redirect } from "next/navigation";
import { AddResultForm } from "@/components/forms/add-result-form";
import {
  getApprovedResultById,
  getJuries,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import type { GradeType } from "@/lib/types";
import { ensureRegisteredCandidates } from "@/lib/registration-guard";
import { updateApprovedResult } from "@/lib/result-service";
import { redirectWithToast } from "@/lib/actions";
import { revalidatePath } from "next/cache";

interface EditApprovedResultPageProps {
  params: Promise<{ result_id: string }>;
}

function buildInitialEntries(result: Awaited<ReturnType<typeof getApprovedResultById>>) {
  const initial: Partial<
    Record<
      1 | 2 | 3,
      {
        winnerId: string;
        grade?: GradeType;
      }
    >
  > = {};
  result?.entries.forEach((entry) => {
    const winnerId = entry.student_id ?? entry.team_id ?? "";
    if (!winnerId) return;
    initial[entry.position as 1 | 2 | 3] = {
      winnerId,
      grade: entry.grade,
    };
  });
  return initial;
}

function buildInitialPenalties(result: Awaited<ReturnType<typeof getApprovedResultById>>) {
  return (
    result?.penalties?.map((penalty) => ({
      targetId: penalty.student_id ?? penalty.team_id ?? "",
      points: penalty.points,
      type: (penalty.student_id ? "student" : "team") as "student" | "team",
    })) ?? []
  );
}

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

export default async function EditApprovedResultPage({
  params,
}: EditApprovedResultPageProps) {
  const { result_id } = await params;
  const result = await getApprovedResultById(result_id);
  if (!result) {
    redirect("/admin/approved-results");
  }

  const [programs, students, teams, juries, registrations] = await Promise.all([
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
    getProgramRegistrations(),
  ]);
  const program = programs.find((item) => item.id === result.program_id);
  const jury = juries.find((item) => item.id === result.jury_id);
  if (!program || !jury) {
    redirect("/admin/approved-results");
  }

  const initial = buildInitialEntries(result);
  const initialPenaltyList = buildInitialPenalties(result);
  const programId = program.id;

  async function updateApprovedAction(formData: FormData) {
    "use server";
    try {
      const winners = [1, 2, 3].map((position) => {
        const value = String(formData.get(`winner_${position}`) ?? "").trim();
        if (!value) {
          throw new Error("All placements are required.");
        }
        const grade = String(formData.get(`grade_${position}`) ?? "none") as GradeType;
        return {
          position: position as 1 | 2 | 3,
          id: value,
          grade,
        };
      });
      const penaltyType = String(formData.get("penalty_type") ?? "none");
      const penaltyTarget = String(formData.get("penalty_target") ?? "").trim();
      const penaltyPointsRaw = String(formData.get("penalty_points") ?? "").trim();
      const penaltyPoints = penaltyPointsRaw ? Math.abs(Number(penaltyPointsRaw)) : 0;
      const penalty =
        penaltyTarget && penaltyPoints > 0 && (penaltyType === "student" || penaltyType === "team")
          ? {
              id: penaltyTarget,
              type: penaltyType,
              points: penaltyPoints,
            }
          : null;

      const penalties = parsePenaltyPayloads(formData);
      await ensureRegisteredCandidates(programId, [
        ...winners.map((winner) => winner.id),
        ...penalties.map((penalty) => penalty.id),
      ]);
      await updateApprovedResult(result_id, winners, penalties);
      revalidatePath("/admin/approved-results");
      redirectWithToast("/admin/approved-results", "Result updated successfully!", "success");
    } catch (error: any) {
      if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
        throw error;
      }
      revalidatePath("/admin/approved-results");
      redirectWithToast(`/admin/approved-results/${result_id}/edit`, error?.message || "Failed to update result", "error");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
        Edit Approved Result • {program.name}
      </h1>
      <AddResultForm
        programs={[program]}
        students={students}
        teams={teams}
        juries={[jury]}
        registrations={registrations}
        action={updateApprovedAction}
        lockProgram
        initial={initial}
        initialPenalties={initialPenaltyList}
        submitLabel="Update Approved Result"
      />
    </div>
  );
}


