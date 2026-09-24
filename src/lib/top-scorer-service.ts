import { connectDB } from "./db";
import {
  ApprovedResultModel,
  LiveScoreModel,
  ProgramModel,
  ProgramRegistrationModel,
  StudentModel,
  TeamModel,
  invalidateAllCaches,
} from "./models";
import { normalize } from "./data";
import type { GradeType, Program, ProgramRegistration, ResultRecord, SectionType, Student, Team } from "./types";

export type TopScorerCategory = "overall" | "individual" | "group";

export interface TopScorerAchievement {
  programId: string;
  programName: string;
  section: SectionType;
  stage: boolean;
  position: number;
  grade?: GradeType;
  score: number;
  isGroup: boolean;
}

export interface TopScorerItem {
  rank: number;
  student: Student;
  team: {
    id: string;
    name: string;
    color: string;
    leader?: string;
  };
  totalPoints: number;
  individualPoints: number;
  groupPoints: number;
  penalties: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  achievements: TopScorerAchievement[];
}

export interface TopScorerDataResult {
  overall: TopScorerItem[];
  individual: TopScorerItem[];
  group: TopScorerItem[];
  totalParticipants: number;
  programsCompleted: number;
}

const globalForTopScorers = globalThis as unknown as {
  __topScorersCache?: { data: TopScorerDataResult; timestamp: number };
  __topScorersPending?: Promise<TopScorerDataResult>;
};

const TOP_SCORERS_TTL_MS = 45_000; // 45 seconds fresh
const TOP_SCORERS_STALE_MS = 10 * 60_000; // 10 minutes stale allowed

export function invalidateTopScorersCache() {
  delete globalForTopScorers.__topScorersCache;
  delete globalForTopScorers.__topScorersPending;
}

/**
 * Calculates top scorers across Overall, Individual, and Group categories.
 * - Individual events: 1st Place = 10, 2nd Place = 7, 3rd Place = 5
 * - Group events: 1st Place = 20, 2nd Place = 10 (awarded to registered members of winning team)
 */
