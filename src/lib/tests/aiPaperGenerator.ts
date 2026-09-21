import {
  AITestBlueprint,
  ValidatedTestBlueprint,
  ResolvedSubjectSpec,
  PaperGenerationResult,
  QuestionSelectionDetail,
} from "@/types/aiTestGenerator";
import { Question, QuestionOption, DifficultyLevel } from "@/types/database";
import { validateBlueprintAgainstTaxonomy, DBTaxonomyContext } from "./blueprintValidator";
import { shuffleArray } from "../practice/selectionEngine";

export interface CandidateQuestionRecord extends Question {
  options: QuestionOption[];
  subject_name?: string;
  chapter_name?: string;
  topic_name?: string;
}

/**
 * Hard filters candidate questions based on exam, taxonomy, PYQ, and status rules.
 */
export function filterEligibleCandidates(
  allQuestions: CandidateQuestionRecord[],
  blueprint: AITestBlueprint,
  subjectSpec: ResolvedSubjectSpec,
  excludedQuestionIds: Set<string>
): CandidateQuestionRecord[] {
  return allQuestions.filter((q) => {
    // 1. Hard Rule: Must be active and approved
    if (q.status !== "APPROVED" || !q.is_active) {
      return false;
    }

    // 2. Hard Rule: Must be single-choice MCQ with 4 options and 1 correct key
    if (q.question_type !== "SINGLE_MCQ" || !q.options || q.options.length !== 4) {
      return false;
    }
    const correctCount = q.options.filter((opt) => opt.is_correct).length;
    if (correctCount !== 1) {
      return false;
    }

    // 3. Hard Rule: Must not be in recent test exclusion list
    if (excludedQuestionIds.has(q.id)) {
      return false;
    }

    // 4. Hard Rule: Subject match
    if (q.subject_id !== subjectSpec.subject_id) {
      return false;
    }

    // 5. Hard Rule: Chapter match
    if (subjectSpec.chapter_ids.length > 0 && !subjectSpec.chapter_ids.includes(q.chapter_id)) {
      return false;
    }

    // 6. Hard Rule: Exam type match
    if (blueprint.exam_type !== "GENERIC" && q.exam_type !== blueprint.exam_type) {
      return false;
    }

    // 7. Hard Rule: PYQ constraints
    if (blueprint.source_constraints.pyq_only) {
      if (q.source_type !== "PYQ" || !q.pyq_year) {
        return false;
      }
      if (
        blueprint.source_constraints.year_start &&
        q.pyq_year < blueprint.source_constraints.year_start
      ) {
        return false;
      }
      if (
        blueprint.source_constraints.year_end &&
        q.pyq_year > blueprint.source_constraints.year_end
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Distributes target question count across difficulty buckets according to percentage distribution.
 */
export function calculateDifficultyQuotas(
  targetCount: number,
  dist: { EASY: number; MEDIUM: number; HARD: number; ADVANCED: number }
): Record<DifficultyLevel, number> {
  const totalWeight = (dist.EASY || 0) + (dist.MEDIUM || 0) + (dist.HARD || 0) + (dist.ADVANCED || 0);

  if (totalWeight === 0) {
    // Default fallback: 20% Easy, 50% Medium, 30% Hard
    return calculateDifficultyQuotas(targetCount, { EASY: 20, MEDIUM: 50, HARD: 30, ADVANCED: 0 });
  }

  const levels: DifficultyLevel[] = ["ADVANCED", "HARD", "MEDIUM", "EASY"];
  const quotas: Record<DifficultyLevel, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    ADVANCED: 0,
  };

  let allocated = 0;
  levels.forEach((lvl) => {
    const weight = dist[lvl] || 0;
    const count = Math.floor((weight / totalWeight) * targetCount);
    quotas[lvl] = count;
    allocated += count;
  });

  // Distribute any remainder to highest requested weight
  let remainder = targetCount - allocated;
  const sortedLevels = [...levels].sort((a, b) => (dist[b] || 0) - (dist[a] || 0));

  let idx = 0;
  while (remainder > 0) {
    const lvl = sortedLevels[idx % sortedLevels.length];
    quotas[lvl]++;
    remainder--;
    idx++;
  }

  return quotas;
}

/**
 * Samples questions for a subject meeting difficulty preferences and concept diversity.
 */
export function selectSubjectQuestions(
  candidates: CandidateQuestionRecord[],
  subjectSpec: ResolvedSubjectSpec,
  sectionName: string,
  startOrderIndex: number
): {
  selected: QuestionSelectionDetail[];
  shortage: number;
} {
  const targetCount = subjectSpec.question_count;
  const quotas = calculateDifficultyQuotas(targetCount, subjectSpec.difficulty_distribution);

  const byDifficulty: Record<DifficultyLevel, CandidateQuestionRecord[]> = {
    ADVANCED: shuffleArray(candidates.filter((q) => q.difficulty === "ADVANCED")),
    HARD: shuffleArray(candidates.filter((q) => q.difficulty === "HARD")),
    MEDIUM: shuffleArray(candidates.filter((q) => q.difficulty === "MEDIUM")),
    EASY: shuffleArray(candidates.filter((q) => q.difficulty === "EASY")),
  };

  const selectedQuestions: QuestionSelectionDetail[] = [];
  const selectedIds = new Set<string>();

  // 1. Sample by desired difficulty quotas
  const difficultyOrder: DifficultyLevel[] = ["ADVANCED", "HARD", "MEDIUM", "EASY"];

  difficultyOrder.forEach((lvl) => {
    const quota = quotas[lvl];
    const pool = byDifficulty[lvl];

    let taken = 0;
    for (const q of pool) {
      if (taken >= quota || selectedQuestions.length >= targetCount) break;
      if (!selectedIds.has(q.id)) {
        selectedIds.add(q.id);
        taken++;
        selectedQuestions.push({
          question_id: q.id,
          section_name: sectionName,
          order_index: startOrderIndex + selectedQuestions.length,
          subject_id: q.subject_id,
          subject_name: q.subject_name || subjectSpec.subject_name,
          chapter_id: q.chapter_id,
          chapter_name: q.chapter_name || "Chapter",
          difficulty: q.difficulty,
          source_type: q.source_type,
          pyq_year: q.pyq_year,
          pyq_shift: q.pyq_shift,
          selection_reason: `Matches ${subjectSpec.subject_name} / ${q.chapter_name || "Chapter"} [${q.difficulty}] ${
            q.source_type === "PYQ" ? `(PYQ ${q.pyq_year || ""})` : ""
          }`,
          question: q,
        });
      }
    }
  });

  // 2. If quotas couldn't be met due to uneven difficulty distribution in DB,
  // sample remaining needed count from ANY remaining eligible candidates in this subject
  if (selectedQuestions.length < targetCount) {
    const allRemaining = shuffleArray(candidates.filter((q) => !selectedIds.has(q.id)));
    for (const q of allRemaining) {
      if (selectedQuestions.length >= targetCount) break;
      selectedIds.add(q.id);
      selectedQuestions.push({
        question_id: q.id,
        section_name: sectionName,
        order_index: startOrderIndex + selectedQuestions.length,
        subject_id: q.subject_id,
        subject_name: q.subject_name || subjectSpec.subject_name,
        chapter_id: q.chapter_id,
        chapter_name: q.chapter_name || "Chapter",
        difficulty: q.difficulty,
        source_type: q.source_type,
        pyq_year: q.pyq_year,
        pyq_shift: q.pyq_shift,
        selection_reason: `Fallback candidate for ${subjectSpec.subject_name} [${q.difficulty}]`,
        question: q,
      });
    }
  }

  const shortage = Math.max(0, targetCount - selectedQuestions.length);

  return {
    selected: selectedQuestions,
    shortage,
  };
}

/**
 * Master Pipeline: Generates a test draft from blueprint and candidate question pool.
 */
export function executeAIPaperGeneration(
  rawBlueprint: unknown,
  taxonomy: DBTaxonomyContext,
  allCandidateQuestions: CandidateQuestionRecord[],
  excludedQuestionIds: Set<string> = new Set()
): PaperGenerationResult {
  // 1. Validate Blueprint against Taxonomy
  const validation = validateBlueprintAgainstTaxonomy(rawBlueprint, taxonomy);
  if (!validation.is_valid) {
    return {
      success: false,
      blueprint: rawBlueprint as AITestBlueprint,
      selected_questions: [],
      total_selected: 0,
      is_shortage: false,
      errors: validation.validation_errors,
    };
  }

  const blueprint = validation.blueprint;
  const allSelectedQuestions: QuestionSelectionDetail[] = [];
  const subjectBreakdown: Record<string, { requested: number; available: number }> = {};
  let totalShortage = 0;

  let globalOrder = 1;

  for (const subjectSpec of validation.resolved_subjects) {
    const sectionName = `Section - ${subjectSpec.subject_name}`;
    const subjectCandidates = filterEligibleCandidates(
      allCandidateQuestions,
      blueprint,
      subjectSpec,
      excludedQuestionIds
    );

    subjectBreakdown[subjectSpec.subject_name] = {
      requested: subjectSpec.question_count,
      available: subjectCandidates.length,
    };

    const { selected, shortage } = selectSubjectQuestions(
      subjectCandidates,
      subjectSpec,
      sectionName,
      globalOrder
    );

    allSelectedQuestions.push(...selected);
    totalShortage += shortage;
    globalOrder += selected.length;
  }

  // 2. Shortage Check
  if (totalShortage > 0) {
    return {
      success: false,
      blueprint,
      selected_questions: allSelectedQuestions,
      total_selected: allSelectedQuestions.length,
      is_shortage: true,
      shortage_details: {
        requested: blueprint.total_questions,
        available: allSelectedQuestions.length,
        subject_breakdown: subjectBreakdown,
        message: `Only ${allSelectedQuestions.length} eligible questions satisfy all constraints (requested ${blueprint.total_questions}).`,
        suggested_actions: [
          `Reduce total questions to ${allSelectedQuestions.length}`,
          "Broaden difficulty distribution (include Medium / Hard questions)",
          "Expand chapter selection for subjects with shortages",
          "Widen PYQ year range (e.g. 2018 - 2026)",
          "Allow questions used in recent tests",
        ],
      },
      errors: [
        `Question pool shortage: Found ${allSelectedQuestions.length} qualifying questions out of ${blueprint.total_questions} requested.`,
      ],
    };
  }

  // 3. Strict Non-Hallucination & Eligibility Verification on EVERY Selected Question ID
  const candidateMap = new Map<string, CandidateQuestionRecord>(
    allCandidateQuestions.map((q) => [q.id, q])
  );

  for (const item of allSelectedQuestions) {
    const dbQuestion = candidateMap.get(item.question_id);
    if (!dbQuestion) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: [`Integrity Error: Selected question ${item.question_id} not found in database.`],
      };
    }

    if (dbQuestion.status !== "APPROVED" || !dbQuestion.is_active) {
      return {
        success: false,
        blueprint,
        selected_questions: [],
        total_selected: 0,
        is_shortage: false,
        errors: [`Integrity Error: Selected question ${item.question_id} is not APPROVED or is inactive.`],
      };
    }
  }

  return {
    success: true,
    blueprint,
    selected_questions: allSelectedQuestions,
    total_selected: allSelectedQuestions.length,
    is_shortage: false,
  };
}
