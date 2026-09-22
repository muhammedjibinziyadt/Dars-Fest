import { getApprovedResults, getLiveScores, getPrograms, getStudents, getTeams } from "@/lib/data";
import { ScoreboardRealtime } from "@/components/scoreboard-realtime";

async function getScoreboardData() {
  const [teams, programs, results, students, liveScores] = await Promise.all([
    getTeams(),
    getPrograms(),
    getApprovedResults(),
    getStudents(),
    getLiveScores(),
  ]);

  // Sort results by submitted_at descending (newest first)
  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime();
    const dateB = new Date(b.submitted_at).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  const scoreMap = new Map(liveScores.map((entry) => [entry.team_id, entry.total_points]));

  return { teams, programs, results: sortedResults, students, liveScores: scoreMap };
}

export default async function ScoreboardPage() {
  const data = await getScoreboardData();

  return (
    <main className="min-h-screen bg-[#fffcf5]">
      <ScoreboardRealtime
        teams={data.teams}
        programs={data.programs}
        results={data.results}
        students={data.students}
        liveScores={data.liveScores}
      />
    </main>
  );
}

