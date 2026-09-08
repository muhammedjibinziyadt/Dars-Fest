import { revalidatePath } from "next/cache";
import { getScoringRules, saveScoringRules } from "@/lib/data";
import { AddGradesManager } from "@/components/add-grades-manager";
import type { ScoringRules } from "@/lib/types";

export const dynamic = "force-dynamic";

async function saveScoringRulesAction(rules: ScoringRules): Promise<{ success: boolean; error?: string }> {
  "use server";
  try {
    // Validate rules to ensure non-negative numbers
    const sanitized: ScoringRules = {
      single: {
        first: Math.max(0, Number(rules.single.first) || 0),
        second: Math.max(0, Number(rules.single.second) || 0),
        third: Math.max(0, Number(rules.single.third) || 0),
        gradeA: Math.max(0, Number(rules.single.gradeA) || 0),
        gradeB: Math.max(0, Number(rules.single.gradeB) || 0),
        gradeC: Math.max(0, Number(rules.single.gradeC) || 0),
      },
      group: {
        first: Math.max(0, Number(rules.group.first) || 0),
        second: Math.max(0, Number(rules.group.second) || 0),
        third: Math.max(0, Number(rules.group.third) || 0),
      },
      general: {
        first: Math.max(0, Number(rules.general.first) || 0),
        second: Math.max(0, Number(rules.general.second) || 0),
        third: Math.max(0, Number(rules.general.third) || 0),
      },
    };

    await saveScoringRules(sanitized);
    revalidatePath("/admin/add-grades");
    revalidatePath("/admin/add-result");
    revalidatePath("/admin/pending-results");
    revalidatePath("/admin/approved-results");
    revalidatePath("/scoreboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save scoring rules.";
    return { success: false, error: message };
  }
}

export default async function AddGradesPage() {
  const scoringRules = await getScoringRules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add Grades & Scoring Rules</h1>
        <p className="mt-1 text-sm text-white/70">
          Configure placement points and grade bonuses. When a student wins a position and gets a grade (e.g., 1st Place = 10 pts + Grade A = 5 pts), the system combines them to calculate their total score.
        </p>
      </div>

      <AddGradesManager
        initialRules={scoringRules}
        saveAction={saveScoringRulesAction}
      />
    </div>
  );
}