async function computeTopScorersData(): Promise<TopScorerDataResult> {
  try {
    await connectDB();

    const [studentsRaw, teamsRaw, programsRaw, resultsRaw, registrationsRaw] = await Promise.all([
      StudentModel.find().lean<Student[]>(),
      TeamModel.find().lean<Team[]>(),
      ProgramModel.find().lean<Program[]>(),
      ApprovedResultModel.find().lean<ResultRecord[]>(),
      ProgramRegistrationModel.find().lean<ProgramRegistration[]>(),
    ]);

    const students: Student[] = normalize<Student>(studentsRaw as Student[]);
    const teams: Team[] = normalize<Team>(teamsRaw as Team[]);
    const programs: Program[] = normalize<Program>(programsRaw as Program[]);
    const results: ResultRecord[] = normalize<ResultRecord>(resultsRaw as ResultRecord[]);
    const registrations: ProgramRegistration[] = normalize<ProgramRegistration>(registrationsRaw as ProgramRegistration[]);

    const teamMap = new Map<string, { id: string; name: string; color: string; leader?: string }>(
      teams.map((team: Team) => [
        team.id,
        {
          id: team.id,
          name: team.name || "Unknown Team",
          color: team.color || "#8B4513",
          leader: team.leader,
        },
      ]),
    );

    const programMap = new Map<string, Program>(programs.map((program: Program) => [program.id, program]));

    // Index registrations by studentId
    const registrationsByStudent = new Map<string, ProgramRegistration[]>();
    for (const reg of registrations) {
      if (!reg.studentId) continue;
      const list = registrationsByStudent.get(reg.studentId) || [];
      list.push(reg);
      registrationsByStudent.set(reg.studentId, list);
    }

    // Index approved results by programId
    const resultsByProgram = new Map<string, ResultRecord>();
    for (const res of results) {
      if (res.program_id) {
        resultsByProgram.set(res.program_id, res);
      }
    }

    const allScorerItems: Omit<TopScorerItem, "rank">[] = [];

    for (const student of students) {
      const team = teamMap.get(student.team_id) || {
        id: student.team_id || "unknown",
        name: "Unknown Team",
        color: "#8B4513",
      };

      let individualPoints = 0;
      let groupPoints = 0;
      let penalties = 0;
      let gold = 0;
      let silver = 0;
      let bronze = 0;
      const achievements: TopScorerAchievement[] = [];

      // 1. Process Individual (Single) program results
      for (const result of results) {
        const program = programMap.get(result.program_id);
        if (!program) continue;

        if (program.section === "single") {
          const studentEntry = (result.entries || []).find((e) => e.student_id === student.id);
          if (studentEntry) {
            const score = studentEntry.score || 0;
            individualPoints += score;

            if (studentEntry.position === 1) gold++;
            else if (studentEntry.position === 2) silver++;
            else if (studentEntry.position === 3) bronze++;

            achievements.push({
              programId: program.id,
              programName: program.name,
              section: program.section,
              stage: program.stage,
              position: studentEntry.position,
              grade: studentEntry.grade,
              score,
              isGroup: false,
            });
          }
        }

        // Check student penalties
        if (result.penalties) {
          for (const penalty of result.penalties) {
            if (penalty.student_id === student.id) {
              penalties += penalty.points || 0;
            }
          }
        }
      }

      // 2. Process Group program results based on student's registrations
      const studentRegistrations = registrationsByStudent.get(student.id) || [];
      for (const reg of studentRegistrations) {
        const program = programMap.get(reg.programId);
        if (!program || program.section !== "group") continue;

        const groupResult = resultsByProgram.get(reg.programId);
        if (!groupResult) continue;

        const teamEntry = (groupResult.entries || []).find((e) => e.team_id === student.team_id);
        if (teamEntry && teamEntry.score > 0) {
          groupPoints += teamEntry.score;

          if (teamEntry.position === 1) gold++;
          else if (teamEntry.position === 2) silver++;
          else if (teamEntry.position === 3) bronze++;

          achievements.push({
            programId: program.id,
            programName: program.name,
            section: "group",
            stage: program.stage,
            position: teamEntry.position,
            grade: teamEntry.grade,
            score: teamEntry.score,
            isGroup: true,
          });
        }
      }

      const totalPoints = Math.max(0, individualPoints + groupPoints - penalties);

      allScorerItems.push({
        student,
        team,
        totalPoints,
        individualPoints,
        groupPoints,
        penalties,
        medals: {
          gold,
          silver,
          bronze,
          total: gold + silver + bronze,
        },
        achievements: achievements.sort((a, b) => a.position - b.position),
      });
    }

    // Sort and assign ranks
    const assignRanks = (
      items: Omit<TopScorerItem, "rank">[],
      scoreKey: "totalPoints" | "individualPoints" | "groupPoints",
    ): TopScorerItem[] => {
      const sorted = [...items].sort((a, b) => {
        // 1. Primary score
        if (b[scoreKey] !== a[scoreKey]) {
          return b[scoreKey] - a[scoreKey];
        }
        // 2. Gold medals
        if (b.medals.gold !== a.medals.gold) {
          return b.medals.gold - a.medals.gold;
        }
        // 3. Silver medals
        if (b.medals.silver !== a.medals.silver) {
          return b.medals.silver - a.medals.silver;
        }
        // 4. Bronze medals
        if (b.medals.bronze !== a.medals.bronze) {
          return b.medals.bronze - a.medals.bronze;
        }
        // 5. Total points
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        // 6. Alphabetical
        return (a.student.name || "").localeCompare(b.student.name || "");
      });

      let currentRank = 1;
      return sorted.map((item, index) => {
        if (index > 0) {
          const prev = sorted[index - 1];
          if (
            item[scoreKey] === prev[scoreKey] &&
            item.medals.gold === prev.medals.gold &&
            item.medals.silver === prev.medals.silver &&
            item.medals.bronze === prev.medals.bronze
          ) {
            // Same rank for exact tie
            return { ...item, rank: currentRank };
          }
        }
        currentRank = index + 1;
        return { ...item, rank: currentRank };
      });
    };

    const overall = assignRanks(allScorerItems, "totalPoints");
    const individual = assignRanks(allScorerItems, "individualPoints");
    const group = assignRanks(allScorerItems, "groupPoints");

    return {
      overall,
      individual,
      group,
      totalParticipants: students.length,
      programsCompleted: results.length,
    };
  } catch (error) {
    console.error("Error in computeTopScorersData:", error);
    return {
      overall: [],
      individual: [],
      group: [],
      totalParticipants: 0,
      programsCompleted: 0,
    };
  }
}

/**
 * Returns top scorers with ultra-fast in-memory caching and SWR background revalidation.
 * Typical response time: < 1ms for warm requests, < 3s for cold background fetch.
 */
export async function getTopScorersData(): Promise<TopScorerDataResult> {
  const cached = globalForTopScorers.__topScorersCache;
  const now = Date.now();

  // Fresh cache hit (< 45s): return immediately in ~0.5ms
  if (cached && now - cached.timestamp < TOP_SCORERS_TTL_MS) {
    return cached.data;
  }

  // Stale cache hit (< 10m): return stale immediately, revalidate in background
  if (cached && now - cached.timestamp < TOP_SCORERS_STALE_MS) {
    if (!globalForTopScorers.__topScorersPending) {
      globalForTopScorers.__topScorersPending = computeTopScorersData()
        .then((fresh) => {
          globalForTopScorers.__topScorersCache = { data: fresh, timestamp: Date.now() };
          return fresh;
        })
        .finally(() => {
          globalForTopScorers.__topScorersPending = undefined;
        });
    }
    return cached.data;
  }

  // Cold start: await compute with request deduplication
  if (!globalForTopScorers.__topScorersPending) {
    globalForTopScorers.__topScorersPending = computeTopScorersData()
      .then((fresh) => {
        globalForTopScorers.__topScorersCache = { data: fresh, timestamp: Date.now() };
        return fresh;
      })
      .finally(() => {
        globalForTopScorers.__topScorersPending = undefined;
      });
  }

  return globalForTopScorers.__topScorersPending;
}

