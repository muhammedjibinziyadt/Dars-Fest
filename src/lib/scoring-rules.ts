import { connectDB } from "./db";
import { ProgramModel, SystemMetaModel } from "./models";
import type { GradeType, ProgramScoringConfig, ScoringRules, SectionType } from "./types";

export const DEFAULT_SCORING_RULES: ScoringRules = {
  single: {
    1: 10,
    2: 8,
    3: 6,
  },
  group: {
    1: 20,
    2: 10,
  },
  general: {
    1: 25,
    2: 20,
    3: 15,
  },
  grades: {
    A: 5,
    B: 3,
    C: 1,
    none: 0,
  },
};

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

/**
 * Calculates score for an entry based on position, grade, and custom/global scoring rules.
 */
export function calculateEntryScore(
  section: SectionType,
  position: number,
  grade: GradeType = "none",
  programConfig?: ProgramScoringConfig | null,
  globalRules?: ScoringRules | null
): number {
  const rules = globalRules || cachedGlobalRules || DEFAULT_SCORING_RULES;

  // If program has custom scoring enabled
  if (programConfig?.useCustom) {
    const posScore = programConfig.positionScores?.[position] ?? 0;
    const gradeScore = programConfig.gradeScores?.[grade] ?? 0;
    return Number(posScore) + Number(gradeScore);
  }

  // Otherwise use global section rules + grade rules
  const sectionRules = rules[section] || DEFAULT_SCORING_RULES[section] || {};
  const posScore = sectionRules[position] ?? 0;
  const gradeScore = rules.grades?.[grade] ?? DEFAULT_SCORING_RULES.grades[grade] ?? 0;

  return Number(posScore) + Number(gradeScore);
}
