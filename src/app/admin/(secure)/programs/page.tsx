import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import {
  assignProgramToJury,
  createProgram,
  deleteProgramById,
  getApprovedResults,
  getJuries,
  getPrograms,
  updateProgramById,
} from "@/lib/data";
import { getProgramRegistrations, removeRegistrationsByProgram } from "@/lib/team-data";
import { ProgramManager } from "@/components/program-manager";
import { redirectWithToast } from "@/lib/actions";

// Allow larger candidate limits so that big group/general programs can have many participants.
// We keep a reasonable safety upper bound (e.g. 500) to avoid accidental huge numbers.
const programSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Program name is required"),
  section: z.enum(["single", "group", "general"]),
  stage: z.enum(["true", "false"]),
  category: z.enum(["A", "B", "C", "none"]),
  candidateLimit: z
    .coerce.number()
    .min(1, "candidateLimit must be at least 1")
    .max(500, "candidateLimit must be at most 500")
    .default(1),
});

const csvRowSchema = z.object({
  name: z.string().min(2, "Program name is required"),
  section: z.enum(["single", "group", "general"]),
  stage: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => ["true", "false"].includes(value), {
      message: "stage must be true or false",
    })
    .transform((value) => value === "true")
    .pipe(z.boolean()),
  category: z.enum(["A", "B", "C", "none"]),
  candidate_limit: z
    .coerce.number()
    .min(1, "candidate_limit must be at least 1")
    .max(500, "candidate_limit must be at most 500"),
});

async function mutateProgram(
  formData: FormData,
  mode: "create" | "update",
) {
  // Convert FormData values to strings, handling null/undefined
  const idValue = formData.get("id");
  const nameValue = formData.get("name");
  const sectionValue = formData.get("section");
  const stageValue = formData.get("stage");
  const categoryValue = formData.get("category");
  const candidateLimitValue = formData.get("candidateLimit") ?? formData.get("candidate_limit");

  const parsed = programSchema.safeParse({
    id: idValue ? String(idValue) : undefined,
    name: nameValue ? String(nameValue).trim() : "",
    section: sectionValue ? String(sectionValue) : "single",
    stage: stageValue ? String(stageValue) : "true",
    category: categoryValue ? String(categoryValue) : "A",
    candidateLimit: candidateLimitValue ? String(candidateLimitValue) : "1",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const payload = parsed.data;
  const stage = payload.stage === "true";
  const candidateLimit = payload.candidateLimit ?? 1;

  if (mode === "create") {
    await createProgram({
      name: payload.name,
      section: payload.section,
      stage,
      category: payload.category,
      candidateLimit,
    });
  } else {
    if (!payload.id) throw new Error("Program ID required");
    await updateProgramById(payload.id, {
      name: payload.name,
      section: payload.section,
      stage,
      category: payload.category,
      candidateLimit,
    });
  }

  revalidatePath("/admin/programs");
}


async function bulkDeleteProgramsAction(formData: FormData) {
  "use server";
  try {
    const ids = String(formData.get("program_ids") ?? "");
    const programIds = ids
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (programIds.length === 0) {
      revalidatePath("/admin/programs");
      redirectWithToast("/admin/programs", "No programs selected for deletion.", "error");
      return;
    }
    for (const programId of programIds) {
      await deleteProgramById(programId);
      await removeRegistrationsByProgram(programId);
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", `Successfully deleted ${programIds.length} program(s)!`, "error");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to delete programs", "error");
  }
}

const bulkAssignSchema = z.object({
  program_ids: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((value) => value.length > 0, "No programs selected."),
  jury_id: z.string().min(1, "Jury is required."),
});

async function bulkAssignProgramsAction(formData: FormData) {
  "use server";
  try {
    const parsed = bulkAssignSchema.safeParse({
      program_ids: String(formData.get("program_ids") ?? ""),
      jury_id: String(formData.get("jury_id") ?? ""),
    });
    if (!parsed.success) {
      revalidatePath("/admin/programs");
      redirectWithToast("/admin/programs", parsed.error.issues.map((issue) => issue.message).join(", "), "error");
      return;
    }
    const { program_ids, jury_id } = parsed.data;
    const errors: string[] = [];
    let successCount = 0;
    
    for (const programId of program_ids) {
      try {
        await assignProgramToJury(programId, jury_id);
        successCount++;
      } catch (error: any) {
        // Collect errors but continue processing other assignments
        if (error.message.includes("already assigned")) {
          // Silently skip if already assigned (idempotent operation)
          successCount++;
        } else if (error.message.includes("already published")) {
          // Skip approved programs with a clear error message
          errors.push(`Program ${programId}: ${error.message}`);
        } else {
          errors.push(`Program ${programId}: ${error.message}`);
        }
      }
    }
    
    revalidatePath("/admin/assign");
    revalidatePath("/admin/programs");
    
    if (errors.length > 0 && successCount === 0) {
      redirectWithToast("/admin/programs", `All assignments failed: ${errors.join("; ")}`, "error");
      return;
    }
    
    if (errors.length > 0) {
      // Partial success
      redirectWithToast("/admin/programs", `Partially completed: ${successCount} assigned, ${errors.length} failed. ${errors.join("; ")}`, "warning");
      return;
    }
    
    redirectWithToast("/admin/programs", `Successfully assigned ${successCount} program(s)!`, "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to assign programs", "error");
  }
}

async function createProgramAction(formData: FormData) {
  "use server";
  try {
    await mutateProgram(formData, "create");
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", "New program saved successfully", "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to create program", "error");
  }
}

async function updateProgramAction(formData: FormData) {
  "use server";
  try {
    await mutateProgram(formData, "update");
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", "Program updated successfully!", "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to update program", "error");
  }
}

async function deleteProgramAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? "");
    await deleteProgramById(id);
    await removeRegistrationsByProgram(id);
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", "Program deleted successfully!", "error");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to delete program", "error");
  }
}

