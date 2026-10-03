import {
  TeamModel,
  ProgramModel,
  ApprovedResultModel,
  StudentModel,
  RegistrationScheduleModel,
} from "@/lib/models";
import { connectDB } from "@/lib/db";

let cachedFestData = "";
let lastFestDataFetch = 0;
const FEST_CACHE_TTL_MS = 60_000; // 1 minute cache

export async function getFestDataForAI() {
  const now = Date.now();
  if (cachedFestData && now - lastFestDataFetch < FEST_CACHE_TTL_MS) {
    return cachedFestData;
  }

  await connectDB();

  // Fetch data in parallel
  const [teams, programs, results, students, regSchedule] = await Promise.all([
    TeamModel.find({}, "id name total_points color leader").lean(),
    ProgramModel.find({}, "id name section stage scheduledDate scheduledTime scheduleStatus candidateLimit").lean(),
    ApprovedResultModel.find({}, "program_id entries").lean(),
    StudentModel.find({}, "id name chest_no team_id").lean(),
    RegistrationScheduleModel.findOne({ key: "global" }).lean(),
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

  // 2. Program Schedules & Timings
  context += "PROGRAM SCHEDULES & TIMINGS:\n";
  const scheduledPrograms = programs.filter((p) => {
    const hasDate = Boolean(p.scheduledDate && p.scheduledDate.trim() && p.scheduledDate.toUpperCase() !== "TBA");
    const hasTime = Boolean(p.scheduledTime && p.scheduledTime.trim() && p.scheduledTime.toUpperCase() !== "TBA");
    return hasDate || hasTime || p.scheduleStatus === "live" || p.scheduleStatus === "ended";
  });

  if (scheduledPrograms.length === 0) {
    context += "No programs scheduled yet.\n";
  } else {
    // Sort: live first, then upcoming (by date/time), then ended
    const sortedScheduled = [...scheduledPrograms].sort((a, b) => {
      const statusWeight = (status?: string) => {
        if (status === "live") return 0;
        if (status === "ended") return 2;
        return 1; // upcoming
      };
      const diff = statusWeight(a.scheduleStatus) - statusWeight(b.scheduleStatus);
      if (diff !== 0) return diff;
      const dateA = a.scheduledDate || "9999";
      const dateB = b.scheduledDate || "9999";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.scheduledTime || "99:99";
      const timeB = b.scheduledTime || "99:99";
      return timeA.localeCompare(timeB);
    });

    sortedScheduled.forEach((p) => {
      const stageStr = p.stage ? "On-Stage" : "Off-Stage";
      const statusStr = (p.scheduleStatus || "upcoming").toUpperCase();
      const dateStr = p.scheduledDate || "TBA";
      const timeStr = p.scheduledTime || "TBA";
      context += `- ${p.name} | Status: ${statusStr} | Date: ${dateStr} | Time: ${timeStr} | Section: ${p.section} (${stageStr})\n`;
    });
  }
  context += "\n";

  // 3. Published Results
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

  // 4. Registration Schedule
  if (regSchedule?.startDateTime && regSchedule?.endDateTime) {
    context += `REGISTRATION SCHEDULE WINDOW:\n- Registration Starts: ${regSchedule.startDateTime}\n- Registration Ends: ${regSchedule.endDateTime}\n\n`;
  }

  // 5. All Programs List
  context += `ALL PROGRAMS (${programs.length} total):\n`;
  programs.forEach((p) => {
    const stageStr = p.stage ? "On-Stage" : "Off-Stage";
    const schedInfo = p.scheduledDate
      ? ` | Scheduled: ${p.scheduledDate} ${p.scheduledTime || ""} (${p.scheduleStatus || "upcoming"})`
      : "";
    context += `- ${p.name} (Section: ${p.section}, ${stageStr}${schedInfo})\n`;
  });
  context += "\n";

  // 6. Students Directory
  context += `STUDENT DIRECTORY (${students.length} total):\n`;
  students.forEach((s) => {
    const tName = teamMap.get(s.team_id) || "Unknown Team";
    context += `- ${s.name} (Chest: ${s.chest_no}, Team: ${tName})\n`;
  });

  cachedFestData = context;
  lastFestDataFetch = Date.now();
  return context;
}
