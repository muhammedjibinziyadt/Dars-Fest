import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPortalStudents, getPortalTeams, getProgramRegistrations, getRegistrationSchedule, savePortalTeam, deletePortalTeam, updateRegistrationSchedule } from "@/lib/team-data";
import { TeamPortalManager } from "@/components/team-portal-manager";
import { redirectWithToast } from "@/lib/actions";

function sanitizeColor(value: string) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(value) ? value : "#0ea5e9";
}

async function upsertTeamAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id") ?? `team-${randomUUID().slice(0, 6)}`);
    const teamName = String(formData.get("teamName") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const leaderName = String(formData.get("leaderName") ?? "").trim();
    const themeColor = sanitizeColor(String(formData.get("themeColor") ?? "#0ea5e9"));
    if (!teamName || !password || !leaderName) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "Team name, password, and leader name are required.", "error");
      return;
    }
    const isUpdate = formData.get("id") !== null;
    await savePortalTeam({
      id,
      teamName,
      password,
      leaderName,
      themeColor,
    });
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", isUpdate ? "Team updated successfully!" : "Team created successfully!", "success");
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
            <Input name="leaderName" placeholder="Leader name" required />
            <Input name="password" type="text" placeholder="Password" required />
            <Input name="themeColor" type="text" placeholder="#0ea5e9" />
            <Button type="submit" className="w-full">
              Create Team
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
