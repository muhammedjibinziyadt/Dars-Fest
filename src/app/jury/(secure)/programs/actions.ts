"use server";

import { revalidatePath } from "next/cache";
import { getCurrentJury } from "@/lib/auth";
import { updateAssignmentNotes } from "@/lib/data";

export async function saveJudgmentNoteAction(programId: string, notes: string) {
  const jury = await getCurrentJury();
  if (!jury) {
    throw new Error("Unauthorized: Please log in as Jury");
  }

  await updateAssignmentNotes(programId, jury.id, notes);

  revalidatePath("/jury/programs");
  revalidatePath(`/jury/add-result/${programId}`);
  revalidatePath("/admin/pending-results");
  revalidatePath("/admin/approved-results");
  revalidatePath("/admin/assign");

  return { success: true };
}
