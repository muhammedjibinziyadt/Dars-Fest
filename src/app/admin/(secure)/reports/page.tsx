import { getStudents, getTeams, getPrograms, getApprovedResults } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import { AdminReportsManager } from "@/components/admin-reports-manager";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [students, teams, programs, approvedResults, registrations] = await Promise.all([
    getStudents(),
    getTeams(),
    getPrograms(),
    getApprovedResults(),
    getProgramRegistrations(),
  ]);

  // Aggregate real-time scores, podium finishes, and grades from approved results
  const studentStatsMap = new Map<string, {
    total_points: number;
    position_points: number;
    grade_points: number;
    first: number;
    second: number;
    third: number;
    A: number;
    B: number;
    C: number;
  }>();

  for (const res of approvedResults) {
    for (const entry of res.entries) {
      if (entry.student_id) {
        const current = studentStatsMap.get(entry.student_id) || {
          total_points: 0,
          position_points: 0,
          grade_points: 0,
          first: 0,
          second: 0,
          third: 0,
          A: 0,
          B: 0,
          C: 0,
        };
        const posPts = entry.position_points ?? entry.score ?? 0;
        const grdPts = entry.grade_points ?? 0;
        current.total_points += (entry.score ?? (posPts + grdPts));
        current.position_points += posPts;
        current.grade_points += grdPts;
        if (entry.position === 1) current.first += 1;
        if (entry.position === 2) current.second += 1;
        if (entry.position === 3) current.third += 1;
        if (entry.grade === "A") current.A += 1;
        if (entry.grade === "B") current.B += 1;
        if (entry.grade === "C") current.C += 1;
        studentStatsMap.set(entry.student_id, current);
      }
    }
  }

  const enrichedStudents = students.map((s) => {
    const stats = studentStatsMap.get(s.id);
    return {
      ...s,
      total_points: s.total_points ?? stats?.total_points ?? 0,
      position_points: s.position_points ?? stats?.position_points ?? 0,
      grade_points: s.grade_points ?? stats?.grade_points ?? 0,
      positions_count: {
        first: s.positions_count?.first ?? stats?.first ?? 0,
        second: s.positions_count?.second ?? stats?.second ?? 0,
        third: s.positions_count?.third ?? stats?.third ?? 0,
      },
      grades_count: {
        A: s.grades_count?.A ?? stats?.A ?? 0,
        B: s.grades_count?.B ?? stats?.B ?? 0,
        C: s.grades_count?.C ?? stats?.C ?? 0,
      },
    };
  });

  // Ensure plain serialized objects across server-client component boundary
  const plainStudents = JSON.parse(JSON.stringify(enrichedStudents));
  const plainTeams = JSON.parse(JSON.stringify(teams));
  const plainPrograms = JSON.parse(JSON.stringify(programs));
  const plainApprovedResults = JSON.parse(JSON.stringify(approvedResults));
  const plainRegistrations = JSON.parse(JSON.stringify(registrations));

  return (
    <AdminReportsManager
      students={plainStudents}
      teams={plainTeams}
      programs={plainPrograms}
      approvedResults={plainApprovedResults}
      registrations={plainRegistrations}
    />
  );
}
