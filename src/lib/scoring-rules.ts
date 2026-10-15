import { connectDB } from "./db";
import { ProgramModel, SystemMetaModel } from "./models";
import type { GradeType, ProgramScoringConfig, ScoringRules, SectionType } from "./types";
import { DEFAULT_SCORING_RULES, calculateEntryScore } from "./scoring-constants";

export { DEFAULT_SCORING_RULES, calculateEntryScore };

// In-memory cache for fast repeated reads
let cachedGlobalRules: ScoringRules | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10_000; // 10 seconds

export async function getGlobalScoringRules(): Promise<ScoringRules> {
  const now = Date.now();
  if (cachedGlobalRules && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedGlobalRules;
  }

  try {
    await connectDB();
    const doc = await SystemMetaModel.findOne({ key: "global_scoring_rules" }).lean();
    if (doc && (doc as any).data) {
      const data = (doc as any).data;
      const merged: ScoringRules = {
        single: { ...DEFAULT_SCORING_RULES.single, ...(data.single || {}) },
        group: { ...DEFAULT_SCORING_RULES.group, ...(data.group || {}) },
        general: { ...DEFAULT_SCORING_RULES.general, ...(data.general || {}) },
        grades: { ...DEFAULT_SCORING_RULES.grades, ...(data.grades || {}) },
      };
      cachedGlobalRules = merged;
      lastCacheTime = now;
      return merged;
    }
  } catch (err) {
    console.error("Error fetching global scoring rules from DB, using defaults:", err);
  }

  cachedGlobalRules = DEFAULT_SCORING_RULES;
  lastCacheTime = now;
  return DEFAULT_SCORING_RULES;
}

export async function saveGlobalScoringRules(rules: ScoringRules): Promise<void> {
  await connectDB();
  await SystemMetaModel.updateOne(
    { key: "global_scoring_rules" },
    {
      $set: {
        key: "global_scoring_rules",
        data: rules,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  cachedGlobalRules = rules;
  lastCacheTime = Date.now();
}

export async function saveProgramScoringConfig(
  programId: string,
  config: ProgramScoringConfig
): Promise<void> {
  await connectDB();
  await ProgramModel.updateOne(
    { id: programId },
    {
      $set: {
        scoringConfig: config,
      },
    }
  );
}

export async function resetProgramScoringConfig(programId: string): Promise<void> {
  await connectDB();
  await ProgramModel.updateOne(
    { id: programId },
    {
      $unset: {
        scoringConfig: 1,
      },
    }
  );
}
