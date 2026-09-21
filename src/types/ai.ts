import { z } from "zod";
import { ExamType, DifficultyLevel, QuestionSourceType } from "./database";

/**
 * Strict Zod Schema for Structured AI Question Extraction.
 * Untrusted LLM output must strictly parse against this schema.
 */
export const AIExtractedOptionSchema = z.object({
  option_key: z.enum(["A", "B", "C", "D"]),
  content_latex: z.string().min(1, "Option content cannot be empty"),
  is_correct: z.boolean().default(false),
});

export const AIExtractedQuestionSchema = z.object({
  question_latex: z.string().min(3, "Question text must be at least 3 characters"),
  options: z.array(AIExtractedOptionSchema).length(4, "Must contain exactly 4 options (A, B, C, D)"),
  correct_option_key: z.enum(["A", "B", "C", "D"]),
  explanation_latex: z.string().optional().nullable(),
  exam_type: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]).default("JEE_MAIN"),
  suggested_subject_name: z.string().min(1),
  suggested_chapter_name: z.string().min(1),
  suggested_topic_name: z.string().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]).default("MEDIUM"),
  source_type: z.enum(["PYQ", "INSTITUTE", "AI_GENERATED"]).default("INSTITUTE"),
  pyq_year: z.number().int().min(1990).max(2030).optional().nullable(),
  pyq_shift: z.string().optional().nullable(),
  concept_tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.9),
  source_page_number: z.number().int().optional().nullable(),
  source_location_ref: z.string().optional().nullable(),
});

export type AIExtractedQuestion = z.infer<typeof AIExtractedQuestionSchema>;

export const AITaxonomySuggestionSchema = z.object({
  subject_name: z.string(),
  chapter_name: z.string(),
  topic_name: z.string().optional().nullable(),
  confidence: z.number(),
});

export type AITaxonomySuggestion = z.infer<typeof AITaxonomySuggestionSchema>;

export const AIDuplicateCheckSchema = z.object({
  is_duplicate: z.boolean(),
  similarity_score: z.number().min(0).max(1),
  matched_question_id: z.string().optional().nullable(),
  reason: z.string().optional(),
});

export type AIDuplicateCheckResult = z.infer<typeof AIDuplicateCheckSchema>;
