-- Phase 5 Migration: Authoritative Deterministic Score Records & Storage
-- PostgreSQL & Supabase

CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scoring_version TEXT NOT NULL DEFAULT 'v1.0.0',
  total_score NUMERIC NOT NULL,
  maximum_score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  attempted_count INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  incorrect_count INTEGER NOT NULL,
  unattempted_count INTEGER NOT NULL,
  accuracy_percentage NUMERIC NOT NULL,
  total_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  subject_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  chapter_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  topic_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_results_student ON public.test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_attempt ON public.test_results(attempt_id);

-- RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own test results"
  ON public.test_results
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers and Admins can view test results"
  ON public.test_results
  FOR SELECT
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));
