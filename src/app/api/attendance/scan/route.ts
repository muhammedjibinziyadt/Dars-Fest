import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ProgramModel,
  ProgramRegistrationModel,
  TeamModel,
  AttendanceModel,
} from "@/lib/models";
import { markStudentAttendance } from "@/lib/attendance-service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function extractChestNumber(raw: string): string {
  let cleaned = (raw || "").trim();
  if (cleaned.includes("/participant/")) {
    const parts = cleaned.split("/participant/")[1];
    cleaned = parts.split(/[?#/]/)[0];
  }
  return cleaned.trim().toUpperCase();
}

/**
 * POST /api/attendance/scan
 * Body:
 * {
 *   "scannedCode": "A101" | "https://.../participant/A101",
 *   "programId": "optional-program-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCode = body.scannedCode || body.chestNumber || body.code;
    const programId = body.programId;

    if (!rawCode) {
      return NextResponse.json(
        { success: false, error: "scannedCode or chestNumber is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const chestNo = extractChestNumber(rawCode);
    await connectDB();

    // 1. Find student
    const student = await StudentModel.findOne({ chest_no: chestNo }).lean();
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          reason: "not_found",
          message: `Participant with Chest #${chestNo} not found.`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Find team
    const team = await TeamModel.findOne({ id: student.team_id }).lean();
    const teamName = team?.name || "Unknown Team";

    // 3. Find all registrations for this student
    const registrations = await ProgramRegistrationModel.find({
      studentId: student.id,
    }).lean();

    const studentInfo = {
      id: student.id,
      name: student.name,
      chestNumber: student.chest_no,
      avatar: student.avatar,
      team: {
        id: student.team_id,
        name: teamName,
        color: team?.color,
      },
    };

    // If programId is NOT provided, return participant info and their registered programs
    if (!programId) {
      return NextResponse.json(
        {
          success: true,
          mode: "lookup",
          student: studentInfo,
          registeredPrograms: registrations.map((r) => ({
            programId: r.programId,
            programName: r.programName,
          })),
          message: `Participant ${student.name} (Chest #${student.chest_no}) identified.`,
        },
        { headers: corsHeaders }
      );
    }

    // 4. If programId is provided, verify program and mark attendance
    const program = await ProgramModel.findOne({ id: programId }).lean();
    if (!program) {
      return NextResponse.json(
        { success: false, error: "Program not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const isRegistered = registrations.some(
      (r) => r.programId === programId || r.studentChest === student.chest_no
    );

    if (!isRegistered) {
      return NextResponse.json(
        {
          success: false,
          reason: "not_registered",
          student: studentInfo,
          program: { id: program.id, name: program.name },
          message: `${student.name} (Chest #${student.chest_no}) is NOT registered for "${program.name}".`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if already present
    const recordId = `${programId}_${student.id}`;
    const existing = await AttendanceModel.findOne({ id: recordId }).lean();
    if (existing && existing.status === "present") {
      return NextResponse.json(
        {
          success: true,
          alreadyMarked: true,
          student: studentInfo,
          program: { id: program.id, name: program.name },
          record: existing,
          message: `${student.name} (Chest #${student.chest_no}) is ALREADY marked present.`,
        },
        { headers: corsHeaders }
      );
    }

    // Mark as present
    const record = await markStudentAttendance({
      programId,
      studentId: student.id,
      studentChest: student.chest_no,
      studentName: student.name,
      teamId: student.team_id,
      teamName,
      status: "present",
      markedBy: body.scannerName || "AI Scanner App",
    });

    return NextResponse.json(
      {
        success: true,
        alreadyMarked: false,
        student: studentInfo,
        program: { id: program.id, name: program.name },
        record,
        message: `Verified! ${student.name} (Chest #${student.chest_no}) marked PRESENT for "${program.name}".`,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("POST /api/attendance/scan error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process scan" },
      { status: 500, headers: corsHeaders }
    );
  }
}
