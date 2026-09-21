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
