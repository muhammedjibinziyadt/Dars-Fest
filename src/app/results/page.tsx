import { getApprovedResults, getPrograms, getStudents, getTeams } from "@/lib/data";
import { ResultsRealtime } from "@/components/results-realtime";

async function getResultsData() {
  const [results, programs, students, teams] = await Promise.all([
    getApprovedResults(),
    getPrograms(),
    getStudents(),
    getTeams(),
  ]);

  // Sort results by submitted_at descending (newest first)
  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime();
    const dateB = new Date(b.submitted_at).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  const programMap = new Map(programs.map((p) => [p.id, p]));

  return {
    results: sortedResults,
    programs,
    programMap,
    students,
    teams,
  };
}

export default async function ResultsPage() {
  const data = await getResultsData();

  return (
    <ResultsRealtime
      programs={data.programs}
      results={data.results}
      programMap={data.programMap}
      students={data.students}
      teams={data.teams}
    />
  );
}

