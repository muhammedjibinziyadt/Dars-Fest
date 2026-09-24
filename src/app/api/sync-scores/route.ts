import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { recalculateAndSyncAllScores } from "@/lib/top-scorer-service";

export async function POST() {
  try {
    const result = await recalculateAndSyncAllScores();

    revalidatePath("/");
    revalidatePath("/scoreboard");
    revalidatePath("/top-scorers");
    revalidatePath("/results");
    revalidatePath("/admin/approved-results");

    return NextResponse.json({
      message: `Scores synced successfully! Processed ${result.resultsProcessed} results, updated ${result.updatedStudents} students and ${result.updatedTeams} teams.`,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to recalculate scores",
      },
      { status: 500 },
    );
  }
}
