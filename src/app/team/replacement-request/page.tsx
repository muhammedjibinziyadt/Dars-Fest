import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ReplacementRequestForm } from "@/components/replacement-request-form";
import { getCurrentTeam } from "@/lib/auth";
import { getApprovedResults } from "@/lib/data";
import {
  createReplacementRequest,
  getPortalStudents,
  getProgramRegistrations,
  getProgramsWithLimits,
  getReplacementRequests,
  isRegistrationOpen,
} from "@/lib/team-data";

function redirectWithMessage(message: string, type: "error" | "success" = "error") {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/team/replacement-request?${params.toString()}`);
}

async function submitReplacementRequestAction(formData: FormData) {
  "use server";
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");

  const isOpen = await isRegistrationOpen();
  if (isOpen) {
    redirectWithMessage("Registration window is still open. Please use the regular registration page.");
  }

  const programId = String(formData.get("programId") ?? "").trim();
  const oldStudentId = String(formData.get("oldStudentId") ?? "").trim();
  const newStudentId = String(formData.get("newStudentId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!programId || !oldStudentId || !newStudentId || !reason) {
    redirectWithMessage("All fields are required.");
  }

  if (oldStudentId === newStudentId) {
    redirectWithMessage("Old and new students must be different.");
  }

  const [programs, students, registrations, approvedResults] = await Promise.all([
    getProgramsWithLimits(),
    getPortalStudents(),
    getProgramRegistrations(),
    getApprovedResults(),
  ]);

  const program = programs.find((p) => p.id === programId);
  if (!program) {
    redirectWithMessage("Program not found.");
  }

  // Prevent replacement requests for approved/published programs
  const isProgramApproved = approvedResults.some((result) => result.program_id === programId);
  if (isProgramApproved) {
    redirectWithMessage("This program is already published. Replacement requests are not allowed for published programs.");
  }

  const oldStudent = students.find((s) => s.id === oldStudentId);
  const newStudent = students.find((s) => s.id === newStudentId);

  if (!oldStudent || oldStudent.teamId !== team.id) {
    redirectWithMessage("Old student not found or does not belong to your team.");
    return;
  }
  if (!newStudent || newStudent.teamId !== team.id) {
    redirectWithMessage("New student not found or does not belong to your team.");
    return;
  }

  const existingRegistration = registrations.find(
    (r) => r.programId === programId && r.studentId === oldStudentId && r.teamId === team.id,
  );
  if (!existingRegistration) {
    redirectWithMessage("The old student is not registered for this program.");
    return;
  }

  const newStudentAlreadyRegistered = registrations.some(
    (r) => r.programId === programId && r.studentId === newStudentId,
  );
  if (newStudentAlreadyRegistered) {
    redirectWithMessage("The new student is already registered for this program.");
    return;
  }

  // TypeScript type narrowing - these are guaranteed to be defined at this point
  // We've already checked above, but TypeScript needs explicit assertion
  if (!oldStudent || !newStudent || !program) {
    redirectWithMessage("Invalid data.");
    return;
  }

  // Check for duplicate pending replacement requests
  const existingRequests = await getReplacementRequests(team.id);
  const duplicateRequest = existingRequests.some(
    (req) =>
      req.programId === programId &&
      req.oldStudentId === oldStudentId &&
      req.status === "pending",
  );
  if (duplicateRequest) {
    redirectWithMessage(
      `A pending replacement request already exists for "${oldStudent.name}" in program "${program.name}". Please wait for admin approval or contact support.`,
    );
    return;
  }

  try {
    await createReplacementRequest({
      programId: program.id,
      programName: program.name,
      oldStudentId: oldStudent.id,
      oldStudentName: oldStudent.name,
      oldStudentChest: oldStudent.chestNumber,
      newStudentId: newStudent.id,
      newStudentName: newStudent.name,
      newStudentChest: newStudent.chestNumber,
      teamId: team.id,
      teamName: team.teamName,
      reason,
    });
    
    revalidatePath("/team/replacement-request");
    redirectWithMessage("Replacement request submitted successfully. Waiting for admin approval.", "success");
  } catch (error: any) {
    // Handle duplicate key error from database (race condition protection)
    if (error.message.includes("pending replacement request already exists")) {
      redirectWithMessage(error.message);
    }
    redirectWithMessage(`Failed to submit replacement request: ${error.message}`);
  }
}

export default async function ReplacementRequestPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");

  const [programs, registrations, students, isOpen, approvedResults] = await Promise.all([
    getProgramsWithLimits(),
    getProgramRegistrations(),
    getPortalStudents(),
    isRegistrationOpen(),
    getApprovedResults(),
  ]);

  // Filter out programs that are already approved/published
  const approvedProgramIds = new Set(approvedResults.map((result) => result.program_id));
  const availablePrograms = programs.filter((program) => !approvedProgramIds.has(program.id));

  const teamRegistrations = registrations.filter((r) => r.teamId === team.id);
  const teamStudents = students.filter((s) => s.teamId === team.id);

  const error = typeof params?.error === "string" ? params.error : undefined;
  const success = typeof params?.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Replacement Request</h1>
        <p className="text-sm text-white/70">
          Submit a request to replace a registered participant after the registration window has closed.
        </p>
      </div>

      {(error || success) && (
        <Card
          className={`border ${
            error ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/40 bg-emerald-500/10"
          } p-4`}
        >
          <p className="text-sm">{error ?? success}</p>
        </Card>
      )}

      {isOpen ? (
        <Card className="border-amber-500/40 bg-amber-500/10 p-6">
          <p className="text-sm text-white/90">
            The registration window is still open. Please use the{" "}
            <a href="/team/program-register" className="underline">
              Program Registration
            </a>{" "}
            page to make changes directly.
          </p>
        </Card>
      ) : availablePrograms.length === 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/10 p-6">
          <p className="text-sm text-white/90">
            No programs available for replacement requests. All programs with registrations have been published.
          </p>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/5 p-6">
          <CardTitle>Submit Replacement Request</CardTitle>
          <CardDescription className="mt-2">
            Select a program and the students you want to replace. Your request will be reviewed by an admin.
          </CardDescription>

          <ReplacementRequestForm
            programs={availablePrograms}
            teamRegistrations={teamRegistrations}
            teamStudents={teamStudents}
            submitAction={submitReplacementRequestAction}
          />
        </Card>
      )}
    </div>
  );
}

