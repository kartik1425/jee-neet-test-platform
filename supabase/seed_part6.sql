-- Seed Part 6 of 6: Questions 5001 to 5020
-- Compatible with Supabase Web SQL Editor query size limits

INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'f23c6dfd-7d84-4ed9-a2bc-5c12ad8b7f86', '11111111-0000-0000-0000-000000000003', '4bcf925f-6876-4f0d-ae61-c3c89a456425', 'f09e832d-6504-4f4a-a0bd-036302d650cb',
  'JEE_MAIN', 'SINGLE_MCQ', 'MEDIUM',
  'In Properties of Determinants, the value of the definite integral ∫[0 to π/2] (sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))) dx is:', 'By King''s property, 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.',
  'PYQ', 2019, 'Shift 2', 'JEE MAIN-2019-MATH-Q22', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '73d0e14f-ea81-47d0-a1b5-ea0f7c5c67b7', 'f23c6dfd-7d84-4ed9-a2bc-5c12ad8b7f86', 'A', 'π/2', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'e4c613f6-0801-4167-a6e7-a2ca58112038', 'f23c6dfd-7d84-4ed9-a2bc-5c12ad8b7f86', 'B', 'π/4', TRUE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'c6591955-3897-4eb5-ae77-dae62d479942', 'f23c6dfd-7d84-4ed9-a2bc-5c12ad8b7f86', 'C', 'π', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'dba25299-df53-4571-a442-611c3303f513', 'f23c6dfd-7d84-4ed9-a2bc-5c12ad8b7f86', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '96c58610-e7ea-405c-ae38-0557ff4edce8', '11111111-0000-0000-0000-000000000003', '4bcf925f-6876-4f0d-ae61-c3c89a456425', '1c11f4f9-8ffe-4217-a76c-0e27831015be',
  'JEE_ADV', 'SINGLE_MCQ', 'HARD',
  'For a square matrix A of order 3 in System of Linear Equations, if det(A) = 6, then the value of det(2A) is:', 'For an n x n matrix, det(k A) = kⁿ det(A). Here det(2A) = 2³ * 6 = 8 * 6 = 48.',
  'PYQ', 2020, 'Shift 1', 'JEE ADV-2020-MATH-Q23', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '6037199e-262c-4bef-ab91-79f2bf3741c3', '96c58610-e7ea-405c-ae38-0557ff4edce8', 'A', '12', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '27df08ba-fe68-4b9e-aa7c-e69aedd45d74', '96c58610-e7ea-405c-ae38-0557ff4edce8', 'B', '24', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'c236ab3b-abe6-4382-a565-675a67f51ad9', '96c58610-e7ea-405c-ae38-0557ff4edce8', 'C', '48', TRUE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '1442824a-df63-44be-af50-83691f531397', '96c58610-e7ea-405c-ae38-0557ff4edce8', 'D', '36', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '1927e4d3-dff7-4014-ac9d-6d0cf4afd60f', '11111111-0000-0000-0000-000000000003', '4bcf925f-6876-4f0d-ae61-c3c89a456425', '1b19fd89-cf71-42b7-aab8-14527eaf43f1',
  'NEET', 'SINGLE_MCQ', 'ADVANCED',
  'The perpendicular distance between the parallel lines 3x + 4y + 25 = 0 and 3x + 4y - 25 = 0 in Eigenvalues & Cayley-Hamilton is:', 'Distance d = |C₁ - C₂| / √(A² + B²) = |25 - (-25)| / 5 = 10.',
  'PYQ', 2021, 'Shift 2', 'NEET-2021-MATH-Q24', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'b9c50957-337a-4fe6-a245-7de008dfa895', '1927e4d3-dff7-4014-ac9d-6d0cf4afd60f', 'A', '20', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'b31d5daa-bf35-4f58-a40e-56187288ff54', '1927e4d3-dff7-4014-ac9d-6d0cf4afd60f', 'B', '5.0', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '0dce6dce-cd45-4e31-a1dd-4b5dbc4a4bf3', '1927e4d3-dff7-4014-ac9d-6d0cf4afd60f', 'C', '13', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'f1fa7377-25ea-4e39-aba2-e9fa99703883', '1927e4d3-dff7-4014-ac9d-6d0cf4afd60f', 'D', '10', TRUE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'aeefc85f-e097-4b9f-abbb-de0598a1723d', '11111111-0000-0000-0000-000000000003', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', 'd9cf5ba1-1c57-49f5-a6c2-159699967b33',
  'JEE_MAIN', 'SINGLE_MCQ', 'EASY',
  'Evaluating the limit in Euler & De Moivre Form: lim (x → 0) [sin(6x) / tan(3x)] is equal to:', 'Standard limit: lim (x → 0) [sin(ax) / tan(bx)] = a/b = 6/3.',
  'PYQ', 2022, 'Shift 1', 'JEE MAIN-2022-MATH-Q25', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd19fcf5a-6c49-48c9-ad42-da9404dc1b0f', 'aeefc85f-e097-4b9f-abbb-de0598a1723d', 'A', '6/3', TRUE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd4878ab5-5540-49a2-a3b2-3464ac4a9283', 'aeefc85f-e097-4b9f-abbb-de0598a1723d', 'B', '3/6', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '7493d629-e450-40d3-ac4e-e517b53f0e13', 'aeefc85f-e097-4b9f-abbb-de0598a1723d', 'C', '1', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '2a27db56-b492-4dea-a0d1-bfb526bced40', 'aeefc85f-e097-4b9f-abbb-de0598a1723d', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'e2097bb9-b158-4efe-a1b6-cc6a9251030b', '11111111-0000-0000-0000-000000000003', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', '62eabc7f-948a-4ca7-a88c-a9c3b6106de7',
  'JEE_ADV', 'SINGLE_MCQ', 'MEDIUM',
  'In Roots of Unity, the value of the definite integral ∫[0 to π/2] (sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))) dx is:', 'By King''s property, 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.',
  'PYQ', 2023, 'Shift 2', 'JEE ADV-2023-MATH-Q26', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd5b9b60b-5842-4a5b-a166-5b6b81d2e994', 'e2097bb9-b158-4efe-a1b6-cc6a9251030b', 'A', 'π/2', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '892deeb5-2cef-4816-a654-5c0fd1f84896', 'e2097bb9-b158-4efe-a1b6-cc6a9251030b', 'B', 'π/4', TRUE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '2294d95c-b9b6-4e49-ae25-8429590e3ab8', 'e2097bb9-b158-4efe-a1b6-cc6a9251030b', 'C', 'π', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'c8d05315-e585-4248-a612-15c60cb369b5', 'e2097bb9-b158-4efe-a1b6-cc6a9251030b', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'f390173f-2175-4b3b-a9b9-1a02734f2999', '11111111-0000-0000-0000-000000000003', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', '058e5294-aefd-480c-a13f-7ccdaf0944e2',
  'NEET', 'SINGLE_MCQ', 'HARD',
  'For a square matrix A of order 3 in Nature of Roots, if det(A) = 4, then the value of det(2A) is:', 'For an n x n matrix, det(k A) = kⁿ det(A). Here det(2A) = 2³ * 4 = 8 * 4 = 32.',
  'PYQ', 2024, 'Shift 1', 'NEET-2024-MATH-Q27', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '6b3f463a-e967-4827-a360-7eac430a9780', 'f390173f-2175-4b3b-a9b9-1a02734f2999', 'A', '8', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'bd75f59b-8493-46b8-affb-3f0e7aebd4db', 'f390173f-2175-4b3b-a9b9-1a02734f2999', 'B', '16', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '31633d0f-9b10-4b2e-abb3-d04597948305', 'f390173f-2175-4b3b-a9b9-1a02734f2999', 'C', '32', TRUE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '5e091947-60c5-4e71-a2a4-ec7712f48aad', 'f390173f-2175-4b3b-a9b9-1a02734f2999', 'D', '24', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'eaa3175f-02c0-4582-af78-dcef96423c4e', '11111111-0000-0000-0000-000000000003', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', '92130de1-d30c-466f-ae4a-e46ca842492c',
  'JEE_MAIN', 'SINGLE_MCQ', 'ADVANCED',
  'The perpendicular distance between the parallel lines 3x + 4y + 20 = 0 and 3x + 4y - 25 = 0 in Quadratic Inequalities is:', 'Distance d = |C₁ - C₂| / √(A² + B²) = |20 - (-25)| / 5 = 9.',
  'PYQ', 2025, 'Shift 2', 'JEE MAIN-2025-MATH-Q28', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd7086b73-bd94-43a7-aea5-ee47e0de3123', 'eaa3175f-02c0-4582-af78-dcef96423c4e', 'A', '18', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '2c7169b9-0613-4ae1-a9b0-7ba2402e1dfb', 'eaa3175f-02c0-4582-af78-dcef96423c4e', 'B', '4.5', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '0170311a-0632-439a-ad61-e0afb2965a08', 'eaa3175f-02c0-4582-af78-dcef96423c4e', 'C', '12', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '0bfe98c2-59ae-48e5-ae64-9354264b377c', 'eaa3175f-02c0-4582-af78-dcef96423c4e', 'D', '9', TRUE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '79fdc5a0-4559-4d5f-a3bf-eeccba6c52a5', '11111111-0000-0000-0000-000000000003', '691f4024-361c-46dc-a157-a573486e01e6', 'bdfba6de-ff77-4368-a01d-e274ad9baf17',
  'JEE_ADV', 'SINGLE_MCQ', 'EASY',
  'Evaluating the limit in Circular & Constrained Permutations: lim (x → 0) [sin(5x) / tan(3x)] is equal to:', 'Standard limit: lim (x → 0) [sin(ax) / tan(bx)] = a/b = 5/3.',
  'PYQ', 2018, 'Shift 1', 'JEE ADV-2018-MATH-Q29', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'c9c118ae-2e8a-48eb-a22c-152df93322d5', '79fdc5a0-4559-4d5f-a3bf-eeccba6c52a5', 'A', '5/3', TRUE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'a936b891-ae58-4654-a017-3568d30119c4', '79fdc5a0-4559-4d5f-a3bf-eeccba6c52a5', 'B', '3/5', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '8e0bfd03-f093-424f-a13c-8df9de1a7ae0', '79fdc5a0-4559-4d5f-a3bf-eeccba6c52a5', 'C', '1', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '258629dc-709a-40ad-a0a6-c3c66c9d4c56', '79fdc5a0-4559-4d5f-a3bf-eeccba6c52a5', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '35a77124-1508-45d7-a3c1-87b1d23bac8d', '11111111-0000-0000-0000-000000000003', '691f4024-361c-46dc-a157-a573486e01e6', '6b2abf28-5292-421b-a4d8-1dbfe361a0ad',
  'NEET', 'SINGLE_MCQ', 'MEDIUM',
  'In Bayes Theorem, the value of the definite integral ∫[0 to π/2] (sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))) dx is:', 'By King''s property, 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.',
  'PYQ', 2019, 'Shift 2', 'NEET-2019-MATH-Q30', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '6aae6cef-3f6b-4720-a11f-75306b71dea2', '35a77124-1508-45d7-a3c1-87b1d23bac8d', 'A', 'π/2', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '77c2152c-fd56-445d-a2df-af4942467385', '35a77124-1508-45d7-a3c1-87b1d23bac8d', 'B', 'π/4', TRUE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd863a862-2b1d-4c77-ad29-0323482f4c73', '35a77124-1508-45d7-a3c1-87b1d23bac8d', 'C', 'π', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'c13d5b6b-2abc-4385-aacc-5d7a1faca9e2', '35a77124-1508-45d7-a3c1-87b1d23bac8d', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'd6998018-9496-44e0-ac2c-d438c385143a', '11111111-0000-0000-0000-000000000003', '691f4024-361c-46dc-a157-a573486e01e6', 'c1ff25d7-a3be-4214-a5c2-bd5c2476f66e',
  'JEE_MAIN', 'SINGLE_MCQ', 'HARD',
  'For a square matrix A of order 3 in Conditional Probability, if det(A) = 2, then the value of det(2A) is:', 'For an n x n matrix, det(k A) = kⁿ det(A). Here det(2A) = 2³ * 2 = 8 * 2 = 16.',
  'PYQ', 2020, 'Shift 1', 'JEE MAIN-2020-MATH-Q1', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '947f2aa2-7113-4895-a885-cf402777a3b8', 'd6998018-9496-44e0-ac2c-d438c385143a', 'A', '4', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'aa073609-4e82-4fff-ae9f-3922c2a8df4c', 'd6998018-9496-44e0-ac2c-d438c385143a', 'B', '8', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '92763ac0-4da9-4c6e-a29f-772f04be3346', 'd6998018-9496-44e0-ac2c-d438c385143a', 'C', '16', TRUE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'b08112af-4f9c-466c-adf7-976f0e26d03f', 'd6998018-9496-44e0-ac2c-d438c385143a', 'D', '12', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '1623b327-22fb-4afc-ae45-8e7970b07714', '11111111-0000-0000-0000-000000000003', '691f4024-361c-46dc-a157-a573486e01e6', '53e24bfb-141f-4ffb-a5ce-64cab1c79f0f',
  'JEE_ADV', 'SINGLE_MCQ', 'ADVANCED',
  'The perpendicular distance between the parallel lines 3x + 4y + 15 = 0 and 3x + 4y - 25 = 0 in Binomial Distribution is:', 'Distance d = |C₁ - C₂| / √(A² + B²) = |15 - (-25)| / 5 = 8.',
  'PYQ', 2021, 'Shift 2', 'JEE ADV-2021-MATH-Q2', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '050ae8c6-4512-4a8b-a0b3-404983fee36c', '1623b327-22fb-4afc-ae45-8e7970b07714', 'A', '16', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '88e406d5-4377-47dd-af0c-8b261f04d9d6', '1623b327-22fb-4afc-ae45-8e7970b07714', 'B', '4.0', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '348d6c52-505c-4cb4-a074-8ac0ec1438d7', '1623b327-22fb-4afc-ae45-8e7970b07714', 'C', '11', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd05f584b-c8ca-4082-ad19-489993d2d15f', '1623b327-22fb-4afc-ae45-8e7970b07714', 'D', '8', TRUE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'c0558c65-5a1b-4d73-a081-3cab02412ac1', '11111111-0000-0000-0000-000000000003', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', '40a242b3-1c60-4601-a38c-c77fa1a9a799',
  'NEET', 'SINGLE_MCQ', 'EASY',
  'Evaluating the limit in Arithmetic & Geometric Progressions: lim (x → 0) [sin(4x) / tan(3x)] is equal to:', 'Standard limit: lim (x → 0) [sin(ax) / tan(bx)] = a/b = 4/3.',
  'PYQ', 2022, 'Shift 1', 'NEET-2022-MATH-Q3', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'ec2da214-7e7b-4e52-a433-c7c5fe8804e8', 'c0558c65-5a1b-4d73-a081-3cab02412ac1', 'A', '4/3', TRUE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd63e4a1e-590e-42df-aecb-eae30220aedc', 'c0558c65-5a1b-4d73-a081-3cab02412ac1', 'B', '3/4', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '5d27e360-ac06-4aff-ad9f-870ad7c5a22c', 'c0558c65-5a1b-4d73-a081-3cab02412ac1', 'C', '1', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'ea0796e8-1ab8-4ba4-adc7-b1d15cecb7b7', 'c0558c65-5a1b-4d73-a081-3cab02412ac1', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'acc468fe-e079-4964-af32-eacb19177b2a', '11111111-0000-0000-0000-000000000003', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', '59dddf98-9728-48f8-a51e-d0230fb63004',
  'JEE_MAIN', 'SINGLE_MCQ', 'MEDIUM',
  'In Arithmetico-Geometric Series, the value of the definite integral ∫[0 to π/2] (sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))) dx is:', 'By King''s property, 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.',
  'PYQ', 2023, 'Shift 2', 'JEE MAIN-2023-MATH-Q4', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'b6ca9f08-6193-4925-ae2f-b035407ef13e', 'acc468fe-e079-4964-af32-eacb19177b2a', 'A', 'π/2', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd774925f-6072-42e0-a907-9bf4d97f3e58', 'acc468fe-e079-4964-af32-eacb19177b2a', 'B', 'π/4', TRUE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '5406525d-5f64-4efc-a668-c7e5b2b3f61e', 'acc468fe-e079-4964-af32-eacb19177b2a', 'C', 'π', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'dfab65f4-154d-4fd6-ae54-e27ec5d69277', 'acc468fe-e079-4964-af32-eacb19177b2a', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'b9a17194-2ef9-49fa-ac84-260e775bce12', '11111111-0000-0000-0000-000000000003', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', '3fb45ebb-8a6a-49fc-a29e-1d36022376d5',
  'JEE_ADV', 'SINGLE_MCQ', 'HARD',
  'For a square matrix A of order 3 in General Term in Binomial, if det(A) = 6, then the value of det(2A) is:', 'For an n x n matrix, det(k A) = kⁿ det(A). Here det(2A) = 2³ * 6 = 8 * 6 = 48.',
  'PYQ', 2024, 'Shift 1', 'JEE ADV-2024-MATH-Q5', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'f3c94618-56c8-4eba-a7f8-66fea03913a3', 'b9a17194-2ef9-49fa-ac84-260e775bce12', 'A', '12', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '2ed3e6cd-6412-4d36-a2b3-3c7c4347eeaa', 'b9a17194-2ef9-49fa-ac84-260e775bce12', 'B', '24', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '2efd74ae-1504-4b05-ad3a-1dd44ae16e5c', 'b9a17194-2ef9-49fa-ac84-260e775bce12', 'C', '48', TRUE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '773f5e95-b4f2-4427-a723-ddea1c0933c3', 'b9a17194-2ef9-49fa-ac84-260e775bce12', 'D', '36', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '9967b7a6-3230-4090-adf4-69a3785204d7', '11111111-0000-0000-0000-000000000003', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', 'ef7482b7-887b-478b-a031-67fe4be97c4f',
  'NEET', 'SINGLE_MCQ', 'ADVANCED',
  'The perpendicular distance between the parallel lines 3x + 4y + 10 = 0 and 3x + 4y - 25 = 0 in Greatest Term in Expansion is:', 'Distance d = |C₁ - C₂| / √(A² + B²) = |10 - (-25)| / 5 = 7.',
  'PYQ', 2025, 'Shift 2', 'NEET-2025-MATH-Q6', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '8c81ba61-5979-4c4e-aad6-0349169029be', '9967b7a6-3230-4090-adf4-69a3785204d7', 'A', '14', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '7f6d1cba-537d-4cd5-a107-ac25602812d9', '9967b7a6-3230-4090-adf4-69a3785204d7', 'B', '3.5', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '7ec251f2-4f84-4b1d-aa15-9d4b6691c49c', '9967b7a6-3230-4090-adf4-69a3785204d7', 'C', '10', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '06a59e5e-008e-4759-af7c-962303e4fffd', '9967b7a6-3230-4090-adf4-69a3785204d7', 'D', '7', TRUE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'a33dcf15-6c4e-4c1f-ac89-899be9ef1d74', '11111111-0000-0000-0000-000000000003', '0ce09a69-e927-4935-ad81-fb61a1211695', '49c61b95-7f4a-4e0f-a9bc-4b11f5eb339b',
  'JEE_MAIN', 'SINGLE_MCQ', 'EASY',
  'Evaluating the limit in Equations of Circles & Orthogonality: lim (x → 0) [sin(3x) / tan(3x)] is equal to:', 'Standard limit: lim (x → 0) [sin(ax) / tan(bx)] = a/b = 3/3.',
  'PYQ', 2018, 'Shift 1', 'JEE MAIN-2018-MATH-Q7', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '54581379-ea5d-4dea-a0ab-9ceb410340fb', 'a33dcf15-6c4e-4c1f-ac89-899be9ef1d74', 'A', '3/3', TRUE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '54ef89eb-9b1f-449a-a4dd-fc60dd5638b1', 'a33dcf15-6c4e-4c1f-ac89-899be9ef1d74', 'B', '1', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '63642498-2944-42c9-afdf-45a6a41c684f', 'a33dcf15-6c4e-4c1f-ac89-899be9ef1d74', 'C', '0', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '3e787852-7dbc-4d4c-a0d5-26509580256f', 'a33dcf15-6c4e-4c1f-ac89-899be9ef1d74', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '168faf64-b232-4b9e-aaef-15d2103813a7', '11111111-0000-0000-0000-000000000003', '0ce09a69-e927-4935-ad81-fb61a1211695', 'ef1f55fa-c703-4937-a1a5-1345bf721a39',
  'JEE_ADV', 'SINGLE_MCQ', 'MEDIUM',
  'In Parabola Standard Forms, the value of the definite integral ∫[0 to π/2] (sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))) dx is:', 'By King''s property, 2I = ∫[0 to π/2] 1 dx = π/2 => I = π/4.',
  'PYQ', 2019, 'Shift 2', 'JEE ADV-2019-MATH-Q8', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '403b1717-b8ee-4758-ab46-8adbb2964775', '168faf64-b232-4b9e-aaef-15d2103813a7', 'A', 'π/2', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'f0a0603f-93f1-4f51-a529-417025ff60b9', '168faf64-b232-4b9e-aaef-15d2103813a7', 'B', 'π/4', TRUE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '9725ade7-a415-4422-a88d-fbbf8d82fb94', '168faf64-b232-4b9e-aaef-15d2103813a7', 'C', 'π', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'ee05d2e5-032b-4182-a8e3-0e53e085db9d', '168faf64-b232-4b9e-aaef-15d2103813a7', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '70f6c01d-5c2b-4292-aca4-2b9c2baefa87', '11111111-0000-0000-0000-000000000003', '0ce09a69-e927-4935-ad81-fb61a1211695', '0b8591f4-f3d7-437c-a0c1-a2fd59409bee',
  'NEET', 'SINGLE_MCQ', 'HARD',
  'For a square matrix A of order 3 in Ellipse & Hyperbola Tangents, if det(A) = 4, then the value of det(2A) is:', 'For an n x n matrix, det(k A) = kⁿ det(A). Here det(2A) = 2³ * 4 = 8 * 4 = 32.',
  'PYQ', 2020, 'Shift 1', 'NEET-2020-MATH-Q9', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '69e4b6db-57bf-42fe-a450-41b07e533b39', '70f6c01d-5c2b-4292-aca4-2b9c2baefa87', 'A', '8', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '0f990e49-1486-4b8c-a52c-e4da0fa899db', '70f6c01d-5c2b-4292-aca4-2b9c2baefa87', 'B', '16', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '9f41ea1d-7627-4316-acb9-940418ad778d', '70f6c01d-5c2b-4292-aca4-2b9c2baefa87', 'C', '32', TRUE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '5554d1c8-72eb-425e-a322-ab4eae3299b0', '70f6c01d-5c2b-4292-aca4-2b9c2baefa87', 'D', '24', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  'e69e4dc1-88cd-47bb-a954-79e44328b452', '11111111-0000-0000-0000-000000000003', '0ce09a69-e927-4935-ad81-fb61a1211695', '3ed57c85-2c60-48c4-aa5b-d4634fafc489',
  'JEE_MAIN', 'SINGLE_MCQ', 'ADVANCED',
  'The perpendicular distance between the parallel lines 3x + 4y + 30 = 0 and 3x + 4y - 25 = 0 in Eccentricity Calculations is:', 'Distance d = |C₁ - C₂| / √(A² + B²) = |30 - (-25)| / 5 = 11.',
  'PYQ', 2021, 'Shift 2', 'JEE MAIN-2021-MATH-Q10', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '114091d4-2996-4fe3-aa61-a2ec1c77a65a', 'e69e4dc1-88cd-47bb-a954-79e44328b452', 'A', '22', FALSE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'd535c037-0174-43ff-ad0f-30d13d69c3bb', 'e69e4dc1-88cd-47bb-a954-79e44328b452', 'B', '5.5', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '559ae881-cf0c-4c86-ad0b-99008e925c21', 'e69e4dc1-88cd-47bb-a954-79e44328b452', 'C', '14', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'ec1777b1-fdd5-4388-afef-af9f3d500f9c', 'e69e4dc1-88cd-47bb-a954-79e44328b452', 'D', '11', TRUE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.questions (
  id, subject_id, chapter_id, topic_id, exam_type, question_type, difficulty,
  content_latex, explanation_latex, source_type, pyq_year, pyq_shift, source_reference, status, is_active
) VALUES (
  '6c618c15-7601-40b2-a0c8-8317bfa95fc9', '11111111-0000-0000-0000-000000000003', 'c802774f-4126-4903-a5dd-95bd24b982d0', 'bf6fba9f-30c5-4d42-a2b5-0b4a4822df4c',
  'JEE_ADV', 'SINGLE_MCQ', 'EASY',
  'Evaluating the limit in Dot and Cross Products: lim (x → 0) [sin(2x) / tan(3x)] is equal to:', 'Standard limit: lim (x → 0) [sin(ax) / tan(bx)] = a/b = 2/3.',
  'PYQ', 2022, 'Shift 1', 'JEE ADV-2022-MATH-Q11', 'APPROVED', TRUE
) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'b5bd1206-6c14-4208-a1aa-25403bf77884', '6c618c15-7601-40b2-a0c8-8317bfa95fc9', 'A', '2/3', TRUE, 1
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '0e81ee1c-f923-45d9-afbd-d33e9a39634f', '6c618c15-7601-40b2-a0c8-8317bfa95fc9', 'B', '3/2', FALSE, 2
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  'f407aff7-bc64-49a6-a8bc-58840497a1b6', '6c618c15-7601-40b2-a0c8-8317bfa95fc9', 'C', '1', FALSE, 3
) ON CONFLICT (question_id, option_key) DO NOTHING;
INSERT INTO public.question_options (
  id, question_id, option_key, content_latex, is_correct, order_index
) VALUES (
  '6d54b3b0-49ee-44e8-a64a-56436b76384c', '6c618c15-7601-40b2-a0c8-8317bfa95fc9', 'D', '0', FALSE, 4
) ON CONFLICT (question_id, option_key) DO NOTHING;
