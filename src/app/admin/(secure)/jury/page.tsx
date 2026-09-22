import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createJury,
  deleteJuryById,
  getJuries,
  getAssignments,
  updateJuryById,
} from "@/lib/data";
import { JuryCardWrapper } from "@/components/jury-card-wrapper";
import { redirectWithToast } from "@/lib/actions";

const jurySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  password: z.string().min(4),
});

async function upsertJury(formData: FormData, mode: "create" | "update") {
  const parsed = jurySchema.safeParse({
    id: formData.get("id") ?? undefined,
    name: String(formData.get("name") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
  }
  const payload = parsed.data;

  if (mode === "create") {
    await createJury({
      name: payload.name,
      password: payload.password,
    });
  } else {
    if (!payload.id) throw new Error("Jury ID required");
    await updateJuryById(payload.id, {
      name: payload.name,
      password: payload.password,
    });
  }

  revalidatePath("/admin/jury");
}

async function deleteJuryAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? "");
    await deleteJuryById(id);
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", "Jury member deleted successfully!", "error");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", error?.message || "Failed to delete jury member", "error");
  }
}

async function createJuryAction(formData: FormData) {
  "use server";
  try {
    await upsertJury(formData, "create");
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", "Jury member created successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", error?.message || "Failed to create jury member", "error");
  }
}

async function updateJuryAction(formData: FormData) {
  "use server";
  try {
    await upsertJury(formData, "update");
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", "Jury member updated successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/jury");
    redirectWithToast("/admin/jury", error?.message || "Failed to update jury member", "error");
  }
}

export default async function JuryManagementPage() {
  const [juryList, assignments] = await Promise.all([
    getJuries(),
    getAssignments(),
  ]);

  // Count assignments per jury
  const assignmentCounts = new Map<string, number>();
  assignments.forEach((assignment) => {
    const count = assignmentCounts.get(assignment.jury_id) || 0;
    assignmentCounts.set(assignment.jury_id, count + 1);
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle>Add Jury</CardTitle>
        <CardDescription className="mt-2">
          Generate credentials for jury login portal.
        </CardDescription>
        <form action={createJuryAction} className="mt-6 grid gap-4 md:grid-cols-3">
          <Input name="name" placeholder="Full name" required />
          <Input name="password" placeholder="Password" required />
          <Button type="submit">Create Jury</Button>
        </form>
      </Card>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {juryList.map((jury) => (
          <JuryCardWrapper
            key={jury.id}
            jury={jury}
            assignmentCount={assignmentCounts.get(jury.id) || 0}
            updateAction={updateJuryAction}
            deleteAction={deleteJuryAction}
          />
        ))}
      </div>
      {juryList.length === 0 && (
        <Card>
          <CardTitle>No Jury Members</CardTitle>
          <CardDescription>
            Create your first jury member to get started.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}

