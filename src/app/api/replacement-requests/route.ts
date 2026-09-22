import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getReplacementRequests } from "@/lib/team-data";

export async function GET() {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await getReplacementRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch replacement requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

