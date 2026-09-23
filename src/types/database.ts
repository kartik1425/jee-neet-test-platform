import { z } from "zod";
import { UserRole } from "./auth";

// Enums
export type ExamType = "JEE_MAIN" | "JEE_ADV" | "NEET" | "GENERIC";
export type QuestionType = "SINGLE_MCQ";
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
export type QuestionSourceType = "PYQ" | "INSTITUTE" | "AI_GENERATED" | "SEED_DEMO";
export type QuestionStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type TestMode = "SCHEDULED" | "PRACTICE_SELF" | "MOCK";
export type TestStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "LIVE" | "COMPLETED" | "ARCHIVED";
export type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED" | "CANCELLED";
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
export type NotificationType = "TEST_ASSIGNED" | "TEST_LIVE" | "RESULT_PUBLISHED" | "SYSTEM";

// Taxonomy
export interface Subject {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

// Question Bank (V1 MCQ Only)
export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: "A" | "B" | "C" | "D";
  content_latex: string;
  is_correct: boolean;
  order_index: number;
  created_at?: string;
}

export interface Question {
  id: string;
  subject_id: string;
  chapter_id: string;
  topic_id?: string | null;
  exam_type: ExamType;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  content_latex: string;
  explanation_latex?: string | null;
  source_type: QuestionSourceType;
  pyq_year?: number | null;
  pyq_shift?: string | null;
  source_reference?: string | null;
  status: QuestionStatus;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

// Tests & Snapshotting
export interface MarkingSchemeConfig {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface TestQuestionSnapshot {
  content_latex: string;
  explanation_latex?: string | null;
  options: {
    id: string;
    option_key: "A" | "B" | "C" | "D";
    content_latex: string;
    is_correct: boolean;
  }[];
}

export interface Test {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  exam_type: ExamType;
  test_mode: TestMode;
  duration_minutes: number;
  total_marks: number;
  marking_scheme: MarkingSchemeConfig;
  status: TestStatus;
  start_time?: string | null;
  end_time?: string | null;
  created_by?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_id: string;
  section_id?: string | null;
  order_index: number;
  marks: number;
  negative_marks: number;
  snapshot_data?: TestQuestionSnapshot | null;
  created_at: string;
}

export interface TestAssignment {
  id: string;
  test_id: string;
  class_id?: string | null;
  student_id?: string | null;
  assigned_by?: string | null;
  assigned_at: string;
  due_at?: string | null;
}

// Attempts & Engine
export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at?: string | null;
  server_end_time: string;
  time_spent_seconds: number;
  total_score?: number | null;
  accuracy_percentage?: number | null;
  calculated_stats?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string | null;
  is_marked_for_review: boolean;
  is_visited: boolean;
  time_spent_seconds: number;
  is_correct?: boolean | null;
  marks_awarded?: number | null;
  last_saved_at: string;
}

// Analytics & Mistakes
export interface Mistake {
  id: string;
  attempt_answer_id: string;
  student_id: string;
  question_id: string;
  attempt_id?: string | null;
  test_id?: string | null;
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  mistake_type: MistakeCategory;
  classification_source?: "RULE" | "AI" | "TEACHER" | "STUDENT";
  classification_confidence?: "HIGH" | "MEDIUM" | "LOW";
  classification_status?: "SUGGESTED" | "CONFIRMED" | "REJECTED";
  resolution_status?: "OPEN" | "IMPROVING" | "RESOLVED";
  evidence?: Record<string, any>;
  ai_confidence?: number | null;
  ai_rationale?: string | null;
  student_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface StudentQuestionHistory {
  id: string;
  student_id: string;
  question_id: string;
  times_attempted: number;
  times_correct: number;
  times_incorrect: number;
  first_attempted_at: string;
  last_attempted_at: string;
  last_result: "CORRECT" | "INCORRECT" | "UNATTEMPTED";
  created_at: string;
  updated_at: string;
}

export interface StudentTopicStat {
  id: string;
  student_id: string;
  topic_id: string;
  total_attempted: number;
  total_correct: number;
  total_incorrect: number;
  accuracy_percentage: number;
  last_attempted_at: string;
}

// Zod Validation Schemas
export const QuestionCreateSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  chapterId: z.string().uuid("Invalid chapter ID"),
  topicId: z.string().uuid("Invalid topic ID").optional().nullable(),
  examType: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]).default("JEE_MAIN"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]).default("MEDIUM"),
  contentLatex: z.string().min(5, "Question LaTeX content is required"),
  explanationLatex: z.string().optional().nullable(),
  sourceType: z.enum(["PYQ", "INSTITUTE", "AI_GENERATED", "SEED_DEMO"]).default("INSTITUTE"),
  pyqYear: z.number().int().min(1980).max(2030).optional().nullable(),
  pyqShift: z.string().max(50).optional().nullable(),
  sourceReference: z.string().max(200).optional().nullable(),
  options: z
    .array(
      z.object({
        optionKey: z.enum(["A", "B", "C", "D"]),
        contentLatex: z.string().min(1, "Option content is required"),
        isCorrect: z.boolean().default(false),
      })
    )
    .length(4, "Exactly 4 options (A, B, C, D) are required for V1 MCQ questions")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked as correct for Single MCQ",
    }),
});

export const TestCreateSchema = z.object({
  title: z.string().min(3, "Test title must be at least 3 characters").max(150),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(2000).optional().nullable(),
  examType: z.enum(["JEE_MAIN", "JEE_ADV", "NEET"]).default("JEE_MAIN"),
  testMode: z.enum(["SCHEDULED", "PRACTICE_SELF", "MOCK"]).default("SCHEDULED"),
  durationMinutes: z.number().int().min(5).max(360),
  totalMarks: z.number().int().min(1),
  markingScheme: z.object({
    correct: z.number().default(4),
    incorrect: z.number().default(-1),
    unattempted: z.number().default(0),
  }),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
});
