import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getPortalTeams,
  getPortalStudents,
  getProgramRegistrations,
  getProgramsWithLimits,
} from "@/lib/team-data";
import { getPrograms } from "@/lib/data";
import { TeamDetailPage } from "@/components/team-detail-page";

export default async function TeamDetailPageRoute({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { teamId } = await params;

  const [teams, students, registrations, programs, allPrograms] = await Promise.all([
    getPortalTeams(),
    getPortalStudents(),
    getProgramRegistrations(),
    getProgramsWithLimits(),
    getPrograms(),
  ]);

  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    redirect("/admin/team-details");
  }

  // Serialize data to plain objects for Client Components
  const filteredStudents = students.filter((s) => s.teamId === teamId);
  const filteredRegistrations = registrations.filter((r) => r.teamId === teamId);

  return (
    <TeamDetailPage
      team={JSON.parse(JSON.stringify(team))}
      students={JSON.parse(JSON.stringify(filteredStudents))}
      registrations={JSON.parse(JSON.stringify(filteredRegistrations))}
      programs={JSON.parse(JSON.stringify(programs))}
      allPrograms={JSON.parse(JSON.stringify(allPrograms))}
    />
  );
}

