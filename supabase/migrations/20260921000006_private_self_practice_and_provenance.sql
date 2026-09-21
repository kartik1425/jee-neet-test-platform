-- Phase 8 Migration: Private Self-Practice Tests and Provenance RLS
-- PostgreSQL & Supabase

-- 1. Redefine Students Test Access Policy: Self-practice is strictly private to the creating student
DROP POLICY IF EXISTS "Students can view published/assigned tests" ON public.tests;

CREATE POLICY "Students can view assigned or own private practice tests"
  ON public.tests FOR SELECT
  USING (
    -- Case 1: Student is the author/owner of the test (e.g. self practice test)
    (created_by = auth.uid() AND test_mode = 'PRACTICE_SELF') OR
    -- Case 2: Test is assigned directly or via enrolled class
    (
      status IN ('PUBLISHED', 'SCHEDULED', 'LIVE', 'COMPLETED') AND
      EXISTS (
        SELECT 1 FROM public.test_assignments
        WHERE test_assignments.test_id = tests.id AND (
          test_assignments.student_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = test_assignments.class_id AND class_members.student_id = auth.uid()
          )
        )
      )
    )
  );

-- 2. Allow Students to create and manage their own private self-practice tests
CREATE POLICY "Students can create their own private practice tests"
  ON public.tests FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    test_mode = 'PRACTICE_SELF' AND
    status IN ('DRAFT', 'PUBLISHED', 'LIVE')
  );

CREATE POLICY "Students can update their own private practice tests"
  ON public.tests FOR UPDATE
  USING (
    created_by = auth.uid() AND
    test_mode = 'PRACTICE_SELF'
  )
  WITH CHECK (
    created_by = auth.uid() AND
    test_mode = 'PRACTICE_SELF'
  );

-- 3. Allow Students to insert questions into their own private practice tests
CREATE POLICY "Students can manage questions for own practice tests"
  ON public.test_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_questions.test_id
        AND tests.created_by = auth.uid()
        AND tests.test_mode = 'PRACTICE_SELF'
    )
  );

CREATE POLICY "Students can delete questions from own draft practice tests"
  ON public.test_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_questions.test_id
        AND tests.created_by = auth.uid()
        AND tests.test_mode = 'PRACTICE_SELF'
        AND tests.status = 'DRAFT'
    )
  );
