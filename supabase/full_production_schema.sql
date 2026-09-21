-- ============================================================================
-- JEE/NEET TEST PLATFORM - FULL PRODUCTION SCHEMA INITIALIZATION
-- Target Project: szxkozrlxqzcyizvrsev (jee-neet-test-series)
-- Region: ap-south-1
-- ============================================================================

-- ============================================================================
-- >>>>> MIGRATION: 20260921000001_auth_and_profiles.sql <<<<<
-- ============================================================================

-- Phase 1 Migration: Auth Profiles & Role Based Access Control
-- Run this in your Supabase SQL Editor

-- 1. Create Role Enum
CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE public.target_exam_type AS ENUM ('JEE_MAIN', 'JEE_ADV', 'NEET');

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'STUDENT',
  target_exam public.target_exam_type DEFAULT 'JEE_MAIN',
  target_year INTEGER DEFAULT 2026,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Get Current User Role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. RLS Policies for Profiles
-- A. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- B. Teachers and Admins can view all profiles (e.g. students and classes)
CREATE POLICY "Teachers and Admins can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.get_current_user_role() IN ('TEACHER', 'ADMIN')
  );

-- C. Users can update their own profile (name, target exam) but CANNOT change their role
CREATE POLICY "Users can update own non-role profile fields"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be altered by normal user
  );

-- D. Admins can update any profile including role assignments
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR ALL
  USING (
    public.get_current_user_role() = 'ADMIN'
  );

-- 7. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'STUDENT';
BEGIN
  -- Safe default: always create STUDENT unless created via admin service_role metadata
  INSERT INTO public.profiles (id, email, full_name, role, target_exam)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student User'),
    assigned_role,
    COALESCE((new.raw_user_meta_data->>'target_exam')::public.target_exam_type, 'JEE_MAIN')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- >>>>> MIGRATION: 20260921000002_complete_database_schema.sql <<<<<
-- ============================================================================

-- Phase 2 Migration: Complete Relational Schema, Snapshot Strategy & RLS Policies
-- PostgreSQL & Supabase

-- ==========================================
-- 1. ENUMS
-- ==========================================

DO $$ BEGIN
  CREATE TYPE public.exam_type AS ENUM ('JEE_MAIN', 'JEE_ADV', 'NEET', 'GENERIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM ('SINGLE_MCQ');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_source_type AS ENUM ('PYQ', 'INSTITUTE', 'AI_GENERATED', 'SEED_DEMO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.question_status AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.test_mode AS ENUM ('SCHEDULED', 'PRACTICE_SELF', 'MOCK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.test_status AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attempt_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mistake_category AS ENUM (
    'CONCEPTUAL_ERROR',
    'FORMULA_ERROR',
    'CALCULATION_ERROR',
    'MISREAD_QUESTION',
    'WRONG_ASSUMPTION',
    'CARELESS_ERROR',
    'TIME_PRESSURE',
    'GUESS',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('TEST_ASSIGNED', 'TEST_LIVE', 'RESULT_PUBLISHED', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. ORGANIZATIONAL & CLASS ENTITIES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT 2026,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(class_id, student_id)
);

-- ==========================================
-- 3. ACADEMIC TAXONOMY ENTITIES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(chapter_id, name)
);

-- ==========================================
-- 4. QUESTION BANK & OPTIONS (V1 MCQ ONLY)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE RESTRICT,
  topic_id UUID REFERENCES public.topics(id) ON DELETE RESTRICT,
  exam_type public.exam_type NOT NULL DEFAULT 'JEE_MAIN',
  question_type public.question_type NOT NULL DEFAULT 'SINGLE_MCQ',
  difficulty public.difficulty_level NOT NULL DEFAULT 'MEDIUM',
  content_latex TEXT NOT NULL,
  explanation_latex TEXT,
  source_type public.question_source_type NOT NULL DEFAULT 'INSTITUTE',
  pyq_year INTEGER,
  pyq_shift TEXT,
  source_reference TEXT,
  status public.question_status NOT NULL DEFAULT 'DRAFT',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL CHECK (option_key IN ('A', 'B', 'C', 'D')),
  content_latex TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(question_id, option_key)
);

CREATE TABLE IF NOT EXISTS public.question_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  UNIQUE(question_id, tag_name)
);

-- ==========================================
-- 5. TEST CREATION & SNAPSHOTTING
-- ==========================================

CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  exam_type public.exam_type NOT NULL DEFAULT 'JEE_MAIN',
  test_mode public.test_mode NOT NULL DEFAULT 'SCHEDULED',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  marking_scheme JSONB NOT NULL DEFAULT '{"correct": 4, "incorrect": -1, "unattempted": 0}'::jsonb,
  status public.test_status NOT NULL DEFAULT 'DRAFT',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.test_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  marking_scheme_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  section_id UUID REFERENCES public.test_sections(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  marks NUMERIC NOT NULL DEFAULT 4,
  negative_marks NUMERIC NOT NULL DEFAULT -1,
  snapshot_data JSONB, -- Immutable frozen copy of question content & options when test is published
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(test_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  due_at TIMESTAMPTZ,
  CONSTRAINT check_assignment_target CHECK (class_id IS NOT NULL OR student_id IS NOT NULL)
);

-- ==========================================
-- 6. ATTEMPTS & ANSWERS (EXAM ENGINE)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ,
  server_end_time TIMESTAMPTZ NOT NULL, -- Authoritative server expiration timestamp
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  total_score NUMERIC,
  accuracy_percentage NUMERIC,
  calculated_stats JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  is_visited BOOLEAN NOT NULL DEFAULT TRUE,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  is_correct BOOLEAN, -- Evaluated server-side on submission
  marks_awarded NUMERIC, -- Computed server-side on submission
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(attempt_id, question_id)
);

-- ==========================================
-- 7. ANALYTICS & MISTAKES FOUNDATION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_answer_id UUID NOT NULL REFERENCES public.attempt_answers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mistake_type public.mistake_category NOT NULL DEFAULT 'UNKNOWN',
  ai_confidence NUMERIC,
  ai_rationale TEXT,
  student_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.student_topic_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  total_attempted INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_incorrect INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE CASCADE,
  executive_summary TEXT,
  subject_breakdown JSONB,
  topic_weaknesses JSONB,
  time_management_insights JSONB,
  suggested_action_plan JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'SYSTEM',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 8. INDEXES FOR HIGH FREQUENCY QUERIES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_classes_created_by ON public.classes(created_by);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);

CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON public.topics(chapter_id);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_status ON public.questions(exam_type, status);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id);

CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON public.tests(created_by);
CREATE INDEX IF NOT EXISTS idx_test_questions_test ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON public.test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_class ON public.test_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_student ON public.test_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_student ON public.attempts(test_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_student ON public.mistakes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_stats_lookup ON public.student_topic_stats(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- Partial index for active attempts per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_attempt_per_test
  ON public.attempts(test_id, student_id)
  WHERE status = 'IN_PROGRESS';

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 9.1 TAXONOMY (Subjects, Chapters, Topics) - Public Read for Authenticated
CREATE POLICY "Taxonomy subjects readable by authenticated users"
  ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Taxonomy chapters readable by authenticated users"
  ON public.chapters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Taxonomy topics readable by authenticated users"
  ON public.topics FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Taxonomy managed by Admins"
  ON public.subjects FOR ALL USING (public.get_current_user_role() = 'ADMIN');
CREATE POLICY "Chapters managed by Admins"
  ON public.chapters FOR ALL USING (public.get_current_user_role() = 'ADMIN');
CREATE POLICY "Topics managed by Admins"
  ON public.topics FOR ALL USING (public.get_current_user_role() = 'ADMIN');

-- 9.2 CLASSES & MEMBERS
CREATE POLICY "Teachers and Admins can view and manage classes"
  ON public.classes FOR ALL USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can view classes they belong to"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_members.class_id = classes.id AND class_members.student_id = auth.uid()
    )
  );

CREATE POLICY "Class members viewable by class members, teachers, admins"
  ON public.class_members FOR SELECT
  USING (
    student_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN')
  );

CREATE POLICY "Class members manageable by Teachers and Admins"
  ON public.class_members FOR INSERT WITH CHECK (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- 9.3 QUESTIONS & OPTIONS
-- Teachers & Admins can manage all questions
CREATE POLICY "Teachers and Admins can manage questions"
  ON public.questions FOR ALL USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Students can read approved questions
CREATE POLICY "Students can read approved questions"
  ON public.questions FOR SELECT
  USING (status = 'APPROVED' AND is_active = TRUE);

-- Question Options: Teachers & Admins can manage
CREATE POLICY "Teachers and Admins can manage question options"
  ON public.question_options FOR ALL USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- Students can read options
CREATE POLICY "Students can read options"
  ON public.question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      WHERE questions.id = question_options.question_id AND questions.status = 'APPROVED' AND questions.is_active = TRUE
    )
  );