function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [];
  }
  const [headerLine, ...rows] = lines;
  const headers = headerLine
    .split(",")
    .map((header) => header.trim().toLowerCase());
  const requiredHeaders = ["name", "section", "stage", "category", "candidate_limit"];
  for (const column of requiredHeaders) {
    if (!headers.includes(column)) {
      throw new Error(`Missing "${column}" column in CSV header.`);
    }
  }
  const indices = requiredHeaders.map((column) => headers.indexOf(column));
  return rows.map((row, index) => {
    const cells = row.split(",").map((cell) => cell.trim());
    if (cells.length < headers.length) {
      throw new Error(`Row ${index + 2} is incomplete.`);
    }
    const data = Object.fromEntries(
      requiredHeaders.map((column, idx) => [column, cells[indices[idx]] ?? ""]),
    );
    return { row: index + 2, data };
  });
}

async function importProgramsAction(formData: FormData) {
  "use server";
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      revalidatePath("/admin/programs");
      redirectWithToast("/admin/programs", "Please upload a CSV file.", "error");
      return;
    }
    const text = await file.text();
    const entries = parseCsv(text);
    if (entries.length === 0) {
      revalidatePath("/admin/programs");
      redirectWithToast("/admin/programs", "CSV file does not contain any data rows.", "error");
      return;
    }
    let successCount = 0;
    for (const entry of entries) {
      const parsed = csvRowSchema.safeParse(entry.data);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join(", ");
        revalidatePath("/admin/programs");
        redirectWithToast("/admin/programs", `Row ${entry.row}: ${message}`, "error");
        return;
      }
      await createProgram({
        name: parsed.data.name,
        section: parsed.data.section,
        stage: parsed.data.stage,
        category: parsed.data.category,
        candidateLimit: parsed.data.candidate_limit,
      });
      successCount++;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", `Successfully imported ${successCount} program(s)!`, "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/programs");
    redirectWithToast("/admin/programs", error?.message || "Failed to import programs", "error");
  }
}

export default async function ProgramsPage() {
  const [programs, juries, registrations] = await Promise.all([
    getPrograms(),
    getJuries(),
    getProgramRegistrations(),
  ]);

  const programsWithLimits = programs.map((program) => ({
    ...program,
    candidateLimit: program.candidateLimit ?? 1,
  }));
  const registrationCounts = registrations.reduce<Record<string, number>>((acc, registration) => {
    acc[registration.programId] = (acc[registration.programId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-full">
        <CardTitle>Create Program</CardTitle>
        <CardDescription className="mt-2">
          Add programs with section, stage and category metadata.
        </CardDescription>
        <form
          action={createProgramAction}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <Input name="name" placeholder="Program name" required />
          <SearchSelect
            name="section"
            defaultValue="single"
            required
            options={[
              { value: "single", label: "Single" },
              { value: "group", label: "Group" },
              { value: "general", label: "General" },
            ]}
            placeholder="Select section"
          />
          <SearchSelect
            name="category"
            defaultValue="A"
            options={[
              { value: "A", label: "Category A" },
              { value: "B", label: "Category B" },
              { value: "C", label: "Category C" },
              { value: "none", label: "None" },
            ]}
            placeholder="Select category"
          />
          <SearchSelect
            name="stage"
            defaultValue="true"
            options={[
              { value: "true", label: "On Stage" },
              { value: "false", label: "Off Stage" },
            ]}
            placeholder="Select stage"
          />
          <Input
            name="candidateLimit"
            type="number"
            min={1}
            defaultValue={1}
            placeholder="Candidate limit"
            required
          />
          <Button type="submit" className="md:col-span-2">
            Save Program
          </Button>
        </form>
      </Card>
      <Card className="h-full">
        <CardTitle>Bulk Import (CSV)</CardTitle>
        <CardDescription className="mt-2">
          Required columns: <code>name, section, stage, category, candidate_limit</code>
        </CardDescription>
        <form
          action={importProgramsAction}
          className="mt-6 flex flex-col gap-4 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="text-sm font-semibold text-white/70">
              CSV File
            </label>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-fuchsia-400 focus:outline-none"
            />
          </div>
          <Button type="submit">Import CSV</Button>
        </form>
      </Card>
      </div>

      <ProgramManager
        programs={programsWithLimits}
        updateAction={updateProgramAction}
        deleteAction={deleteProgramAction}
        bulkDeleteAction={bulkDeleteProgramsAction}
        bulkAssignAction={bulkAssignProgramsAction}
        juries={juries}
        candidateCounts={registrationCounts}
      />
    </div>
  );
}

