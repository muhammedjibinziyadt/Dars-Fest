"use server";

import { revalidatePath } from "next/cache";
import { recalculateAndSyncAllScores } from "@/lib/top-scorer-service";

export async function syncAllScoresAction() {
  try {
    const result = await recalculateAndSyncAllScores();
    revalidatePath("/");
    revalidatePath("/scoreboard");
    revalidatePath("/top-scorers");
    revalidatePath("/results");
    revalidatePath("/admin/approved-results");
    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: `Scores updated & synchronized! Processed ${result.resultsProcessed} approved results.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to sync scores",
    };
  }
}
