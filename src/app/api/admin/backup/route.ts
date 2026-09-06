import { NextResponse } from "next/server";
import {
  teamsCol,
  studentsCol,
  programsCol,
  juriesCol,
  assignedProgramsCol,
  programRegistrationsCol,
  registrationSchedulesCol,
  pendingResultsCol,
  approvedResultsCol,
  liveScoresCol,
  replacementRequestsCol,
  notificationsCol,
  docsToData,
} from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [
    teamsSnap,
    studentsSnap,
    programsSnap,
    juriesSnap,
    assignedSnap,
    regsSnap,
    schedSnap,
    pendingSnap,
    approvedSnap,
    scoresSnap,
    reqsSnap,
    notifsSnap,
  ] = await Promise.all([
    teamsCol.get(),
    studentsCol.get(),
    programsCol.get(),
    juriesCol.get(),
    assignedProgramsCol.get(),
    programRegistrationsCol.get(),
    registrationSchedulesCol.get(),
    pendingResultsCol.get(),
    approvedResultsCol.get(),
    liveScoresCol.get(),
    replacementRequestsCol.get(),
    notificationsCol.get(),
  ]);

  const teams = docsToData(teamsSnap).map((t: any) => {
    const { portal_password, ...rest } = t;
    return rest;
  });

  const juries = docsToData(juriesSnap).map((j: any) => {
    const { password, ...rest } = j;
    return rest;
  });

  const data = {
    teams,
    students: docsToData(studentsSnap),
    programs: docsToData(programsSnap),
    juries,
    assignedPrograms: docsToData(assignedSnap),
    programRegistrations: docsToData(regsSnap),
    registrationSchedules: docsToData(schedSnap),
    pendingResults: docsToData(pendingSnap),
    approvedResults: docsToData(approvedSnap),
    liveScores: docsToData(scoresSnap),
    replacementRequests: docsToData(reqsSnap),
    notifications: docsToData(notifsSnap),
    timestamp: new Date().toISOString(),
    version: "2.0-firestore",
  };

  const json = JSON.stringify(data, null, 2);
  const filename = `funoon-fiesta-backup-${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
