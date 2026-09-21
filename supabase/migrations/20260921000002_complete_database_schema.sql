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
