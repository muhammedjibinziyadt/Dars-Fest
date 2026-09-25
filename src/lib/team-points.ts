import { connectDB } from "./db";
import {
  StudentModel,
  TeamModel,
  ProgramModel,
  ProgramRegistrationModel,
  ApprovedResultModel,
} from "./models";
import type { Program, ResultRecord } from "./types";

export interface WinningProgramDetail {
  programId: string;
  programName: string;
  section: "single" | "group" | "general";
  stage: boolean;
  position: number;
  grade?: "A" | "B" | "C" | "none";
  points: number;
  isGroup: boolean;
}

export interface TeamWinningStudent {
  id: string;
  name: string;
  chestNumber: string;
  avatar?: string;
  totalPoints: number;
  individualPoints: number;
  groupPoints: number;
  winnedPrograms: WinningProgramDetail[];
}

export interface TeamPointsSummary {
  teamId: string;
  teamName: string;
  leaderName: string;
  totalPoints: number;
  winningStudentsCount: number;
  totalWinningProgramsCount: number;
  firstPlacesCount: number;
  secondPlacesCount: number;
  thirdPlacesCount: number;
  students: TeamWinningStudent[];
}

export async function getTeamPointsSummary(teamId: string): Promise<TeamPointsSummary> {
  await connectDB();

  const [team, students, registrations, programs, approvedResults] = await Promise.all([
    TeamModel.findOne({ id: teamId }).lean(),
    StudentModel.find({ team_id: teamId }).lean(),
    ProgramRegistrationModel.find({ teamId }).lean(),
    ProgramModel.find().lean<Program[]>(),
    ApprovedResultModel.find().lean<ResultRecord[]>(),
  ]);

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  const programMap = new Map<string, Program>(programs.map((p) => [p.id, p]));

  // Track winning program IDs for the whole team
  const winningProgramIds = new Set<string>();
  let firstPlacesCount = 0;
  let secondPlacesCount = 0;
  let thirdPlacesCount = 0;

  // Build winning students list
  const winningStudents: TeamWinningStudent[] = students.map((student: any) => {
    const studentRegs = registrations.filter(
      (r: any) => r.studentId === student.id || r.studentChest === student.chest_no
    );

    const winnedPrograms: WinningProgramDetail[] = [];

    approvedResults.forEach((result) => {
      const prog = programMap.get(result.program_id);
      if (!prog) return;

      // 1. Single program win
      const singleEntry = result.entries.find(
        (e) => e.student_id === student.id || (e.team_id === teamId && studentRegs.some((r: any) => r.programId === prog.id && prog.section === "single"))
      );

      if (singleEntry) {
        winnedPrograms.push({
          programId: prog.id,
          programName: prog.name,
          section: prog.section,
          stage: prog.stage ?? false,
          position: singleEntry.position,
          grade: singleEntry.grade,
          points: singleEntry.score,
          isGroup: false,
        });
      }

      // 2. Group/General program win (all students registered in this group program share the win)
      const groupEntry = result.entries.find((e) => e.team_id === teamId);
      if (groupEntry && (prog.section === "group" || prog.section === "general")) {
        const isRegisteredInGroup = studentRegs.some((r: any) => r.programId === prog.id);
        if (isRegisteredInGroup) {
          winnedPrograms.push({
            programId: prog.id,
            programName: prog.name,
            section: prog.section,
            stage: prog.stage ?? false,
            position: groupEntry.position,
            grade: groupEntry.grade,
            points: groupEntry.score,
            isGroup: true,
          });
        }
      }
    });

    // Sort student's winned programs by position (1st first, then 2nd, etc.)
    winnedPrograms.sort((a, b) => a.position - b.position);

    const studentTotalPoints = student.total_points ?? 0;
    const studentIndPoints = student.individual_points ?? 0;
    const studentGrpPoints = student.group_points ?? 0;

    return {
      id: student.id,
      name: student.name,
      chestNumber: student.chest_no,
      avatar: student.avatar,
      totalPoints: studentTotalPoints,
      individualPoints: studentIndPoints,
      groupPoints: studentGrpPoints,
      winnedPrograms,
    };
  });

  // Filter students who have won programs OR have points > 0
  const activeWinners = winningStudents.filter(
    (s) => s.winnedPrograms.length > 0 || s.totalPoints > 0
  );

  // Sort winners by total points descending
  activeWinners.sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate team total points from students (matches the dashboard calculation)
  const totalTeamPoints = winningStudents.reduce((sum, s) => sum + s.totalPoints, 0);

  // Calculate team-level program placements (1st, 2nd, 3rd)
  approvedResults.forEach((result) => {
    const prog = programMap.get(result.program_id);
    if (!prog) return;

    // Check if team won in this program (either single entry from this team or team group entry)
    const teamEntries = result.entries.filter((e) => e.team_id === teamId);
    if (teamEntries.length > 0) {
      winningProgramIds.add(prog.id);
      teamEntries.forEach((e) => {
        if (e.position === 1) firstPlacesCount++;
        else if (e.position === 2) secondPlacesCount++;
        else if (e.position === 3) thirdPlacesCount++;
      });
    }
  });

  return {
    teamId: team.id,
    teamName: team.name,
    leaderName: team.leader,
    totalPoints: totalTeamPoints,
    winningStudentsCount: activeWinners.length,
    totalWinningProgramsCount: winningProgramIds.size,
    firstPlacesCount,
    secondPlacesCount,
    thirdPlacesCount,
    students: activeWinners,
  };
}
