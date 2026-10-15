import { revalidatePath } from "next/cache";
import { ScoringRulesManager } from "@/components/scoring-rules-manager";
import {
  getGlobalScoringRules,
  getPrograms,
  saveGlobalScoringRules,
  saveProgramScoringConfig,
  resetProgramScoringConfig,
} from "@/lib/data";
import type { ProgramScoringConfig, ScoringRules } from "@/lib/types";

export const metadata = {
  title: "Scoring Rules & Grade Points · Admin Deck",
  description: "Configure global festival scoring rules and program-specific score & grade overrides.",
};

export default async function ScoringRulesPage() {
  const [initialRules, programs] = await Promise.all([
    getGlobalScoringRules(),
    getPrograms(),
  ]);

  async function saveGlobalRulesAction(rules: ScoringRules) {
    "use server";
    try {
      await saveGlobalScoringRules(rules);
      revalidatePath("/admin/scoring-rules");
      revalidatePath("/admin/add-result");
      revalidatePath("/scoreboard");
      revalidatePath("/results");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update global scoring rules." };
    }
  }

  async function saveProgramConfigAction(programId: string, config: ProgramScoringConfig) {
    "use server";
    try {
      await saveProgramScoringConfig(programId, config);
      revalidatePath("/admin/scoring-rules");
      revalidatePath("/admin/add-result");
      revalidatePath("/admin/programs");
      revalidatePath("/scoreboard");
      revalidatePath("/results");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to save program scoring rules." };
    }
  }

  async function resetProgramConfigAction(programId: string) {
    "use server";
    try {
      await resetProgramConfigAction(programId);
      revalidatePath("/admin/scoring-rules");
      revalidatePath("/admin/add-result");
      revalidatePath("/admin/programs");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to reset program scoring rules." };
    }
  }

  return (
    <ScoringRulesManager
      initialRules={initialRules}
      programs={programs}
      saveGlobalRulesAction={saveGlobalRulesAction}
      saveProgramConfigAction={saveProgramConfigAction}
      resetProgramConfigAction={resetProgramConfigAction}
    />
  );
}
