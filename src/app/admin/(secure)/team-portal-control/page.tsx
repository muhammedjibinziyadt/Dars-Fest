import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPortalStudents, getPortalTeams, getProgramRegistrations, getRegistrationSchedule, savePortalTeam, deletePortalTeam, updateRegistrationSchedule } from "@/lib/team-data";
import { ColorPickerInput } from "@/components/ui/color-picker";
import { TeamPortalManager } from "@/components/team-portal-manager";
import { redirectWithToast } from "@/lib/actions";

import { sendTeamWelcomeEmail } from "@/lib/email-service";

function sanitizeColor(value: string) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(value) ? value : "#0ea5e9";
}

async function upsertTeamAction(formData: FormData) {
  "use server";
  try {
    const isUpdate = Boolean(formData.get("id"));
    const id = String(formData.get("id") ?? `team-${randomUUID().slice(0, 6)}`);
    const teamName = String(formData.get("teamName") ?? "").trim();
    const leaderName = String(formData.get("leaderName") ?? "").trim();
    const leaderEmail = String(formData.get("leaderEmail") ?? "").trim().toLowerCase();
    let password = String(formData.get("password") ?? "").trim();
    const themeColor = sanitizeColor(String(formData.get("themeColor") ?? "#0ea5e9"));

    if (!teamName || !leaderName) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "Team name and leader name are required.", "error");
      return;
    }

    if (!leaderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leaderEmail)) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "A valid Team Leader email address is required.", "error");
      return;
    }

    // Auto-generate secure temporary password if left empty on creation
    if (!password) {
      if (!isUpdate) {
        password = `M26@${Math.random().toString(36).slice(-6)}`;
      } else {
        revalidatePath("/admin/team-portal-control");
        redirectWithToast("/admin/team-portal-control", "Password is required.", "error");
        return;
      }
    }

    await savePortalTeam({
      id,
      teamName,
      password,
      leaderName,
      leaderEmail,
      themeColor,
    });

    let emailNotice = "";
    let toastType: "success" | "warning" = "success";

    // Send welcome email via Resend when new team is created
    if (!isUpdate) {
      try {
        const emailRes = await sendTeamWelcomeEmail({
          to: leaderEmail,
          leaderName,
          teamName,
          loginEmail: leaderEmail,
          password,
        });

        if (emailRes.success) {
          emailNotice = ` Welcome email sent to ${leaderEmail}.`;
        } else {
          toastType = "warning";
          emailNotice = ` Note: Welcome email could not be delivered (${emailRes.error || "service unavailable"}). Password: ${password}`;
        }
      } catch (err: any) {
        toastType = "warning";
        emailNotice = ` Note: Email sending failed (${err?.message || "error"}). Password: ${password}`;
      }
    }

    revalidatePath("/admin/team-portal-control");
    redirectWithToast(
      "/admin/team-portal-control",
      isUpdate ? "Team updated successfully!" : `Team created successfully!${emailNotice}`,
      toastType,
    );
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", error?.message || "Failed to save team", "error");
  }
}

async function deleteTeamAction(formData: FormData) {
  "use server";
  try {
    const teamId = String(formData.get("teamId") ?? "");
    if (!teamId) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "Team ID missing", "error");
      return;
    }
    await deletePortalTeam(teamId);
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", "Team deleted successfully!", "error");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", error?.message || "Failed to delete team", "error");
  }
}

async function updateScheduleAction(formData: FormData) {
  "use server";
  try {
    const start = String(formData.get("startDateTime") ?? "");
    const end = String(formData.get("endDateTime") ?? "");
    if (!start || !end) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "Start and end date/time are required.", "error");
      return;
    }
    await updateRegistrationSchedule({
      startDateTime: new Date(start).toISOString(),
      endDateTime: new Date(end).toISOString(),
    });
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", "Registration schedule updated successfully!", "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", error?.message || "Failed to update schedule", "error");
  }
}

export default async function TeamPortalControlPage() {
  const [teams, students, registrations, schedule] = await Promise.all([
    getPortalTeams(),
    getPortalStudents(),
    getProgramRegistrations(),
    getRegistrationSchedule(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-white/50">Team Portal</p>
        <h1 className="text-3xl font-semibold text-white">Control Center</h1>
        <p className="text-sm text-white/60 mt-2">
          Manage team credentials, registration schedule, and monitor per-team activity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardTitle>Create Team</CardTitle>
          <CardDescription className="mt-2">
            Provision a team account with portal access.
          </CardDescription>
          <form action={upsertTeamAction} className="mt-6 grid gap-4">
            <Input name="teamName" placeholder="Team name" required />
            <Input name="leaderName" placeholder="Team Leader name" required />
            <Input name="leaderEmail" type="email" placeholder="Team Leader email (credentials will be sent here)" required />
            <Input name="password" type="text" placeholder="Password (leave empty to auto-generate)" />
            <ColorPickerInput name="themeColor" defaultValue="#0ea5e9" />
            <Button type="submit" className="w-full">
              Create Team &amp; Send Credentials
            </Button>
          </form>
        </Card>

        <Card className="h-full">
          <CardTitle>Registration Schedule</CardTitle>
          <CardDescription className="mt-2">
            Only allow program registration between these timestamps.
          </CardDescription>
          <form action={updateScheduleAction} className="mt-6 grid gap-4">
            <label className="text-sm font-semibold text-white/70">
              Start date &amp; time
              <Input
                type="datetime-local"
                name="startDateTime"
                className="mt-2"
                defaultValue={schedule.startDateTime.slice(0, 16)}
                required
              />
            </label>
            <label className="text-sm font-semibold text-white/70">
              End date &amp; time
              <Input
                type="datetime-local"
                name="endDateTime"
                className="mt-2"
                defaultValue={schedule.endDateTime.slice(0, 16)}
                required
              />
            </label>
            <Button type="submit" className="mt-2">
              Update Schedule
            </Button>
          </form>
        </Card>
      </div>

      <TeamPortalManager
        teams={teams}
        students={students}
        registrations={registrations}
        updateAction={upsertTeamAction}
        deleteAction={deleteTeamAction}
      />
    </div>
  );
}
