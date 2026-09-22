import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TeamStudentList } from "@/components/team-student-list";
import { ChestNumberPreview } from "@/components/chest-number-preview";
import { getCurrentTeam } from "@/lib/auth";
import {
  deletePortalStudent,
  getPortalStudents,
  upsertPortalStudent,
  isRegistrationOpen,
} from "@/lib/team-data";

function redirectWithMessage(message: string, type: "error" | "success" = "error") {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/team/register-students?${params.toString()}`);
}

function generateNextChestNumber(teamName: string, existingStudents: Array<{ chestNumber: string }>): string {
  const prefix = teamName.slice(0, 2).toUpperCase();
  const teamStudents = existingStudents.filter((student) => {
    const chest = student.chestNumber.toUpperCase();
    return chest.startsWith(prefix) && /^\d{3}$/.test(chest.slice(2));
  });

  if (teamStudents.length === 0) {
    return `${prefix}001`;
  }

  const numbers = teamStudents
    .map((student) => {
      const numStr = student.chestNumber.toUpperCase().slice(2);
      const num = parseInt(numStr, 10);
      return isNaN(num) ? 0 : num;
    })
    .filter((num) => num > 0);

  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

async function createStudentAction(formData: FormData) {
  "use server";
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");
  
  const isOpen = await isRegistrationOpen();
  if (!isOpen) {
    redirectWithMessage("Registration window is closed. You cannot add students at this time.");
  }

  const name = String(formData.get("name") ?? "").trim();
  
  if (!name) {
    redirectWithMessage("Student name is required.");
  }

  const students = await getPortalStudents();
  const chestNumber = generateNextChestNumber(team.teamName, students);

  if (students.some((student) => student.chestNumber.toUpperCase() === chestNumber)) {
    redirectWithMessage("Chest number already registered.");
  }
  if (
    students.some(
      (student) =>
        student.teamId === team.id && student.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    redirectWithMessage("Student name already exists for this team.");
  }
  try {
    await upsertPortalStudent({
      name,
      chestNumber,
      teamId: team.id,
    });
  } catch (error) {
    redirectWithMessage((error as Error).message);
  }
  revalidatePath("/team/register-students");
  redirectWithMessage("Student added successfully.", "success");
}

async function updateStudentAction(formData: FormData) {
  "use server";
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");
  
  const isOpen = await isRegistrationOpen();
  if (!isOpen) {
    redirectWithMessage("Registration window is closed. You cannot edit students at this time.");
  }
  
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const chestNumber = String(formData.get("chestNumber") ?? "").trim().toUpperCase();
  if (!studentId) redirectWithMessage("Missing student ID.");

  const students = await getPortalStudents();
  const current = students.find((student) => student.id === studentId);
  if (!current || current.teamId !== team.id) {
    redirectWithMessage("You can only edit your own students.");
  }
  if (students.some((student) => student.id !== studentId && student.chestNumber === chestNumber)) {
    redirectWithMessage("Chest number already registered.");
  }
  try {
    await upsertPortalStudent({
      id: studentId,
      name,
      chestNumber,
      teamId: team.id,
    });
  } catch (error) {
    redirectWithMessage((error as Error).message);
  }
  revalidatePath("/team/register-students");
  redirectWithMessage("Student updated.", "success");
}

async function deleteStudentAction(formData: FormData) {
  "use server";
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");
  
  const isOpen = await isRegistrationOpen();
  if (!isOpen) {
    redirectWithMessage("Registration window is closed. You cannot delete students at this time.");
  }
  
  const studentId = String(formData.get("studentId") ?? "");
  const students = await getPortalStudents();
  const current = students.find((student) => student.id === studentId);
  if (!current || current.teamId !== team.id) {
    redirectWithMessage("Cannot delete student outside your team.");
  }
  await deletePortalStudent(studentId);
  revalidatePath("/team/register-students");
  redirectWithMessage("Student deleted.", "success");
}

export default async function RegisterStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const team = await getCurrentTeam();
  if (!team) {
    redirect("/team/login");
  }
  const [students, isOpen] = await Promise.all([
    getPortalStudents(),
    isRegistrationOpen(),
  ]);
  const teamStudents = students.filter((student) => student.teamId === team.id);
  const error = typeof params?.error === "string" ? params.error : undefined;
  const success = typeof params?.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Register Students</h1>
        <p className="text-sm text-white/70 mt-1">Manage your team members and their information</p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <Card className={`rounded-2xl border ${error ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/40 bg-emerald-500/10"} p-4`}>
          <p className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
            {error ?? success}
          </p>
        </Card>
      )}

      {/* Registration Status Banner */}
      {!isOpen && (
        <Card className="rounded-2xl border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Registration Window Closed</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                You can only add, edit, or delete students when the registration window is open.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Student Form */}
      <Card className={`rounded-2xl border-white/10 bg-white/5 p-4 sm:p-6 text-white ${!isOpen ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <CardTitle className="text-lg sm:text-xl">Add New Student</CardTitle>
        </div>
        <CardDescription className="text-white/70 mb-4">
          Chest number will be auto-generated based on your team name.
        </CardDescription>
        {isOpen ? (
          <>
            <ChestNumberPreview teamName={team.teamName} teamStudents={teamStudents} />
            <form action={createStudentAction} className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto]">
              <Input 
                name="name" 
                placeholder="Enter student name" 
                required 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button type="submit" className="w-full sm:w-auto">
                Add Student
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 text-center">
              Registration window is closed. Please wait for the admin to open registration.
            </p>
          </div>
        )}
      </Card>

      {/* Students List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Team Members ({teamStudents.length})
          </h2>
        </div>
        <TeamStudentList
          students={teamStudents}
          updateAction={updateStudentAction}
          deleteAction={deleteStudentAction}
          isRegistrationOpen={isOpen}
        />
      </div>
    </div>
  );
}

