-- Phase 6 Migration: Test Lifecycle Safety, Assignment Statuses & Notification Triggers
-- PostgreSQL & Supabase

-- 1. Ensure test_results and attempts cannot be accidentally deleted if historical records exist
ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_test_id_fkey,
  ADD CONSTRAINT attempts_test_id_fkey
    FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE RESTRICT;

ALTER TABLE public.test_results
  DROP CONSTRAINT IF EXISTS test_results_test_id_fkey,
  ADD CONSTRAINT test_results_test_id_fkey
    FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE RESTRICT;

-- 2. Add assignment status enum for granular tracking
DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.test_assignments
  ADD COLUMN IF NOT EXISTS status public.assignment_status NOT NULL DEFAULT 'ASSIGNED';

-- 3. Automatic Notification Trigger for Class Assignments
CREATE OR REPLACE FUNCTION public.notify_students_on_test_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_title TEXT;
  v_student_id UUID;
BEGIN
  -- Get test title
  SELECT title INTO v_test_title FROM public.tests WHERE id = NEW.test_id;

  -- If assigned directly to a student
  IF NEW.student_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.student_id,
      'New Test Assigned: ' || COALESCE(v_test_title, 'Mock Test'),
      'You have been assigned a new examination. Check your student portal to review instructions.',
      'TEST_ASSIGNED'
    );
  END IF;

  -- If assigned to a class, notify all class members
  IF NEW.class_id IS NOT NULL THEN
    FOR v_student_id IN
      SELECT student_id FROM public.class_members WHERE class_id = NEW.class_id
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        v_student_id,
        'Class Test Assigned: ' || COALESCE(v_test_title, 'Mock Test'),
        'Your teacher has scheduled a new exam for your class.',
        'TEST_ASSIGNED'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_test_assigned ON public.test_assignments;
CREATE TRIGGER on_test_assigned
  AFTER INSERT ON public.test_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_students_on_test_assignment();
