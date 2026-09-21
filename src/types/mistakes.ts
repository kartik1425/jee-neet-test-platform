import { z } from "zod";
import { DifficultyLevel, ExamType } from "./database";

export type MistakeCategory =
  | "CONCEPTUAL_ERROR"
  | "FORMULA_ERROR"
  | "CALCULATION_ERROR"
  | "MISREAD_QUESTION"
  | "WRONG_ASSUMPTION"
  | "TIME_PRESSURE"
  | "CARELESS_ERROR"
  | "GUESS"
  | "UNABLE_TO_START"
  | "UNKNOWN";

export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  "CONCEPTUAL_ERROR",
  "FORMULA_ERROR",
  "CALCULATION_ERROR",
  "MISREAD_QUESTION",
  "WRONG_ASSUMPTION",
  "TIME_PRESSURE",
  "CARELESS_ERROR",
  "GUESS",
  "UNABLE_TO_START",
  "UNKNOWN",
];

export type ClassificationSource = "RULE" | "AI" | "TEACHER" | "STUDENT";
export type ClassificationConfidence = "HIGH" | "MEDIUM" | "LOW";
export type ClassificationStatus = "SUGGESTED" | "CONFIRMED" | "REJECTED";
export type ResolutionStatus = "OPEN" | "IMPROVING" | "RESOLVED";
export type TrendStatus = "IMPROVING" | "STABLE" | "WORSENING" | "INSUFFICIENT_DATA";

export interface MistakeAuditEntry {
  changed_at: string;
  previous_type: MistakeCategory;
  new_type: MistakeCategory;
  changed_by: string;
  source: ClassificationSource;
  notes?: string | null;
}

export interface MistakeEvidence {
  time_spent_seconds: number;
  allocated_average_seconds?: number;
  selected_option_key?: string | null;
  correct_option_key: string;
  difficulty: DifficultyLevel | string;
  is_marked_for_review: boolean;
  is_unattempted: boolean;
  rule_triggered?: string | null;
  rationale?: string | null;
  audit_history?: MistakeAuditEntry[];
}

export interface PersistentMistakeRecord {
  id: string;
  attempt_answer_id: string;
  student_id: string;
  question_id: string;
  attempt_id: string;
  test_id: string;
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  mistake_type: MistakeCategory;
  classification_source: ClassificationSource;
  classification_confidence: ClassificationConfidence;
  classification_status: ClassificationStatus;
  resolution_status: ResolutionStatus;
  evidence: MistakeEvidence;
  student_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicMistakeMatrixItem {
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_name: string;
  topic_id?: string | null;
  topic_name?: string | null;
  total_mistakes: number;
  category_counts: Record<MistakeCategory, number>;
}

export interface RecurringMistakePattern {
  id: string;
  student_id: string;
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  mistake_type: MistakeCategory;
  total_occurrences: number;
  tests_affected_count: number;
  last_occurred_at: string;
  trend: TrendStatus;
  resolution_status: ResolutionStatus;
  is_recurring: boolean;
}

export interface AggregationOptions {
  recurringThreshold?: number;
  improvingAccuracyThreshold?: number;
  resolvedAccuracyThreshold?: number;
}

export interface StudentMistakeSummary {
  student_id: string;
  total_mistakes: number;
  suggested_count: number;
  confirmed_count: number;
  recurring_patterns_count: number;
  improving_patterns_count: number;
  resolved_patterns_count: number;
  category_distribution: Record<MistakeCategory, number>;
  matrix: TopicMistakeMatrixItem[];
  recurring_patterns: RecurringMistakePattern[];
}

// AI Classification Zod Schemas
export const AIMistakeClassificationOutputSchema = z.object({
  mistake_type: z.enum([
    "CONCEPTUAL_ERROR",
    "FORMULA_ERROR",
    "CALCULATION_ERROR",
    "MISREAD_QUESTION",
    "WRONG_ASSUMPTION",
    "TIME_PRESSURE",
    "CARELESS_ERROR",
    "GUESS",
    "UNABLE_TO_START",
    "UNKNOWN",
  ]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  pedagogical_rationale: z.string().min(5),
});

export type AIMistakeClassificationOutput = z.infer<typeof AIMistakeClassificationOutputSchema>;

export interface AIMistakeClassificationInput {
  question_id: string;
  question_latex: string;
  options: Array<{ option_key: string; content_latex: string; is_correct: boolean }>;
  selected_option_key?: string | null;
  correct_option_key: string;
  time_spent_seconds: number;
  difficulty: string;
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  is_marked_for_review: boolean;
  deterministic_hint?: string | null;
}
