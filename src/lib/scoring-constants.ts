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
  const rules = globalRules || DEFAULT_SCORING_RULES;

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
