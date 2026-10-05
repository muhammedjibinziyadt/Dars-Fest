import { NextRequest, NextResponse } from "next/server";
import { getParticipantProfile } from "@/lib/participant-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chestNumber: string }> }
) {
  try {
    const { chestNumber } = await params;
    const cleanedChest = (chestNumber || "").trim().toUpperCase();

    if (!cleanedChest) {
      return NextResponse.json(
        { success: false, error: "Chest number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const profile = await getParticipantProfile(cleanedChest);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: `Participant with chest number "${cleanedChest}" not found` },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        participant: {
          id: profile.student.id,
          name: profile.student.name,
          chestNumber: profile.student.chest_no,
          avatar: profile.student.avatar,
          team: {
            id: profile.team.id,
            name: profile.team.name,
            color: profile.team.color,
          },
          totalPoints: profile.totalPoints,
          registeredPrograms: profile.registrations.map((r) => ({
            programId: r.programId,
            programName: r.program.name,
            section: r.program.section,
            stage: r.program.stage,
            scheduledDate: r.program.scheduledDate || null,
            scheduledTime: r.program.scheduledTime || null,
            scheduleStatus: r.program.scheduleStatus || "upcoming",
            status: r.status,
          })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("GET /api/participants/[chestNumber] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch participant" },
      { status: 500, headers: corsHeaders }
    );
  }
}
