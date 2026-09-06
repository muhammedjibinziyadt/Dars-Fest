import { NextResponse } from "next/server";
import { userScoresCol, docsToData } from "@/lib/models";
import type { UserScore } from "@/lib/types";

export async function GET() {
  try {
    const snap = await userScoresCol.orderBy("score", "desc").limit(50).get();
    const leaderboard = docsToData<UserScore>(snap);

    const ranked = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return NextResponse.json(ranked);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
