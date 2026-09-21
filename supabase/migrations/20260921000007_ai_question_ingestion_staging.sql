-- Phase 9 Migration: AI Question Ingestion Staging & Review Pipeline
-- PostgreSQL & Supabase

-- 1. Ingestion Batches Table
CREATE TABLE IF NOT EXISTS public.ingestion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rights_declaration TEXT NOT NULL DEFAULT 'OWN_CONTENT' CHECK (
    rights_declaration IN ('OWN_CONTENT', 'LICENSED', 'SCHOOL_PROVIDED', 'AUTHORIZED_THIRD_PARTY', 'UNKNOWN')
  ),
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (
    status IN ('UPLOADED', 'PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED', 'FAILED', 'COMPLETED')
  ),
  source_filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (
    file_type IN ('PDF', 'DOCX', 'CSV', 'IMAGE', 'TEXT')
  ),
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT, -- SHA-256 for duplicate upload detection
  storage_path TEXT,
  total_items_count INTEGER NOT NULL DEFAULT 0,
  valid_items_count INTEGER NOT NULL DEFAULT 0,
  needs_review_count INTEGER NOT NULL DEFAULT 0,
  duplicate_items_count INTEGER NOT NULL DEFAULT 0,
  failed_items_count INTEGER NOT NULL DEFAULT 0,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 2. Ingestion Items (Staging Table)
CREATE TABLE IF NOT EXISTS public.ingestion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.ingestion_batches(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  raw_content TEXT NOT NULL,
  source_page_number INTEGER,
  source_location_ref TEXT,
  extracted_latex TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of 4 options [{option_key, content_latex, is_correct}]
  correct_option_key TEXT CHECK (correct_option_key IN ('A', 'B', 'C', 'D')),
  answer_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (
    answer_status IN ('VERIFIED', 'UNVERIFIED', 'CONFLICTING', 'MISSING')
  ),
  explanation_latex TEXT,
  exam_type public.exam_type NOT NULL DEFAULT 'JEE_MAIN',
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  suggested_subject_name TEXT,
  suggested_chapter_name TEXT,
  suggested_topic_name TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'MEDIUM',
  source_type public.question_source_type NOT NULL DEFAULT 'INSTITUTE',
  pyq_year INTEGER,
  pyq_shift TEXT,
  pyq_provenance_status TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (
    pyq_provenance_status IN ('VERIFIED', 'UNVERIFIED', 'USER_DECLARED', 'UNKNOWN')
  ),
  concept_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  duplicate_status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    duplicate_status IN ('NEW', 'POSSIBLE_DUPLICATE', 'DUPLICATE')
  ),
  duplicate_matched_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  similarity_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW' CHECK (
    status IN ('EXTRACTED', 'NORMALIZED', 'VALIDATED', 'DUPLICATE', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'IMPORTED')
  ),
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_confidence NUMERIC DEFAULT 0.9,
  imported_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Add foreign reference column to questions table for ingestion provenance auditing
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS ingestion_batch_id UUID REFERENCES public.ingestion_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ingestion_item_id UUID REFERENCES public.ingestion_items(id) ON DELETE SET NULL;

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_creator ON public.ingestion_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_status ON public.ingestion_batches(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_batch ON public.ingestion_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_status ON public.ingestion_items(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_duplicate ON public.ingestion_items(duplicate_matched_question_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.ingestion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_items ENABLE ROW LEVEL SECURITY;

-- Teachers and Admins have full access to manage ingestion batches & staging items
CREATE POLICY "Teachers and Admins can manage ingestion batches"
  ON public.ingestion_batches FOR ALL
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Teachers and Admins can manage ingestion items"
  ON public.ingestion_items FOR ALL
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Students have ZERO access to ingestion tables (no select, no insert, no update, no delete)
