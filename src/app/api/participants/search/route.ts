import { NextRequest, NextResponse } from "next/server";
import { searchParticipant } from "@/lib/participant-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const results = await searchParticipant(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search participants" },
      { status: 500 }
    );
  }
}

