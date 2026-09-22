import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getPortalTeams,
  getPortalStudents,
  getProgramRegistrations,
  getProgramsWithLimits,
} from "@/lib/team-data";
import { getPrograms, getApprovedResults } from "@/lib/data";
import { TeamDetailsView } from "@/components/team-details-view";

export default async function TeamDetailsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [teams, students, registrations, programs, allPrograms, results] = await Promise.all([
    getPortalTeams(),
    getPortalStudents(),
    getProgramRegistrations(),
    getProgramsWithLimits(),
    getPrograms(),
    getApprovedResults(),
  ]);

  // Serialize data to plain objects for Client Components
  const serializedData = {
    teams: JSON.parse(JSON.stringify(teams)),
    students: JSON.parse(JSON.stringify(students)),
    registrations: JSON.parse(JSON.stringify(registrations)),
    programs: JSON.parse(JSON.stringify(programs)),
    allPrograms: JSON.parse(JSON.stringify(allPrograms)),
    results: JSON.parse(JSON.stringify(results)),
  };

  return (
    <TeamDetailsView
      teams={serializedData.teams}
      students={serializedData.students}
      registrations={serializedData.registrations}
      programs={serializedData.programs}
      allPrograms={serializedData.allPrograms}
      results={serializedData.results}
    />
  );
}

