import { z } from "zod";
import { ExamType, DifficultyLevel, Question, QuestionOption } from "./database";
import { TestDetail } from "./tests";

// Zod Schema for Structured AI Blueprint Generation
export const AITestSubjectSpecSchema = z.object({
  subject_name: z.string().min(1, "Subject name is required"),
  question_count: z.number().int().min(1, "At least 1 question per subject"),
  chapter_names: z.array(z.string()).min(1, "At least one chapter required"),
  topic_names: z.array(z.string()).default([]),
  difficulty_distribution: z
    .object({
      EASY: z.number().min(0).max(100).default(0),
      MEDIUM: z.number().min(0).max(100).default(0),
      HARD: z.number().min(0).max(100).default(0),
      ADVANCED: z.number().min(0).max(100).default(0),
    })
    .default({ EASY: 20, MEDIUM: 50, HARD: 30, ADVANCED: 0 }),
});

export const AITestBlueprintSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(3000).optional().nullable(),
  exam_type: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]).default("JEE_MAIN"),
  duration_minutes: z.number().int().min(5).max(360).default(180),
  total_questions: z.number().int().min(1).max(200),
  marking_scheme: z
    .object({
      correct: z.number().default(4),
      incorrect: z.number().default(-1),
      unattempted: z.number().default(0),
    })
    .default({ correct: 4, incorrect: -1, unattempted: 0 }),
  subjects: z.array(AITestSubjectSpecSchema).min(1, "At least one subject spec required"),
  source_constraints: z
    .object({
      pyq_only: z.boolean().default(false),
      year_start: z.number().int().min(1990).max(2030).optional().nullable(),
      year_end: z.number().int().min(1990).max(2030).optional().nullable(),
      exclude_recent_test_count: z.number().int().min(0).max(10).default(2),
    })
    .default({ pyq_only: false, exclude_recent_test_count: 2 }),
  pedagogical_focus: z
    .array(z.string())
    .default(["conceptual", "standard"]),
});

export type AITestSubjectSpec = z.infer<typeof AITestSubjectSpecSchema>;
export type AITestBlueprint = z.infer<typeof AITestBlueprintSchema>;

export interface ResolvedSubjectSpec {
  subject_id: string;
  subject_name: string;
  question_count: number;
  chapter_ids: string[];
  chapter_names: string[];
  topic_ids: string[];
  topic_names: string[];
  difficulty_distribution: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
    ADVANCED: number;
  };
}

export interface ValidatedTestBlueprint {
  blueprint: AITestBlueprint;
  resolved_subjects: ResolvedSubjectSpec[];
  total_questions: number;
  unrecognized_subjects: string[];
  unrecognized_chapters: string[];
  is_valid: boolean;
  validation_errors: string[];
}

export interface QuestionSelectionDetail {
  question_id: string;
  section_name: string;
  order_index: number;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_name: string;
  difficulty: DifficultyLevel;
  source_type: string;
  pyq_year?: number | null;
  pyq_shift?: string | null;
  selection_reason: string;
  question: Question & { options: QuestionOption[] };
}

export interface PaperGenerationResult {
  success: boolean;
  test_id?: string;
  draft_test?: TestDetail;
  blueprint: AITestBlueprint;
  selected_questions: QuestionSelectionDetail[];
  total_selected: number;
  is_shortage: boolean;
  shortage_details?: {
    requested: number;
    available: number;
    subject_breakdown: Record<string, { requested: number; available: number }>;
    message: string;
    suggested_actions: string[];
  };
  errors?: string[];
}
