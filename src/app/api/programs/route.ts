import { NextRequest, NextResponse } from "next/server";
import { getPrograms } from "@/lib/data";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduledOnly = searchParams.get("scheduled") === "true";
    const programs = await getPrograms();

    let result = programs;
    if (scheduledOnly) {
      result = programs.filter(
        (p) =>
          Boolean(p.scheduledDate && p.scheduledDate.trim() && p.scheduledDate.toUpperCase() !== "TBA") ||
          Boolean(p.scheduledTime && p.scheduledTime.trim() && p.scheduledTime.toUpperCase() !== "TBA") ||
          p.scheduleStatus === "live"
      );
    }

    return NextResponse.json(
      { success: true, count: result.length, programs: result },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("GET /api/programs error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch programs" },
      { status: 500, headers: corsHeaders }
    );
  }
}
