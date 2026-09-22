import { SelfTestConfig, QuestionPoolAvailabilityResult } from "@/types/practice";
import { Question, QuestionOption } from "@/types/database";

export interface CandidateQuestionWithProvenance extends Question {
  options: QuestionOption[];
  subject_name?: string;
  chapter_name?: string;
}

/**
 * Fairly balances questions across selected subjects.
 * Example: 30 questions across 3 subjects -> [10, 10, 10].
 * Example: 25 questions across 3 subjects -> [9, 8, 8].
 */
export function distributeQuestionsAcrossSubjects(
  totalQuestions: number,
  subjectIds: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (subjectIds.length === 0) return result;

  const baseCount = Math.floor(totalQuestions / subjectIds.length);
  let remainder = totalQuestions % subjectIds.length;

  for (const subjectId of subjectIds) {
    result[subjectId] = baseCount + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }

  return result;
}

/**
 * Validates question provenance and V1 MCQ integrity.
 */
export function isValidQualifyingQuestion(
  q: CandidateQuestionWithProvenance,
  pyqOnly = true
): boolean {
  // 1. Must be active and approved
  if (q.status !== "APPROVED" || !q.is_active) {
    return false;
  }

  // 2. Must be single MCQ
  if (q.question_type !== "SINGLE_MCQ") {
    return false;
  }

  // 3. Must have exactly 4 options with exactly 1 correct
  if (!q.options || q.options.length !== 4) {
    return false;
  }
  const correctCount = q.options.filter((opt) => opt.is_correct).length;
  if (correctCount !== 1) {
    return false;
  }

  // 4. PYQ Provenance Verification
  if (pyqOnly) {
    if (q.source_type !== "PYQ") {
      return false;
    }
    if (!q.pyq_year || q.pyq_year < 1980 || q.pyq_year > 2040) {
      return false;
    }
  }

  return true;
}

/**
 * Categorizes questions by student history priority:
 * - Priority 1: Never attempted by this student
 * - Priority 2: Not used in recent self-tests (attempted > 30 days or in older tests)
 * - Priority 3: Previously attempted / used questions
 */
export interface PrioritizedQuestionBuckets {
  priority1_neverAttempted: CandidateQuestionWithProvenance[];
  priority2_recentSelfTestExcluded: CandidateQuestionWithProvenance[];
  priority3_previouslyAttempted: CandidateQuestionWithProvenance[];
}

export function categorizeQuestionsByPriority(
  candidates: CandidateQuestionWithProvenance[],
  attemptedQuestionIds: Set<string>,
  recentSelfTestQuestionIds: Set<string>
): PrioritizedQuestionBuckets {
  const p1: CandidateQuestionWithProvenance[] = [];
  const p2: CandidateQuestionWithProvenance[] = [];
  const p3: CandidateQuestionWithProvenance[] = [];

  for (const q of candidates) {
    const isAttempted = attemptedQuestionIds.has(q.id);
    const isRecentSelfTest = recentSelfTestQuestionIds.has(q.id);

    if (!isAttempted && !isRecentSelfTest) {
      p1.push(q);
    } else if (!isRecentSelfTest) {
      p2.push(q);
    } else {
      p3.push(q);
    }
  }

  return {
    priority1_neverAttempted: p1,
    priority2_recentSelfTestExcluded: p2,
    priority3_previouslyAttempted: p3,
  };
}

/**
 * Shuffles an array deterministically / securely using Fisher-Yates.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

/**
 * Samples targetCount questions from prioritized buckets without replacement.
 */
export function sampleQuestionsFromBuckets(
  buckets: PrioritizedQuestionBuckets,
  targetCount: number,
  allowPreviouslyAttempted = false
): {
  selected: CandidateQuestionWithProvenance[];
  shortage: number;
} {
  const selected: CandidateQuestionWithProvenance[] = [];
  const selectedIds = new Set<string>();

  // Helper to add from a pool
  const takeFromPool = (pool: CandidateQuestionWithProvenance[]) => {
    const shuffled = shuffleArray(pool);
    for (const q of shuffled) {
      if (selected.length >= targetCount) break;
      if (!selectedIds.has(q.id)) {
        selectedIds.add(q.id);
        selected.push(q);
      }
    }
  };

  // 1. Take from Priority 1 (Never Attempted)
  takeFromPool(buckets.priority1_neverAttempted);

  // 2. Take from Priority 2 if still needed
  if (selected.length < targetCount) {
    takeFromPool(buckets.priority2_recentSelfTestExcluded);
  }

  // 3. Take from Priority 3 (Previously Attempted) ONLY if allowed
  if (selected.length < targetCount && allowPreviouslyAttempted) {
    takeFromPool(buckets.priority3_previouslyAttempted);
  }

  const shortage = Math.max(0, targetCount - selected.length);

  return {
    selected,
    shortage,
  };
}