-- 9.4 TESTS & ASSIGNMENTS
CREATE POLICY "Teachers and Admins can manage tests"
  ON public.tests FOR ALL USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can view published/assigned tests"
  ON public.tests FOR SELECT
  USING (
    status IN ('PUBLISHED', 'SCHEDULED', 'LIVE', 'COMPLETED') AND (
      test_mode = 'PRACTICE_SELF' OR
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

CREATE POLICY "Test questions readable if test is readable"
  ON public.test_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = test_questions.test_id
    )
  );

CREATE POLICY "Teachers and Admins can manage test questions"
  ON public.test_questions FOR ALL USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- 9.5 ATTEMPTS
CREATE POLICY "Students can view and manage their own attempts"
  ON public.attempts FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers and Admins can view all attempts"
  ON public.attempts FOR SELECT
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- 9.6 ATTEMPT ANSWERS
CREATE POLICY "Students can view and update their own attempt answers"
  ON public.attempt_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.attempts
      WHERE attempts.id = attempt_answers.attempt_id AND attempts.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attempts
      WHERE attempts.id = attempt_answers.attempt_id AND attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and Admins can view attempt answers"
  ON public.attempt_answers FOR SELECT
  USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

-- 9.7 MISTAKES & ANALYTICS
CREATE POLICY "Students can view their own mistakes"
  ON public.mistakes FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers and Admins can view mistakes"
  ON public.mistakes FOR SELECT USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can view their own topic stats"
  ON public.student_topic_stats FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers and Admins can view student topic stats"
  ON public.student_topic_stats FOR SELECT USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can view their own AI analysis"
  ON public.ai_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attempts
      WHERE attempts.id = ai_analysis.attempt_id AND attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and Admins can view all AI analysis"
  ON public.ai_analysis FOR SELECT USING (public.get_current_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- >>>>> MIGRATION: 20260921000003_student_safe_views_and_grants.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000004_test_results_and_scoring.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000005_test_management_and_safe_lifecycle.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000006_private_self_practice_and_provenance.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000007_ai_question_ingestion_staging.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000008_ai_diagnostic_reports.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000009_persistent_mistake_engine.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> MIGRATION: 20260921000010_phase15_production_security_hardening.sql <<<<<
-- ============================================================================

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


-- ============================================================================
-- >>>>> SEED DATA: seed.sql <<<<<
-- ============================================================================

-- Development Seed Data: Educational Taxonomy and Verified Demo Questions
-- LABEL: DEMO / SEED / DEVELOPMENT

-- 1. Insert Standard Subjects
INSERT INTO public.subjects (id, name, code)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Physics', 'PHY'),
  ('11111111-0000-0000-0000-000000000002', 'Chemistry', 'CHEM'),
  ('11111111-0000-0000-0000-000000000003', 'Mathematics', 'MATH'),
  ('11111111-0000-0000-0000-000000000004', 'Biology', 'BIO')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Standard Chapters (Physics Sample)
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Units and Dimensions', 1),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Kinematics', 2),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Laws of Motion', 3),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Work, Energy and Power', 4),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Rotational Motion', 5)
ON CONFLICT (subject_id, name) DO NOTHING;

-- 3. Insert Topics (Rotational Motion Sample)
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', 'Moment of Inertia', 1),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', 'Torque and Angular Momentum', 2),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000005', 'Rolling Motion', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;

-- 4. Insert Verified Sample MCQ (Clearly labeled SEED_DEMO)
INSERT INTO public.questions (
  id,
  subject_id,
  chapter_id,
  topic_id,
  exam_type,
  question_type,
  difficulty,
  content_latex,
  explanation_latex,
  source_type,
  source_reference,
  status,
  is_active
)
VALUES (
  '44444444-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000001',
  'JEE_MAIN',
  'SINGLE_MCQ',
  'MEDIUM',
  'A solid cylinder of mass $M$ and radius $R$ rotates about its geometrical axis. What is its radius of gyration $k$?',
  'The moment of inertia of a solid cylinder about its central axis is $I = \frac{1}{2} M R^2 = M k^2 \implies k = \frac{R}{\sqrt{2}}$.',
  'SEED_DEMO',
  'DEMO-SEED-2026-PHY-01',
  'APPROVED',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Options for Demo MCQ
INSERT INTO public.question_options (id, question_id, option_key, content_latex, is_correct, order_index)
VALUES
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'A', '$\frac{R}{\sqrt{2}}$', TRUE, 1),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'B', '$\frac{R}{2}$', FALSE, 2),
  ('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', 'C', '$\sqrt{\frac{2}{5}} R$', FALSE, 3),
  ('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', 'D', '$R$', FALSE, 4)
ON CONFLICT (question_id, option_key) DO NOTHING;


