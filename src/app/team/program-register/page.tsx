import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TeamProgramRegister } from "@/components/team-program-register";
import { getCurrentTeam } from "@/lib/auth";
import {
  getPortalStudents,
  getProgramRegistrations,
  getProgramsWithLimits,
  isRegistrationOpen,
  registerCandidate,
  removeProgramRegistration,
  validateParticipationLimit,
} from "@/lib/team-data";

function redirectWithMessage(message: string, type: "error" | "success" = "error") {
  const params = new URLSearchParams({ 
    message: encodeURIComponent(message),
    toastType: type 
  });
  redirect(`/team/program-register?${params.toString()}`);
}

async function registerProgramAction(formData: FormData) {
  "use server";
  const [team, open] = await Promise.all([getCurrentTeam(), isRegistrationOpen()]);
  if (!team) redirect("/team/login");
  if (!open) redirectWithMessage("Registration window is closed.");

  const programId = String(formData.get("programId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!programId || !studentId) redirectWithMessage("Program and student are required.");

  const [programs, students, registrations] = await Promise.all([
    getProgramsWithLimits(),
    getPortalStudents(),
    getProgramRegistrations(),
  ]);
  const program = programs.find((item) => item.id === programId);
  if (!program) {
    redirectWithMessage("Program not found.");
    return;
  }
  const candidateLimit = program.candidateLimit ?? 1;
  const student = students.find((item) => item.id === studentId);
  if (!student || student.teamId !== team.id) {
    redirectWithMessage("You can only register your team members.");
    return;
  }
  const teamEntries = registrations.filter(
    (registration) => registration.programId === programId && registration.teamId === team.id,
  );
  if (teamEntries.length >= candidateLimit) {
    redirectWithMessage("Candidate limit reached for this program.");
  }
  if (
    registrations.some(
      (registration) =>
        registration.programId === programId && registration.studentId === studentId,
    )
  ) {
    redirectWithMessage("Student already registered for this program.");
  }

  // Check participation limits
  const limitCheck = validateParticipationLimit(studentId, program, programs, registrations);
  if (!limitCheck.allowed) {
    redirectWithMessage(limitCheck.reason || "Participation limit reached for this program type.");
  }

  try {
    await registerCandidate({
      programId: program.id,
      programName: program.name,
      studentId: student.id,
      studentName: student.name,
      studentChest: student.chestNumber,
      teamId: team.id,
      teamName: team.teamName,
    });
  } catch (error: any) {
    // Handle duplicate registration error (race condition protection)
    if (error.message.includes("already registered")) {
      redirectWithMessage(error.message);
    }
    redirectWithMessage(`Registration failed: ${error.message}`);
  }
  
  revalidatePath("/team/program-register");
  redirectWithMessage("Registration submitted.", "success");
}

async function registerMultipleStudentsAction(formData: FormData) {
  "use server";
  const [team, open] = await Promise.all([getCurrentTeam(), isRegistrationOpen()]);
  if (!team) redirect("/team/login");
  if (!open) redirectWithMessage("Registration window is closed.");

  const programId = String(formData.get("programId") ?? "");
  const studentIdsStr = String(formData.get("studentIds") ?? "");
  if (!programId || !studentIdsStr) redirectWithMessage("Program and students are required.");

  const studentIds = studentIdsStr.split(",").filter(Boolean);
  if (studentIds.length === 0) redirectWithMessage("At least one student must be selected.");

  const [programs, students, registrations] = await Promise.all([
    getProgramsWithLimits(),
    getPortalStudents(),
    getProgramRegistrations(),
  ]);
  const program = programs.find((item) => item.id === programId);
  if (!program) {
    redirectWithMessage("Program not found.");
    return;
  }
  const candidateLimit = program.candidateLimit ?? 1;

  // Validate all students belong to the team
  const teamStudents = students.filter((s) => s.teamId === team.id);
  const selectedStudents = teamStudents.filter((s) => studentIds.includes(s.id));
  if (selectedStudents.length !== studentIds.length) {
    redirectWithMessage("You can only register your team members.");
    return;
  }

  // Check candidate limit
  const teamEntries = registrations.filter(
    (registration) => registration.programId === programId && registration.teamId === team.id,
  );
  if (teamEntries.length + selectedStudents.length > candidateLimit) {
    redirectWithMessage(
      `Cannot register ${selectedStudents.length} students. Only ${candidateLimit - teamEntries.length} slots remaining.`,
    );
  }

  // Check for duplicates
  const alreadyRegistered = selectedStudents.some((student) =>
    registrations.some(
      (registration) =>
        registration.programId === programId && registration.studentId === student.id,
    ),
  );
  if (alreadyRegistered) {
    redirectWithMessage("One or more students are already registered for this program.");
  }

  // Check participation limits for each student
  const limitViolations: string[] = [];
  for (const student of selectedStudents) {
    const limitCheck = validateParticipationLimit(student.id, program, programs, registrations);
    if (!limitCheck.allowed) {
      limitViolations.push(`${student.name}: ${limitCheck.reason || "Participation limit reached"}`);
    }
  }
  if (limitViolations.length > 0) {
    redirectWithMessage(limitViolations.join("; "));
  }

  // Register all students with error handling
  const registrationErrors: string[] = [];
  let successCount = 0;
  
  for (const student of selectedStudents) {
    try {
      await registerCandidate({
        programId: program.id,
        programName: program.name,
        studentId: student.id,
        studentName: student.name,
        studentChest: student.chestNumber,
        teamId: team.id,
        teamName: team.teamName,
      });
      successCount++;
    } catch (error: any) {
      // Handle duplicate registration error
      if (error.message.includes("already registered")) {
        registrationErrors.push(`${student.name}: ${error.message}`);
      } else {
        registrationErrors.push(`${student.name}: Registration failed - ${error.message}`);
      }
    }
  }

  revalidatePath("/team/program-register");
  
  if (registrationErrors.length > 0) {
    const errorMessage = registrationErrors.length === selectedStudents.length
      ? `Registration failed: ${registrationErrors.join("; ")}`
      : `Partially completed: ${successCount} registered, ${registrationErrors.length} failed. ${registrationErrors.join("; ")}`;
    redirectWithMessage(errorMessage);
  }
  
  redirectWithMessage(
    `Successfully registered ${successCount} student${successCount !== 1 ? "s" : ""}.`,
    "success",
  );
}

async function removeRegistrationAction(formData: FormData) {
  "use server";
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");
  const registrationId = String(formData.get("registrationId") ?? "");
  const registrations = await getProgramRegistrations();
  const record = registrations.find((registration) => registration.id === registrationId);
  if (!record || record.teamId !== team.id) {
    redirectWithMessage("Cannot remove registrations from other teams.");
  }
  await removeProgramRegistration(registrationId);
  revalidatePath("/team/program-register");
  redirectWithMessage("Registration removed.", "success");
}

export default async function ProgramRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const team = await getCurrentTeam();
  if (!team) redirect("/team/login");
  const [programs, registrations, students, open] = await Promise.all([
    getProgramsWithLimits(),
    getProgramRegistrations(),
    getPortalStudents(),
    isRegistrationOpen(),
  ]);
  const teamRegistrations = registrations.filter(
    (registration) => registration.teamId === team.id,
  );
  const teamStudents = students.filter((student) => student.teamId === team.id);
  const error = typeof params?.error === "string" ? params.error : undefined;
  const success = typeof params?.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Program Registration</h1>
        <p className="text-sm text-white/70">
          Registration window is currently{" "}
          <span className={open ? "text-emerald-400" : "text-red-400"}>
            {open ? "OPEN" : "CLOSED"}
          </span>
          .
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

      <TeamProgramRegister
        programs={programs.map(p => ({ ...p, candidateLimit: p.candidateLimit ?? 1 }))}
        allPrograms={programs.map(p => ({ ...p, candidateLimit: p.candidateLimit ?? 1 }))}
        teamRegistrations={teamRegistrations}
        teamStudents={teamStudents}
        isOpen={open}
        registerAction={registerProgramAction}
        registerMultipleAction={registerMultipleStudentsAction}
        removeAction={removeRegistrationAction}
      />
    </div>
  );
}

