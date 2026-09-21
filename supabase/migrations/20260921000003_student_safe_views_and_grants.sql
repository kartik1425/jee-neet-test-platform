-- Phase 2 Security Gate Migration: Student-Safe Views, Column Secrecy & Post-Exam Review RPC
-- PostgreSQL & Supabase

-- 1. Create a Student-Safe Security-Invoker View that strictly OMITS `is_correct`
CREATE OR REPLACE VIEW public.student_question_options
WITH (security_invoker = true)
AS
  SELECT
    id,
    question_id,
    option_key,
    content_latex,
    order_index,
    created_at
  FROM public.question_options;

-- Grant SELECT on student_question_options to authenticated users
GRANT SELECT ON public.student_question_options TO authenticated;

-- 2. Update RLS on question_options to RESTRICT direct table SELECT to TEACHER and ADMIN only.
-- Students MUST use the student_question_options view (or post-exam review RPC), preventing direct access to `is_correct`.
DROP POLICY IF EXISTS "Students can read options" ON public.question_options;

CREATE POLICY "Direct question_options table access restricted to Teachers and Admins"
  ON public.question_options
  FOR SELECT
  USING (
    public.get_current_user_role() IN ('TEACHER', 'ADMIN')
  );

-- 3. Secure Post-Exam Review Function (Authoritative Answer Key Access only after submission)
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id UUID)
RETURNS TABLE (
  question_id UUID,
  content_latex TEXT,
  explanation_latex TEXT,
  options JSONB,
  selected_option_id UUID,
  is_correct BOOLEAN,
  marks_awarded NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
BEGIN
  -- Verify attempt ownership and completion status
  SELECT id, test_id, student_id, status
  INTO v_attempt
  FROM public.attempts
  WHERE id = p_attempt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  -- Authorization check: must be the attempt owner or teacher/admin
  IF v_attempt.student_id <> auth.uid() AND public.get_current_user_role() NOT IN ('TEACHER', 'ADMIN') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Secrecy check: If user is student, attempt MUST be SUBMITTED, AUTO_SUBMITTED, or EXPIRED
  IF public.get_current_user_role() = 'STUDENT' AND v_attempt.status NOT IN ('SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED') THEN
    RAISE EXCEPTION 'Answer key and explanations are concealed until attempt is completed';
  END IF;

  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.content_latex,
    q.explanation_latex,
    jsonb_agg(
      jsonb_build_object(
        'id', qo.id,
        'option_key', qo.option_key,
        'content_latex', qo.content_latex,
        'is_correct', qo.is_correct
      ) ORDER BY qo.order_index
    ) AS options,
    aa.selected_option_id,
    aa.is_correct,
    aa.marks_awarded
  FROM public.test_questions tq
  JOIN public.questions q ON q.id = tq.question_id
  JOIN public.question_options qo ON qo.question_id = q.id
  LEFT JOIN public.attempt_answers aa ON aa.attempt_id = v_attempt.id AND aa.question_id = q.id
  WHERE tq.test_id = v_attempt.test_id
  GROUP BY q.id, q.content_latex, q.explanation_latex, aa.selected_option_id, aa.is_correct, aa.marks_awarded, tq.order_index
  ORDER BY tq.order_index;
END;
$$;

-- Revoke execute from public; grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_attempt_review(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(UUID) TO authenticated;
