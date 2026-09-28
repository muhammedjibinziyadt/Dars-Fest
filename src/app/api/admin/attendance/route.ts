import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ProgramModel,
  ProgramRegistrationModel,
  TeamModel,
  AttendanceModel,
} from "@/lib/models";
import {
  getProgramAttendance,
  markStudentAttendance,
  toggleStudentAttendance,
  markAllProgramAttendance,
  clearProgramAttendance,
} from "@/lib/attendance-service";

/**
 * Helper to clean and extract chest number from raw QR code or input
 */
function extractChestNumber(raw: string): string {
  let cleaned = (raw || "").trim();
  if (cleaned.includes("/participant/")) {
    const parts = cleaned.split("/participant/")[1];
    cleaned = parts.split(/[?#/]/)[0];
  }
  return cleaned.trim().toUpperCase();
}

/**
 * GET /api/admin/attendance?programId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    const records = await getProgramAttendance(programId);
    return NextResponse.json({ records });
  } catch (error: unknown) {
    console.error("GET /api/admin/attendance error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/attendance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, programId } = body;

    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify program exists
    const program = await ProgramModel.findOne({ id: programId }).lean();
    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // ACTION: SCAN (QR Code Scanned)
    if (action === "scan") {
      const rawCode = body.scannedCode || body.chestNumber;
      if (!rawCode) {
        return NextResponse.json(
          { error: "Scanned QR code content is required" },
          { status: 400 }
        );
      }

      const chestNo = extractChestNumber(rawCode);

      // Find student in DB by chest number
      const student = await StudentModel.findOne({ chest_no: chestNo }).lean();
      if (!student) {
        return NextResponse.json(
          {
            success: false,
            reason: "not_found",
            message: `Participant with Chest #${chestNo} not found in system.`,
          },
          { status: 404 }
        );
      }

      // Check team details
      const team = await TeamModel.findOne({ id: student.team_id }).lean();
      const teamName = team?.name || "Unknown Team";

      // Verify student is registered for this program
      const registration = await ProgramRegistrationModel.findOne({
        programId,
        $or: [
          { studentId: student.id },
          { studentChest: student.chest_no },
        ],
      }).lean();

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            reason: "not_registered",
            student: {
              id: student.id,
              name: student.name,
              chest_no: student.chest_no,
              avatar: student.avatar,
              teamName,
              teamColor: team?.color,
            },
            message: `${student.name} (Chest #${student.chest_no}) is NOT registered for "${program.name}".`,
          },
          { status: 400 }
        );
      }

      // Check if already marked present
      const recordId = `${programId}_${student.id}`;
      const existingRecord = await AttendanceModel.findOne({ id: recordId }).lean();

      if (existingRecord && existingRecord.status === "present") {
        return NextResponse.json({
          success: true,
          alreadyMarked: true,
          record: existingRecord,
          student: {
            id: student.id,
            name: student.name,
            chest_no: student.chest_no,
            avatar: student.avatar,
            teamName,
            teamColor: team?.color,
          },
          message: `${student.name} (Chest #${student.chest_no}) is ALREADY marked present.`,
        });
      }

      // Mark student as present
      const record = await markStudentAttendance({
        programId,
        studentId: student.id,
        studentChest: student.chest_no,
        studentName: student.name,
        teamId: student.team_id,
        teamName,
        status: "present",
        markedBy: "QR Scanner",
      });

      return NextResponse.json({
        success: true,
        alreadyMarked: false,
        record,
        student: {
          id: student.id,
          name: student.name,
          chest_no: student.chest_no,
          avatar: student.avatar,
          teamName,
          teamColor: team?.color,
        },
        message: `Verified! ${student.name} (Chest #${student.chest_no}) marked PRESENT for "${program.name}".`,
      });
    }

    // ACTION: TOGGLE (Manual click to mark present/absent)
    if (action === "toggle") {
      const { studentId, studentChest, studentName, teamId, teamName } = body;
      if (!studentId) {
        return NextResponse.json(
          { error: "Student ID is required" },
          { status: 400 }
        );
      }

      const updatedRecord = await toggleStudentAttendance({
        programId,
        studentId,
        studentChest: studentChest || "",
        studentName,
        teamId,
        teamName,
      });

      return NextResponse.json({
        success: true,
        record: updatedRecord,
      });
    }

    // ACTION: MARK_ALL
    if (action === "mark_all") {
      const { students, status } = body;
      if (!Array.isArray(students) || students.length === 0) {
        return NextResponse.json(
          { error: "Students list is required" },
          { status: 400 }
        );
      }

      await markAllProgramAttendance(programId, students, status || "present");
      const records = await getProgramAttendance(programId);

      return NextResponse.json({
        success: true,
        records,
        message: `All students marked as ${status || "present"}.`,
      });
    }

    // ACTION: CLEAR
    if (action === "clear") {
      await clearProgramAttendance(programId);
      return NextResponse.json({
        success: true,
        records: [],
        message: "Attendance records cleared for this program.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/attendance error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to process attendance" },
      { status: 500 }
    );
  }
}
