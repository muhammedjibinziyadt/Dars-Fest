import { ResultManager } from "@/components/result-manager";
import {
  getApprovedResults,
  getJuries,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { deleteApprovedResult } from "@/lib/result-service";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/actions";

async function deleteApprovedResultAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? "");
    await deleteApprovedResult(id);
    revalidatePath("/admin/approved-results");
    redirectWithToast("/admin/approved-results", "Result deleted successfully!", "error");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/approved-results");
    redirectWithToast("/admin/approved-results", error?.message || "Failed to delete result", "error");
  }
}

export default async function ApprovedResultsAdminPage() {
  const [results, programs, students, teams, juries] = await Promise.all([
    getApprovedResults(),
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
  ]);

  return (
    <div className="space-y-8">
      <ResultManager
        results={results}
        programs={programs}
        juries={juries}
        students={students}
        teams={teams}
        deleteAction={deleteApprovedResultAction}
        isPending={false}
      />
    </div>
  );
}

