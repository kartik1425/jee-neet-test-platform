import { z } from "zod";
import { ExamType, DifficultyLevel, QuestionSourceType, QuestionOption } from "./database";

export type IngestionRightsDeclaration =
  | "OWN_CONTENT"
  | "LICENSED"
  | "SCHOOL_PROVIDED"
  | "AUTHORIZED_THIRD_PARTY"
  | "UNKNOWN";

export type IngestionBatchStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "COMPLETED";

export type IngestionItemStatus =
  | "EXTRACTED"
  | "NORMALIZED"
  | "VALIDATED"
  | "DUPLICATE"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "IMPORTED";

export type AnswerStatus = "VERIFIED" | "UNVERIFIED" | "CONFLICTING" | "MISSING";
export type PyqProvenanceStatus = "VERIFIED" | "UNVERIFIED" | "USER_DECLARED" | "UNKNOWN";
export type DuplicateStatus = "NEW" | "POSSIBLE_DUPLICATE" | "DUPLICATE";

export interface StagingOptionItem {
  id?: string;
  option_key: "A" | "B" | "C" | "D";
  content_latex: string;
  is_correct: boolean;
}

export interface IngestionBatch {
  id: string;
  title: string;
  created_by?: string | null;
  rights_declaration: IngestionRightsDeclaration;
  status: IngestionBatchStatus;
  source_filename: string;
  file_type: "PDF" | "DOCX" | "CSV" | "IMAGE" | "TEXT";
  file_size_bytes: number;
  content_hash?: string | null;
  storage_path?: string | null;
  total_items_count: number;
  valid_items_count: number;
  needs_review_count: number;
  duplicate_items_count: number;
  failed_items_count: number;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface IngestionItem {
  id: string;
  batch_id: string;
  order_index: number;
  raw_content: string;
  source_page_number?: number | null;
  source_location_ref?: string | null;
  extracted_latex: string;
  options: StagingOptionItem[];
  correct_option_key?: "A" | "B" | "C" | "D" | null;
  answer_status: AnswerStatus;
  explanation_latex?: string | null;
  exam_type: ExamType;
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  suggested_subject_name?: string | null;
  suggested_chapter_name?: string | null;
  suggested_topic_name?: string | null;
  difficulty: DifficultyLevel;
  source_type: QuestionSourceType;
  pyq_year?: number | null;
  pyq_shift?: string | null;
  pyq_provenance_status: PyqProvenanceStatus;
  concept_tags: string[];
  duplicate_status: DuplicateStatus;
  duplicate_matched_question_id?: string | null;
  similarity_score?: number | null;
  status: IngestionItemStatus;
  validation_errors: string[];
  ai_confidence: number;
  imported_question_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Zod Schemas for Ingestion Upload & Review
export const IngestionUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  rightsDeclaration: z.enum([
    "OWN_CONTENT",
    "LICENSED",
    "SCHOOL_PROVIDED",
    "AUTHORIZED_THIRD_PARTY",
    "UNKNOWN",
  ]),
  fileType: z.enum(["PDF", "DOCX", "CSV", "IMAGE", "TEXT"]),
  examType: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]).default("JEE_MAIN"),
  defaultSubjectId: z.string().uuid().optional().nullable(),
  defaultChapterId: z.string().uuid().optional().nullable(),
  textContent: z.string().optional(),
});

export const IngestionItemEditSchema = z.object({
  extracted_latex: z.string().min(3, "Question body is required"),
  options: z
    .array(
      z.object({
        option_key: z.enum(["A", "B", "C", "D"]),
        content_latex: z.string().min(1, "Option content is required"),
        is_correct: z.boolean(),
      })
    )
    .length(4, "Must have exactly 4 options"),
  correct_option_key: z.enum(["A", "B", "C", "D"]),
  explanation_latex: z.string().optional().nullable(),
  exam_type: z.enum(["JEE_MAIN", "JEE_ADV", "NEET", "GENERIC"]),
  subject_id: z.string().uuid("Valid subject required"),
  chapter_id: z.string().uuid("Valid chapter required"),
  topic_id: z.string().uuid().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADVANCED"]),
  source_type: z.enum(["PYQ", "INSTITUTE", "AI_GENERATED", "SEED_DEMO"]),
  pyq_year: z.number().int().min(1990).max(2030).optional().nullable(),
  pyq_shift: z.string().optional().nullable(),
  pyq_provenance_status: z.enum(["VERIFIED", "UNVERIFIED", "USER_DECLARED", "UNKNOWN"]),
});

export type IngestionUploadInput = z.infer<typeof IngestionUploadSchema>;
export type IngestionItemEditInput = z.infer<typeof IngestionItemEditSchema>;