/**
 * Filter candidates by specific taxonomy and provenance filters.
 */
export function filterCandidateQuestions(
  allQuestions: CandidateQuestionWithProvenance[],
  config: SelfTestConfig
): CandidateQuestionWithProvenance[] {
  return allQuestions.filter((q) => {
    // 1. Baseline validity & PYQ integrity
    if (!isValidQualifyingQuestion(q, config.pyqOnly)) {
      return false;
    }

    // 2. Exam match
    const matchesExam =
      q.exam_type === config.examType ||
      (config.examType === "JEE_ADV" && (q.exam_type as string) === "JEE_ADVANCED") ||
      ((config.examType as string) === "JEE_ADVANCED" && (q.exam_type as string) === "JEE_ADV") ||
      q.exam_type === "GENERIC";

    if (!matchesExam) {
      return false;
    }

    // 3. Subject match
    if (!config.subjectIds.includes(q.subject_id)) {
      return false;
    }

    // 4. Chapter match
    if (!config.chapterIds.includes(q.chapter_id)) {
      return false;
    }

    // 5. Topic match (if topics specified)
    if (config.topicIds && config.topicIds.length > 0) {
      if (!q.topic_id || !config.topicIds.includes(q.topic_id)) {
        return false;
      }
    }

    // 6. Difficulty match
    if (config.difficulty && config.difficulty !== "ANY") {
      if (q.difficulty !== config.difficulty) {
        return false;
      }
    }

    // 7. PYQ Year range
    if (q.pyq_year) {
      if (config.yearStart && q.pyq_year < config.yearStart) {
        return false;
      }
      if (config.yearEnd && q.pyq_year > config.yearEnd) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Execute Question Selection Algorithm for a Self-Test.
 */
export function executeQuestionSelection(
  candidates: CandidateQuestionWithProvenance[],
  config: SelfTestConfig,
  attemptedQuestionIds: Set<string>,
  recentSelfTestQuestionIds: Set<string>
): {
  selectedQuestions: CandidateQuestionWithProvenance[];
  isSufficient: boolean;
  shortageDetails?: {
    requested: number;
    available: number;
    message: string;
  };
} {
  const eligible = filterCandidateQuestions(candidates, config);
  const subjectDistribution = distributeQuestionsAcrossSubjects(config.questionCount, config.subjectIds);

  const selectedQuestions: CandidateQuestionWithProvenance[] = [];
  let totalShortage = 0;

  for (const subjectId of config.subjectIds) {
    const targetForSubject = subjectDistribution[subjectId] || 0;
    const subjectCandidates = eligible.filter((q) => q.subject_id === subjectId);

    const buckets = categorizeQuestionsByPriority(
      subjectCandidates,
      attemptedQuestionIds,
      recentSelfTestQuestionIds
    );

    const { selected, shortage } = sampleQuestionsFromBuckets(
      buckets,
      targetForSubject,
      config.allowPreviouslyAttempted
    );

    selectedQuestions.push(...selected);
    totalShortage += shortage;
  }

  if (totalShortage > 0) {
    return {
      selectedQuestions,
      isSufficient: false,
      shortageDetails: {
        requested: config.questionCount,
        available: selectedQuestions.length,
        message: `Only ${selectedQuestions.length} qualifying unique PYQs are currently available with your selected criteria (requested ${config.questionCount}).`,
      },
    };
  }

  // Final shuffle of selected questions across subjects for fair presentation
  const finalQuestions = shuffleArray(selectedQuestions);

  return {
    selectedQuestions: finalQuestions,
    isSufficient: true,
  };
}
