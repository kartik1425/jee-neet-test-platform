-- Phase 11 Migration: AI Diagnostic Reports & Analytics
-- PostgreSQL & Supabase

-- 1. AI Analysis / Diagnostic Reports Table
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'COMPLETED', 'FAILED')
  ),
  report_version TEXT NOT NULL DEFAULT 'v1.0.0',
  deterministic_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_report JSONB,
  error_message TEXT,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- Add columns if table already existed from earlier foundation migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='user_id') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='test_id') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN test_id UUID REFERENCES public.tests(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='status') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='report_version') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN report_version TEXT NOT NULL DEFAULT 'v1.0.0';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='deterministic_payload') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN deterministic_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='ai_report') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN ai_report JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='error_message') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN error_message TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='generation_time_ms') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN generation_time_ms INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='updated_at') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_analysis' AND column_name='completed_at') THEN
    ALTER TABLE public.ai_analysis ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_attempt ON public.ai_analysis(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user ON public.ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_test ON public.ai_analysis(test_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_status ON public.ai_analysis(status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if they exist
DROP POLICY IF EXISTS "Students can view their own AI analysis" ON public.ai_analysis;
DROP POLICY IF EXISTS "Teachers and Admins can view all AI analysis" ON public.ai_analysis;
DROP POLICY IF EXISTS "Students can view own diagnostic reports" ON public.ai_analysis;
DROP POLICY IF EXISTS "Users can manage own diagnostic reports" ON public.ai_analysis;

-- Students can view only their own AI diagnostic reports
CREATE POLICY "Students can view own diagnostic reports"
  ON public.ai_analysis FOR SELECT
  USING (user_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Students can create / update their own attempt analysis
CREATE POLICY "Users can manage own diagnostic reports"
  ON public.ai_analysis FOR ALL
  USING (user_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.ai_analysis TO authenticated;
