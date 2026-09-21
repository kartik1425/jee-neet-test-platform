import {
  MistakeCategory,
  ClassificationSource,
  ClassificationConfidence,
  ClassificationStatus,
} from "@/types/mistakes";

export interface RuleClassificationInput {
  selected_option_id: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  is_marked_for_review: boolean;
  is_visited: boolean;
  difficulty?: string;
  question_order_index?: number;
  total_questions?: number;
}

export interface RuleClassificationResult {
  mistake_type: MistakeCategory;
  confidence: ClassificationConfidence;
  source: ClassificationSource;
  status: ClassificationStatus;
  rule_triggered: string;
  rationale: string;
}

/**
 * Deterministic rule-based mistake classifier.
 * Never asserts unverified cognitive states as absolute certainty.
 */
export function classifyMistakeDeterministically(
  input: RuleClassificationInput
): RuleClassificationResult {
  const {
    selected_option_id,
    is_correct,
    time_spent_seconds,
    is_marked_for_review,
    is_visited,
    difficulty,
  } = input;

  // 1. Unattempted after significant deliberation
  if (selected_option_id === null) {
    if (is_visited && time_spent_seconds >= 45) {
      return {
        mistake_type: "UNABLE_TO_START",
        confidence: "HIGH",
        source: "RULE",
        status: "SUGGESTED",
        rule_triggered: "RULE_UNATTEMPTED_AFTER_DELIBERATION",
        rationale: `Question was visited and spent ${time_spent_seconds}s but left unattempted without selecting an option.`,
      };
    }
    return {
      mistake_type: "UNABLE_TO_START",
      confidence: "LOW",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_UNATTEMPTED_SKIPPED",
      rationale: "Question was skipped or unattempted.",
    };
  }

  // 2. Guess detection (sub-10s attempt on hard/advanced question)
  if (
    is_correct === false &&
    time_spent_seconds > 0 &&
    time_spent_seconds < 10 &&
    (difficulty === "HARD" || difficulty === "ADVANCED")
  ) {
    return {
      mistake_type: "GUESS",
      confidence: "MEDIUM",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_SUB_10S_HARD_GUESS",
      rationale: `Sub-10 second response (${time_spent_seconds}s) on ${difficulty} question strongly indicates an arbitrary guess or quick gamble.`,
    };
  }

  // 3. Time pressure candidate (rapid incorrect answer <= 20s)
  if (is_correct === false && time_spent_seconds > 0 && time_spent_seconds <= 20) {
    return {
      mistake_type: "TIME_PRESSURE",
      confidence: "MEDIUM",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_RAPID_INCORRECT_PACING",
      rationale: `Rapid incorrect response (${time_spent_seconds}s) indicates potential time pressure or hurried submission.`,
    };
  }

  // 4. Calculation error candidate (extended deliberation > 180s on incorrect attempt)
  if (is_correct === false && time_spent_seconds >= 180) {
    return {
      mistake_type: "CALCULATION_ERROR",
      confidence: "MEDIUM",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_EXTENDED_DELIBERATION_CALCULATION",
      rationale: `Spent ${time_spent_seconds}s on problem before selecting an incorrect distractor, indicating possible late-stage algebraic or arithmetic calculation error.`,
    };
  }

  // 5. Misread question candidate (short duration 21-40s)
  if (is_correct === false && time_spent_seconds > 20 && time_spent_seconds <= 40) {
    return {
      mistake_type: "MISREAD_QUESTION",
      confidence: "LOW",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_SHORT_SOLVE_MISREAD",
      rationale: `Short solve time (${time_spent_seconds}s) suggests a possible misread of problem conditions or sign/unit specifications.`,
    };
  }

  // 6. Careless error candidate (marked for review + intermediate time)
  if (is_correct === false && is_marked_for_review && time_spent_seconds >= 60) {
    return {
      mistake_type: "CARELESS_ERROR",
      confidence: "LOW",
      source: "RULE",
      status: "SUGGESTED",
      rule_triggered: "RULE_MARKED_FOR_REVIEW_SLIP",
      rationale: "Question was marked for review with substantial deliberation, suggesting hesitation or an uncorrected slip.",
    };
  }

  // 7. Fallback for AI or human review
  return {
    mistake_type: "UNKNOWN",
    confidence: "LOW",
    source: "RULE",
    status: "SUGGESTED",
    rule_triggered: "RULE_FALLBACK_AMBIGUOUS",
    rationale: "Interaction evidence is ambiguous; requires pedagogical AI evaluation or teacher review.",
  };
}
