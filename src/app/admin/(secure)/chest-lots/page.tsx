import { getPrograms, getStudents } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import { AdminChestLotsView } from "@/components/admin-chest-lots-view";

export default async function AdminChestLotsPage() {
  const [programs, registrations, students] = await Promise.all([
    getPrograms(),
    getProgramRegistrations(),
    getStudents(),
  ]);

  return (
    <AdminChestLotsView
      programs={programs}
      registrations={registrations}
      students={students}
    />
  );
}