/**
 * Recalculates and synchronizes all team and student scores in the database
 * based on approved results, point definitions, and registrations.
 */
export async function recalculateAndSyncAllScores(): Promise<{
  success: boolean;
  updatedStudents: number;
  updatedTeams: number;
  resultsProcessed: number;
}> {
  await connectDB();

  const [studentsRaw, teamsRaw, programsRaw, resultsRaw, registrationsRaw] = await Promise.all([
    StudentModel.find().lean<Student[]>(),
    TeamModel.find().lean<Team[]>(),
    ProgramModel.find().lean<Program[]>(),
    ApprovedResultModel.find().lean<ResultRecord[]>(),
    ProgramRegistrationModel.find().lean<ProgramRegistration[]>(),
  ]);

  const students: Student[] = normalize<Student>(studentsRaw as Student[]);
  const teams: Team[] = normalize<Team>(teamsRaw as Team[]);
  const programs: Program[] = normalize<Program>(programsRaw as Program[]);
  const results: ResultRecord[] = normalize<ResultRecord>(resultsRaw as ResultRecord[]);
  const registrations: ProgramRegistration[] = normalize<ProgramRegistration>(registrationsRaw as ProgramRegistration[]);

  const programMap = new Map<string, Program>(programs.map((p: Program) => [p.id, p]));

  // Index registrations by studentId and programId
  const regMap = new Map<string, ProgramRegistration[]>();
  for (const reg of registrations) {
    const list = regMap.get(`${reg.programId}_${reg.teamId}`) || [];
    list.push(reg);
    regMap.set(`${reg.programId}_${reg.teamId}`, list);
  }

  // 1. Calculate Team Scores
  const teamScoreMap = new Map<string, number>();
  for (const team of teams) {
    teamScoreMap.set(team.id, 0);
  }

  // 2. Calculate Student Scores
  const studentScoreMap = new Map<
    string,
    { total: number; individual: number; group: number }
  >();
  for (const student of students) {
    studentScoreMap.set(student.id, { total: 0, individual: 0, group: 0 });
  }

  // Process approved results
  for (const result of results) {
    const program = programMap.get(result.program_id);
    if (!program) continue;

    for (const entry of result.entries || []) {
      const score = entry.score || 0;

      // Update Team Score
      if (entry.team_id) {
        const curTeam = teamScoreMap.get(entry.team_id) || 0;
        teamScoreMap.set(entry.team_id, curTeam + score);
      }

      // Update Student Score for Single
      if (program.section === "single" && entry.student_id) {
        const cur = studentScoreMap.get(entry.student_id) || { total: 0, individual: 0, group: 0 };
        cur.individual += score;
        cur.total += score;
        studentScoreMap.set(entry.student_id, cur);
      }

      // Update Student Score for Group: registered team members earn group points
      if (program.section === "group" && entry.team_id && score > 0) {
        const registeredStudents = regMap.get(`${program.id}_${entry.team_id}`) || [];
        for (const reg of registeredStudents) {
          if (reg.studentId) {
            const cur = studentScoreMap.get(reg.studentId) || { total: 0, individual: 0, group: 0 };
            cur.group += score;
            cur.total += score;
            studentScoreMap.set(reg.studentId, cur);
          }
        }
      }
    }

    // Process penalties
    if (result.penalties) {
      for (const penalty of result.penalties) {
        const penaltyPoints = penalty.points || 0;
        if (penalty.team_id) {
          const curTeam = teamScoreMap.get(penalty.team_id) || 0;
          teamScoreMap.set(penalty.team_id, curTeam - penaltyPoints);
        }
        if (penalty.student_id) {
          const cur = studentScoreMap.get(penalty.student_id) || { total: 0, individual: 0, group: 0 };
          cur.total = Math.max(0, cur.total - penaltyPoints);
          studentScoreMap.set(penalty.student_id, cur);
        }
      }
    }
  }

  // 3. Persist to Firestore: Teams & Live Scores
  const teamUpdates = Array.from(teamScoreMap.entries()).map(([teamId, totalPoints]) => {
    return Promise.all([
      TeamModel.updateOne({ id: teamId }, { $set: { total_points: totalPoints } }),
      LiveScoreModel.updateOne(
        { team_id: teamId },
        { $set: { total_points: totalPoints } },
        { upsert: true },
      ),
    ]);
  });

  // 4. Persist to Firestore: Students
  const studentUpdates = Array.from(studentScoreMap.entries()).map(
    ([studentId, scores]) => {
      return StudentModel.updateOne(
        { id: studentId },
        {
          $set: {
            total_points: scores.total,
            individual_points: scores.individual,
            group_points: scores.group,
          },
        },
      );
    },
  );

  await Promise.all([...teamUpdates, ...studentUpdates]);

  invalidateAllCaches();

  return {
    success: true,
    updatedStudents: students.length,
    updatedTeams: teams.length,
    resultsProcessed: results.length,
  };
}
