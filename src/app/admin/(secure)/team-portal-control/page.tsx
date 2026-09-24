import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPortalStudents, getPortalTeams, getProgramRegistrations, getRegistrationSchedule, savePortalTeam, deletePortalTeam, updateRegistrationSchedule } from "@/lib/team-data";
import { ColorPickerInput } from "@/components/ui/color-picker";
import { TeamPortalManager } from "@/components/team-portal-manager";
import { redirectWithToast } from "@/lib/actions";

import { sendTeamWelcomeEmail, sendTeamUpdatedEmail } from "@/lib/email-service";
import { createScheduleUpdatedNotification } from "@/lib/notification-service";

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

    if (!isUpdate) {
      // Send welcome email via Resend when new team is created
      try {
        const emailRes = await sendTeamWelcomeEmail({
          to: leaderEmail,
          leaderName,
          teamName,
          loginEmail: leaderEmail,
          password,
        });

        if (emailRes.success) {
          emailNotice = ` Welcome credentials sent to ${leaderEmail}.`;
        } else {
          toastType = "warning";
          emailNotice = ` Note: Welcome email could not be delivered (${emailRes.error || "service unavailable"}). Password: ${password}`;
        }
      } catch (err: any) {
        toastType = "warning";
        emailNotice = ` Note: Email sending failed (${err?.message || "error"}). Password: ${password}`;
      }
    } else {
      // Send update email to team leader
      try {
        const updateRes = await sendTeamUpdatedEmail({
          to: leaderEmail,
          leaderName,
          teamName,
          loginEmail: leaderEmail,
          password,
        });
        if (updateRes.success) {
          emailNotice = ` Update notice sent to ${leaderEmail}.`;
        }
      } catch (err: any) {
        console.warn("Failed to send team updated email:", err);
      }
    }

    revalidatePath("/admin/team-portal-control");
    redirectWithToast(
      "/admin/team-portal-control",
      isUpdate ? `Team updated successfully!${emailNotice}` : `Team created successfully!${emailNotice}`,
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
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();

    await updateRegistrationSchedule({
      startDateTime: startIso,
      endDateTime: endIso,
    });

    // Broadcast schedule update notification and email to all team leaders
    try {
      await createScheduleUpdatedNotification(startIso, endIso);
    } catch (err: any) {
      console.warn("Failed to broadcast schedule update notification:", err);
    }

    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", "Registration schedule updated and sent to team leaders!", "success");
  } catch (error: any) {
    // Check if it's a redirect error - if so, re-throw it
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", error?.message || "Failed to update schedule", "error");
  }
}

async function broadcastAnnouncementAction(formData: FormData) {
  "use server";
  try {
    const title = String(formData.get("title") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const link = String(formData.get("link") ?? "").trim() || "/team/dashboard";

    if (!title || !message) {
      revalidatePath("/admin/team-portal-control");
      redirectWithToast("/admin/team-portal-control", "Title and message are required.", "error");
      return;
    }

    const { createBroadcastNotification } = await import("@/lib/notification-service");
    await createBroadcastNotification({ title, message, link });

    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", "Broadcast notification sent to all team leaders' emails!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/team-portal-control");
    redirectWithToast("/admin/team-portal-control", error?.message || "Failed to broadcast notification", "error");
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
          Manage team credentials, registration schedule, and send notifications directly to team leaders.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-full">
          <CardTitle>Create Team</CardTitle>
          <CardDescription className="mt-2">
            Provision a team account with portal access &amp; send credentials.
          </CardDescription>
          <form action={upsertTeamAction} className="mt-6 grid gap-4">
            <Input name="teamName" placeholder="Team name" required />
            <Input name="leaderName" placeholder="Team Leader name" required />
            <Input name="leaderEmail" type="email" placeholder="Team Leader email" required />
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
            Set timestamps &amp; broadcast updates to all team leaders.
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
              Update Schedule &amp; Email Leaders
            </Button>
          </form>
        </Card>

        <Card className="h-full">
          <CardTitle>📢 Broadcast to Team Leaders</CardTitle>
          <CardDescription className="mt-2">
            Send an official notification directly to all team leaders&apos; emails.
          </CardDescription>
          <form action={broadcastAnnouncementAction} className="mt-6 grid gap-4">
            <Input name="title" placeholder="Notification Title (e.g. Schedule Change)" required />
            <Textarea
              name="message"
              placeholder="Write your announcement message for all team leaders..."
              className="min-h-[100px]"
              required
            />
            <Input name="link" placeholder="Action Link (optional, e.g. /team/dashboard)" defaultValue="/team/dashboard" />
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
              Broadcast to Team Leaders
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
