import {
  TeamModel,
  ProgramModel,
  ApprovedResultModel,
  StudentModel,
} from "@/lib/models";
import { connectDB } from "@/lib/db";

export async function getFestDataForAI() {
  await connectDB();

  // Fetch data in parallel
  // We exclude sensitive fields like passwords explicitly, though .lean() and projection handles it too.
  const [teams, programs, results, students] = await Promise.all([
    TeamModel.find({}, "id name total_points color leader").lean(),
    ProgramModel.find({}, "id name section category").lean(),
    ApprovedResultModel.find({}, "program_id entries").lean(),
    StudentModel.find({}, "id name chest_no team_id").lean(),
  ]);

  // Create lookups for easy name resolution
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const programMap = new Map(programs.map((p) => [p.id, p.name]));
  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  let context = "CURRENT FEST DATA:\n\n";

  // 1. Teams Summary
  context += "TEAMS & STANDINGS:\n";
  teams.forEach((team) => {
    context += `- Team: ${team.name} | Leader: ${team.leader} | Points: ${team.total_points}\n`;
  });
  context += "\n";

  // 2. Published Results
  context += "PUBLISHED RESULTS:\n";
  if (results.length === 0) {
    context += "No results published yet.\n";
  } else {
    results.forEach((result) => {
      const programName = programMap.get(result.program_id) || "Unknown Program";
      context += `Program: ${programName}\n`;
      // Sort entries by position
      const sortedEntries = result.entries.sort((a, b) => a.position - b.position);
      sortedEntries.forEach((entry) => {
        const studentName = entry.student_id ? studentMap.get(entry.student_id) : "N/A";
        const teamName = entry.team_id ? teamMap.get(entry.team_id) : "N/A";
        context += `  ${entry.position}. ${studentName} (${teamName}) [Grade: ${entry.grade}, Score: ${entry.score}]\n`;
      });
      context += "\n";
    });
  }

  // 3. Programs List
  context += "ALL PROGRAMS:\n";
  programs.forEach((p) => {
    context += `- ${p.name} (Section: ${p.section}, Category: ${p.category})\n`;
  });
  context += "\n";

  // 4. Students List (Condensed to save tokens, but still searchable)
  context += "STUDENT DIRECTORY:\n";
  students.forEach((s) => {
    const tName = teamMap.get(s.team_id) || "Unknown Team";
    context += `- ${s.name} (Chest: ${s.chest_no}, Team: ${tName})\n`;
  });

  return context;
}
