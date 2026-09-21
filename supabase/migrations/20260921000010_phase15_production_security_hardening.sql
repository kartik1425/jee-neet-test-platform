-- ============================================================================
-- Migration: 20260921000010_phase15_production_security_hardening.sql
-- Description: Phase 15 Security Hardening & Index Optimization
-- ============================================================================

-- 1. HARDEN ALL SECURITY DEFINER FUNCTIONS WITH EXPLICIT SEARCH_PATH
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Restrict execution to authenticated users
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO service_role;

-- 2. HARDEN get_attempt_review WITH EXPLICIT PERMISSION REVOCATION
REVOKE ALL ON FUNCTION public.get_attempt_review(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(UUID) TO service_role;

-- 3. PERFORMANCE INDEXES FOR FREQUENT LOOKUPS & CLASS ANALYTICS
CREATE INDEX IF NOT EXISTS idx_attempts_student_test ON public.attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON public.attempts(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_q ON public.attempt_answers(attempt_id, question_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_student_chapter ON public.mistakes(student_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student_class ON public.class_members(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_class_test ON public.test_assignments(class_id, test_id);

-- 4. RE-ASSERT RLS ENABLED ON ALL TABLES (DEFENSIVE CHECK)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_topic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staging_questions ENABLE ROW LEVEL SECURITY;
