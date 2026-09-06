import {
  teamsCol,
  programsCol,
  approvedResultsCol,
  studentsCol,
  docsToData,
} from "@/lib/models";
import type { Team, Program, ResultRecord, Student } from "@/lib/types";

export async function getFestDataForAI() {
  const [teamsSnap, programsSnap, resultsSnap, studentsSnap] = await Promise.all([
    teamsCol.get(),
    programsCol.get(),
    approvedResultsCol.get(),
    studentsCol.get(),
  ]);

  const teams = docsToData<Team>(teamsSnap);
  const programs = docsToData<Program>(programsSnap);
  const results = docsToData<ResultRecord>(resultsSnap);
  const students = docsToData<Student>(studentsSnap);

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const programMap = new Map(programs.map((p) => [p.id, p.name]));
  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  let context = "CURRENT FEST DATA:\n\n";

  context += "TEAMS & STANDINGS:\n";
  teams.forEach((team) => {
    context += `- Team: ${team.name} | Leader: ${team.leader} | Points: ${team.total_points}\n`;
  });
  context += "\n";

  context += "PUBLISHED RESULTS:\n";
  if (results.length === 0) {
    context += "No results published yet.\n";
  } else {
    results.forEach((result) => {
      const programName = programMap.get(result.program_id) || "Unknown Program";
      context += `Program: ${programName}\n`;
      const sortedEntries = [...result.entries].sort((a, b) => a.position - b.position);
      sortedEntries.forEach((entry) => {
        const studentName = entry.student_id ? studentMap.get(entry.student_id) : "N/A";
        const teamName = entry.team_id ? teamMap.get(entry.team_id) : "N/A";
        context += `  ${entry.position}. ${studentName} (${teamName}) [Grade: ${entry.grade}, Score: ${entry.score}]\n`;
      });
      context += "\n";
    });
  }

  context += "ALL PROGRAMS:\n";
  programs.forEach((p) => {
    context += `- ${p.name} (Section: ${p.section}, Category: ${p.category})\n`;
  });
  context += "\n";

  context += "STUDENT DIRECTORY:\n";
  students.forEach((s) => {
    const tName = teamMap.get(s.team_id) || "Unknown Team";
    context += `- ${s.name} (Chest: ${s.chest_no}, Team: ${tName})\n`;
  });

  return context;
}
