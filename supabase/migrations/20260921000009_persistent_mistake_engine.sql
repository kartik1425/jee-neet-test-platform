-- Phase 12 Migration: Persistent Mistake Engine & Error Taxonomy
-- PostgreSQL & Supabase

-- 1. Ensure Controlled Error Taxonomy Type / Column Checks
-- If mistake_category enum exists, update or use TEXT check constraints for flexible evolution

CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_answer_id UUID NOT NULL REFERENCES public.attempt_answers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  attempt_id UUID REFERENCES public.attempts(id) ON DELETE RESTRICT,
  test_id UUID REFERENCES public.tests(id) ON DELETE RESTRICT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mistake_type TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (
    mistake_type IN (
      'CONCEPTUAL_ERROR',
      'FORMULA_ERROR',
      'CALCULATION_ERROR',
      'MISREAD_QUESTION',
      'WRONG_ASSUMPTION',
      'TIME_PRESSURE',
      'CARELESS_ERROR',
      'GUESS',
      'UNABLE_TO_START',
      'UNKNOWN'
    )
  ),
  classification_source TEXT NOT NULL DEFAULT 'RULE' CHECK (
    classification_source IN ('RULE', 'AI', 'TEACHER', 'STUDENT')
  ),
  classification_confidence TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (
    classification_confidence IN ('HIGH', 'MEDIUM', 'LOW')
  ),
  classification_status TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (
    classification_status IN ('SUGGESTED', 'CONFIRMED', 'REJECTED')
  ),
  resolution_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    resolution_status IN ('OPEN', 'IMPROVING', 'RESOLVED')
  ),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  student_feedback TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_attempt_answer_mistake UNIQUE (attempt_answer_id)
);

-- Add columns if table already existed from earlier foundation migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='attempt_id') THEN
    ALTER TABLE public.mistakes ADD COLUMN attempt_id UUID REFERENCES public.attempts(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='test_id') THEN
    ALTER TABLE public.mistakes ADD COLUMN test_id UUID REFERENCES public.tests(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='subject_id') THEN
    ALTER TABLE public.mistakes ADD COLUMN subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='chapter_id') THEN
    ALTER TABLE public.mistakes ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='classification_source') THEN
    ALTER TABLE public.mistakes ADD COLUMN classification_source TEXT NOT NULL DEFAULT 'RULE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='classification_confidence') THEN
    ALTER TABLE public.mistakes ADD COLUMN classification_confidence TEXT NOT NULL DEFAULT 'MEDIUM';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='classification_status') THEN
    ALTER TABLE public.mistakes ADD COLUMN classification_status TEXT NOT NULL DEFAULT 'SUGGESTED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='resolution_status') THEN
    ALTER TABLE public.mistakes ADD COLUMN resolution_status TEXT NOT NULL DEFAULT 'OPEN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='evidence') THEN
    ALTER TABLE public.mistakes ADD COLUMN evidence JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='reviewed_by') THEN
    ALTER TABLE public.mistakes ADD COLUMN reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='reviewed_at') THEN
    ALTER TABLE public.mistakes ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='resolved_at') THEN
    ALTER TABLE public.mistakes ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mistakes' AND column_name='updated_at') THEN
    ALTER TABLE public.mistakes ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- 2. Student Question History Table (Longitudinal attempt tracking per question)
CREATE TABLE IF NOT EXISTS public.student_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  times_attempted INTEGER NOT NULL DEFAULT 1,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_incorrect INTEGER NOT NULL DEFAULT 0,
  first_attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_result TEXT NOT NULL CHECK (last_result IN ('CORRECT', 'INCORRECT', 'UNATTEMPTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_question_history UNIQUE (student_id, question_id)
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_mistakes_student_topic ON public.mistakes(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_student_chapter ON public.mistakes(student_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_student_type ON public.mistakes(student_id, mistake_type);
CREATE INDEX IF NOT EXISTS idx_mistakes_attempt ON public.mistakes(attempt_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_test ON public.mistakes(test_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_status ON public.mistakes(classification_status);
CREATE INDEX IF NOT EXISTS idx_mistakes_resolution ON public.mistakes(resolution_status);

CREATE INDEX IF NOT EXISTS idx_student_question_history_student ON public.student_question_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_question_history_question ON public.student_question_history(question_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_question_history ENABLE ROW LEVEL SECURITY;

-- Students can view only their own mistake records
DROP POLICY IF EXISTS "Students can view their own mistakes" ON public.mistakes;
CREATE POLICY "Students can view their own mistakes"
  ON public.mistakes FOR SELECT
  USING (student_id = auth.uid());

-- Teachers and Admins can view mistakes
DROP POLICY IF EXISTS "Teachers and Admins can view mistakes" ON public.mistakes;
CREATE POLICY "Teachers and Admins can view mistakes"
  ON public.mistakes FOR SELECT
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Teachers and Admins can update mistake confirmation and reviews
CREATE POLICY "Teachers and Admins can update mistakes"
  ON public.mistakes FOR UPDATE
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- System / Authenticated can insert/upsert mistake records during analysis
CREATE POLICY "Users can manage own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (student_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Student question history RLS
CREATE POLICY "Students can view own question history"
  ON public.student_question_history FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers and Admins can view student question history"
  ON public.student_question_history FOR SELECT
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Users can manage own question history"
  ON public.student_question_history FOR ALL
  USING (student_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.mistakes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.student_question_history TO authenticated;
