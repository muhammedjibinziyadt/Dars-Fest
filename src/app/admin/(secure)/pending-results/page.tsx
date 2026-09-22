import { PendingResultsRealtime } from "@/components/pending-results-realtime";
import {
  getJuries,
  getPendingResults,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { approveResult, rejectResult } from "@/lib/result-service";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/actions";

async function approveResultAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? "");
    await approveResult(id);
    revalidatePath("/admin/pending-results");
    redirectWithToast("/admin/pending-results", "Result approved successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/pending-results");
    redirectWithToast("/admin/pending-results", error?.message || "Failed to approve result", "error");
  }
}

async function rejectResultAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? "");
    await rejectResult(id);
    revalidatePath("/admin/pending-results");
    redirectWithToast("/admin/pending-results", "Result rejected successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/pending-results");
    redirectWithToast("/admin/pending-results", error?.message || "Failed to reject result", "error");
  }
}

export default async function PendingResultsPage() {
  const [pending, programs, juries, students, teams] = await Promise.all([
    getPendingResults(),
    getPrograms(),
    getJuries(),
    getStudents(),
    getTeams(),
  ]);

  return (
    <PendingResultsRealtime
      results={pending}
      programs={programs}
      juries={juries}
      students={students}
      teams={teams}
      approveAction={approveResultAction}
      rejectAction={rejectResultAction}
    />
  );
}

