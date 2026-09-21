import { z } from "zod";
import { ExamType, DifficultyLevel } from "./database";

export type EvidenceStatus = "STRONG" | "NEEDS_ATTENTION" | "INSUFFICIENT_DATA";
export type AIInferenceConfidence = "HIGH" | "MEDIUM" | "LOW";
export type MistakeCategory = "CONCEPTUAL" | "CALCULATION" | "MISREAD" | "TIME_PRESSURE" | "UNKNOWN";

// Deterministic Subject Metric
export interface SubjectMetric {
  subject_id: string;
  subject_name: string;
  score: number;
  max_score: number;
  accuracy: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  time_spent_seconds: number;
}

// Deterministic Chapter Metric with Evidence Classification
export interface ChapterMetric {
  chapter_id: string;
  chapter_name: string;
  subject_name: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  avg_time_seconds: number;
  evidence_status: EvidenceStatus;
}

// Deterministic Topic Metric with Evidence Classification
export interface TopicMetric {
  topic_id: string;
  topic_name: string;
  chapter_name: string;
  total_questions: number;
  attempted: number;
  correct: number;
  accuracy: number;
  evidence_status: EvidenceStatus;
}

// Deterministic Time Strategy Metrics
export interface TimeStrategyMetrics {
  total_time_seconds: number;
  allocated_time_seconds: number;
  avg_time_per_question_seconds: number;
  avg_time_correct_seconds: number;
  avg_time_incorrect_seconds: number;
  avg_time_unattempted_seconds: number;
  longest_question_id?: string | null;
  longest_question_seconds: number;
  late_exam_accuracy?: number | null; // Accuracy in final 20% of attempt duration
  early_exam_accuracy?: number | null;
}

// Deterministic Incorrect Question Evidence
export interface IncorrectQuestionEvidence {
  question_id: string;
  subject_name: string;
  chapter_name: string;
  topic_name?: string | null;
  difficulty: DifficultyLevel;
  selected_option_key?: string | null;
  correct_option_key: string;
  marks_awarded: number;
  time_spent_seconds: number;
  marked_for_review: boolean;
}

// Complete Deterministic Analytics Payload sent to AI
export interface DeterministicAnalyticsPayload {
  attempt_id: string;
  test_id: string;
  test_title: string;
  exam_type: ExamType;
  total_score: number;
  max_score: number;
  accuracy_percentage: number;
  total_attempted: number;
  total_correct: number;
  total_incorrect: number;
  total_unattempted: number;
  duration_minutes: number;
  time_spent_seconds: number;
  subject_metrics: SubjectMetric[];
  chapter_metrics: ChapterMetric[];
  topic_metrics: TopicMetric[];
  time_metrics: TimeStrategyMetrics;
  incorrect_questions: IncorrectQuestionEvidence[];
}

// ============================================================================
// ZOD SCHEMAS FOR STRUCTURED AI DIAGNOSTIC REPORT
// ============================================================================

export const AIExecutiveSummarySchema = z.object({
  strengths_summary: z.string().min(5),
  weaknesses_summary: z.string().min(5),
  overall_interpretation: z.string().min(10),
});

export const AISubjectCommentarySchema = z.object({
  subject_name: z.string(),
  commentary: z.string().min(5),
  relative_standing: z.string(),
});

export const AIChapterAnalysisSchema = z.object({
  chapter_name: z.string(),
  status: z.enum(["STRONG", "NEEDS_ATTENTION", "INSUFFICIENT_DATA"]),
  diagnostic_rationale: z.string().min(5),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const AIMistakeDiagnosisSchema = z.object({
  question_id: z.string(),
  likely_category: z.enum(["CONCEPTUAL", "CALCULATION", "MISREAD", "TIME_PRESSURE", "UNKNOWN"]),
  observation: z.string().min(5),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const AITimeStrategySchema = z.object({
  pacing_commentary: z.string().min(5),
  time_management_efficiency: z.string().min(5),
  stamina_insight: z.string().optional().nullable(),
});

export const AIActionPlanItemSchema = z.object({
  priority: z.number().int().min(1).max(10),
  topic_name: z.string(),
  reason: z.string().min(5),
  recommended_action: z.string().min(5),
  target_practice_questions: z.number().int().min(5).max(50),
});

export const AIDiagnosticReportSchema = z.object({
  report_version: z.string().default("v1.0.0"),
  summary: AIExecutiveSummarySchema,
  subject_analysis: z.array(AISubjectCommentarySchema),
  chapter_analysis: z.array(AIChapterAnalysisSchema),
  mistake_analysis: z.array(AIMistakeDiagnosisSchema),
  time_strategy: AITimeStrategySchema,
  action_plan: z.array(AIActionPlanItemSchema),
});

export type AIDiagnosticReport = z.infer<typeof AIDiagnosticReportSchema>;

// Full Stored Report Bundle (Deterministic facts + AI interpretations)
export interface FullDiagnosticReportBundle {
  attempt_id: string;
  test_id: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  deterministic_payload: DeterministicAnalyticsPayload;
  ai_report: AIDiagnosticReport | null;
  error_message?: string | null;
  generated_at?: string | null;
}
