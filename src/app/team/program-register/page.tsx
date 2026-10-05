import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TeamProgramRegister, ActionResponse } from "@/components/team-program-register";
import { getCurrentTeam } from "@/lib/auth";
import {
  getPortalStudents,
  getProgramRegistrations,
  getProgramsWithLimits,
  isRegistrationOpen,
  registerCandidate,
  registerMultipleCandidates,
  removeProgramRegistration,
  validateParticipationLimit,
} from "@/lib/team-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function registerProgramAction(formData: FormData): Promise<ActionResponse> {
  "use server";
  const [team, open] = await Promise.all([getCurrentTeam(), isRegistrationOpen()]);
  if (!team) return { success: false, error: "Please log in to register programs." };
  if (!open) return { success: false, error: "Registration window is closed." };

  const programId = String(formData.get("programId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!programId || !studentId) return { success: false, error: "Program and student are required." };

  const [programs, students, registrations] = await Promise.all([
    getProgramsWithLimits(),
    getPortalStudents(),
    getProgramRegistrations(),
  ]);
  const program = programs.find((item) => item.id === programId);
  if (!program) {
    return { success: false, error: "Program not found." };
  }
  const candidateLimit = program.candidateLimit ?? 1;
  const student = students.find((item) => item.id === studentId);
  if (!student || student.teamId !== team.id) {
    return { success: false, error: "You can only register your team members." };
  }
  const teamEntries = registrations.filter(
    (registration) => registration.programId === programId && registration.teamId === team.id,
  );
  if (teamEntries.length >= candidateLimit) {
    return { success: false, error: "Candidate limit reached for this program." };
  }
  if (
    registrations.some(
      (registration) =>
        registration.programId === programId && registration.studentId === studentId,
    )
  ) {
    return { success: false, error: "Student already registered for this program." };
  }

  // Check participation limits
  const limitCheck = validateParticipationLimit(studentId, program, programs, registrations);
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.reason || "Participation limit reached for this program type." };
  }

  try {
    const record = await registerCandidate({
      programId: program.id,
      programName: program.name,
      studentId: student.id,
      studentName: student.name,
      studentChest: student.chestNumber,
      teamId: team.id,
      teamName: team.teamName,
    });

    if (team.leaderEmail) {
      import("@/lib/email-service")
        .then(({ sendRegistrationSuccessEmail }) => {
          sendRegistrationSuccessEmail({
            to: team.leaderEmail!,
            leaderName: team.leaderName,
            teamName: team.teamName,
            programName: program.name,
            section: program.section,
            candidates: [{ name: student.name, chestNumber: student.chestNumber }],
          }).catch((e) => console.warn("Failed to dispatch registration email:", e));
        })
        .catch((e) => console.warn("Email service import failed:", e));
    }

    revalidatePath("/team/program-register");
    return {
      success: true,
      message: `Successfully registered ${student.name} for ${program.name}!`,
      registration: record,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Registration failed" };
  }
}

async function registerMultipleStudentsAction(formData: FormData): Promise<ActionResponse> {
  "use server";
  const [team, open] = await Promise.all([getCurrentTeam(), isRegistrationOpen()]);
  if (!team) return { success: false, error: "Please log in to register programs." };
  if (!open) return { success: false, error: "Registration window is closed." };

  const programId = String(formData.get("programId") ?? "");
  const studentIdsStr = String(formData.get("studentIds") ?? "");
  if (!programId || !studentIdsStr) return { success: false, error: "Program and students are required." };

  const studentIds = studentIdsStr.split(",").filter(Boolean);
  if (studentIds.length === 0) return { success: false, error: "At least one student must be selected." };

  const [programs, students, registrations] = await Promise.all([
    getProgramsWithLimits(),
    getPortalStudents(),
    getProgramRegistrations(),
  ]);
  const program = programs.find((item) => item.id === programId);
  if (!program) {
    return { success: false, error: "Program not found." };
  }
  const candidateLimit = program.candidateLimit ?? 1;

  // Validate all students belong to the team
  const teamStudents = students.filter((s) => s.teamId === team.id);
  const selectedStudents = teamStudents.filter((s) => studentIds.includes(s.id));
  if (selectedStudents.length !== studentIds.length) {
    return { success: false, error: "You can only register your team members." };
  }

  // Check candidate limit
  const teamEntries = registrations.filter(
    (registration) => registration.programId === programId && registration.teamId === team.id,
  );
  if (teamEntries.length + selectedStudents.length > candidateLimit) {
    return {
      success: false,
      error: `Cannot register ${selectedStudents.length} students. Only ${candidateLimit - teamEntries.length} slots remaining.`,
    };
  }

  // Check for duplicates
  const alreadyRegistered = selectedStudents.some((student) =>
    registrations.some(
      (registration) =>
        registration.programId === programId && registration.studentId === student.id,
    ),
  );
  if (alreadyRegistered) {
    return { success: false, error: "One or more students are already registered for this program." };
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
    return { success: false, error: limitViolations.join("; ") };
  }

  try {
    const entries = selectedStudents.map((student) => ({
      programId: program.id,
      programName: program.name,
      studentId: student.id,
      studentName: student.name,
      studentChest: student.chestNumber,
      teamId: team.id,
      teamName: team.teamName,
    }));

    const records = await registerMultipleCandidates(entries);

    if (team.leaderEmail && records.length > 0) {
      import("@/lib/email-service")
        .then(({ sendRegistrationSuccessEmail }) => {
          sendRegistrationSuccessEmail({
            to: team.leaderEmail!,
            leaderName: team.leaderName,
            teamName: team.teamName,
            programName: program.name,
            section: program.section,
            candidates: selectedStudents.map((s) => ({ name: s.name, chestNumber: s.chestNumber })),
          }).catch((e) => console.warn("Failed to dispatch group registration email:", e));
        })
        .catch((e) => console.warn("Email service import error:", e));
    }

    revalidatePath("/team/program-register");
    return {
      success: true,
      message: `Successfully registered ${records.length} student${records.length !== 1 ? "s" : ""}!`,
      registrations: records,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Registration failed" };
  }
}

async function removeRegistrationAction(formData: FormData): Promise<ActionResponse> {
  "use server";
  const team = await getCurrentTeam();
  if (!team) return { success: false, error: "Please log in." };
  const registrationId = String(formData.get("registrationId") ?? "");
  if (!registrationId) return { success: false, error: "Registration ID is required." };

  const registrations = await getProgramRegistrations();
  const record = registrations.find((registration) => registration.id === registrationId);
  if (!record || record.teamId !== team.id) {
    return { success: false, error: "Cannot remove registrations from other teams." };
  }

  try {
    await removeProgramRegistration(registrationId);
    revalidatePath("/team/program-register");
    return { success: true, message: "Registration removed.", registrationId };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove registration" };
  }
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
        programs={programs.map((p) => ({ ...p, candidateLimit: p.candidateLimit ?? 1 }))}
        allPrograms={programs.map((p) => ({ ...p, candidateLimit: p.candidateLimit ?? 1 }))}
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
