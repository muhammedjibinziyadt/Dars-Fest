import { Metadata } from "next";
import { getPrograms, getStudents, getTeams } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import { getAllAttendance } from "@/lib/attendance-service";
import { AdminAttendanceView } from "@/components/admin-attendance-view";

export const metadata: Metadata = {
  title: "Program Attendance & QR Verification - Maerika 2k26",
  description: "Stage check-in and QR code attendance verification for participants.",
};

export default async function AdminAttendancePage() {
  const [programs, registrations, students, teams, attendance] = await Promise.all([
    getPrograms(),
    getProgramRegistrations(),
    getStudents(),
    getTeams(),
    getAllAttendance(),
  ]);

  return (
    <AdminAttendanceView
      programs={programs}
      registrations={registrations}
      students={students}
      teams={teams}
      initialAttendance={attendance}
    />
  );
}
