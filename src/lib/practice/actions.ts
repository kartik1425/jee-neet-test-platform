"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import {
  SelfTestConfigSchema,
  SelfTestConfig,
  QuestionPoolAvailabilityResult,
  GenerateSelfTestOutput,
  SelfTestSummaryDetails,
  SelfTestTaxonomySubject,
} from "@/types/practice";
import {
  executeQuestionSelection,
  CandidateQuestionWithProvenance,
  filterCandidateQuestions,
  categorizeQuestionsByPriority,
} from "./selectionEngine";
import { revalidatePath } from "next/cache";

function getDbClient(fallbackSupabase: any) {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return createAdminClient();
    }
  } catch {
    // Fallback to user session supabase
  }
  return fallbackSupabase;
}

/**
 * Fetch Taxonomy (Subjects, Chapters, Topics) filtered for the chosen Exam Type.
 */
export async function getPracticeTaxonomyAction(examType: "JEE_MAIN" | "JEE_ADV" | "NEET"): Promise<SelfTestTaxonomySubject[]> {
  const supabase = await createClient();

  // 1. Fetch Subjects
  const { data: subjects, error: subjErr } = await supabase
    .from("subjects")
    .select("id, name, code")
    .order("name");

  if (subjErr || !subjects) {
    return [];
  }

  // Filter subjects according to exam (NEET excludes Math, JEE excludes Biology)
  const isNeet = examType === "NEET";
  const validSubjects = subjects.filter((s) => {
    const lower = s.name.toLowerCase();
    if (isNeet) {
      return !lower.includes("math");
    } else {
      return !lower.includes("bio") && !lower.includes("botany") && !lower.includes("zoology");
    }
  });

  const subjectIds = validSubjects.map((s) => s.id);

  // 2. Fetch Chapters for valid subjects
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, subject_id, name, order_index")
    .in("subject_id", subjectIds)
    .order("order_index");

  const chapterIds = (chapters || []).map((c) => c.id);

  // 3. Fetch Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, chapter_id, name, order_index")
    .in("chapter_id", chapterIds)
    .order("order_index");

  // Group into hierarchy
  const topicMapByChapter = new Map<string, { id: string; name: string }[]>();
  (topics || []).forEach((t) => {
    const list = topicMapByChapter.get(t.chapter_id) || [];
    list.push({ id: t.id, name: t.name });
    topicMapByChapter.set(t.chapter_id, list);
  });

  const chapterMapBySubject = new Map<string, any[]>();
  (chapters || []).forEach((c) => {
    const list = chapterMapBySubject.get(c.subject_id) || [];
    list.push({
      id: c.id,
      name: c.name,
      topics: topicMapByChapter.get(c.id) || [],
    });
    chapterMapBySubject.set(c.subject_id, list);
  });

  return validSubjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    chapters: chapterMapBySubject.get(s.id) || [],
  }));
}

/**
 * Check Qualifying Question Pool Availability & Uniqueness.
 */
export async function checkPracticePoolAvailabilityAction(
  rawConfig: SelfTestConfig
): Promise<QuestionPoolAvailabilityResult> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const studentId = session.user.id;
  const parsed = SelfTestConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    throw new Error("Invalid practice configuration parameters.");
  }

  const config = parsed.data;
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  // 1. Fetch Candidate Questions matching taxonomy & approved PYQ status
  let query = dbClient
    .from("questions")
    .select(`
      *,
      question_options (*)
    `)
    .in("subject_id", config.subjectIds)
    .in("chapter_id", config.chapterIds)
    .eq("status", "APPROVED")
    .eq("is_active", true);

  if (config.examType === "JEE_ADV") {
    query = query.or("exam_type.eq.JEE_ADV,exam_type.eq.JEE_ADVANCED");
  } else {
    query = query.eq("exam_type", config.examType);
  }

  const { data: candidateRows } = await query;

  const candidates: CandidateQuestionWithProvenance[] = (candidateRows || []).map((q: any) => ({
    ...q,
    options: (q.question_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  // 2. Fetch Student's Previous Attempt Responses (to detect attempted question IDs)
  const { data: attemptRows } = await supabase
    .from("attempts")
    .select("id")
    .eq("student_id", studentId);

  const attemptIds = (attemptRows || []).map((a) => a.id);
  let attemptedQuestionIds = new Set<string>();

  if (attemptIds.length > 0) {
    const { data: answers } = await supabase
      .from("answers")
      .select("question_id")
      .in("attempt_id", attemptIds);

    attemptedQuestionIds = new Set((answers || []).map((a) => a.question_id));
  }

  // 3. Fetch Student's Recent Self-Tests (created in last 14 days)
  const { data: recentSelfTests } = await supabase
    .from("tests")
    .select("id")
    .eq("created_by", studentId)
    .eq("test_mode", "PRACTICE_SELF");

  const selfTestIds = (recentSelfTests || []).map((t) => t.id);
  let recentSelfTestQuestionIds = new Set<string>();

  if (selfTestIds.length > 0) {
    const { data: tqs } = await supabase
      .from("test_questions")
      .select("question_id")
      .in("test_id", selfTestIds);

    recentSelfTestQuestionIds = new Set((tqs || []).map((tq) => tq.question_id));
  }

  // 4. Run Filter
  const eligible = filterCandidateQuestions(candidates, config);
  const buckets = categorizeQuestionsByPriority(eligible, attemptedQuestionIds, recentSelfTestQuestionIds);

  const totalEligibleCount = eligible.length;
  const unusedEligibleCount = buckets.priority1_neverAttempted.length + buckets.priority2_recentSelfTestExcluded.length;
  const previouslyAttemptedCount = buckets.priority3_previouslyAttempted.length;

  const subjectCounts: Record<string, { total: number; unused: number }> = {};
  config.subjectIds.forEach((sId) => {
    const subEligible = eligible.filter((q) => q.subject_id === sId);
    const subUnused = subEligible.filter(
      (q) => !attemptedQuestionIds.has(q.id) && !recentSelfTestQuestionIds.has(q.id)
    );
    subjectCounts[sId] = { total: subEligible.length, unused: subUnused.length };
  });

  const difficultyCounts: Record<string, number> = {};
  ["EASY", "MEDIUM", "HARD", "ADVANCED"].forEach((diff) => {
    difficultyCounts[diff] = eligible.filter((q) => q.difficulty === diff).length;
  });

  return {
    totalEligibleCount,
    unusedEligibleCount,
    previouslyAttemptedCount,
    requestedCount: config.questionCount,
    isSufficient: config.allowPreviouslyAttempted
      ? totalEligibleCount >= config.questionCount
      : unusedEligibleCount >= config.questionCount,
    subjectCounts,
    difficultyCounts,
  };
}

/**
 * Generate a Private Practice Test with Frozen Question Snapshot.
 */
export async function generateSelfPracticeTestAction(
  rawConfig: SelfTestConfig
): Promise<GenerateSelfTestOutput> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const studentId = session.user.id;
  const parsed = SelfTestConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    return {
      success: false,
      error: `Validation error: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const config = parsed.data;
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  // 1. Fetch Candidate Questions
  let candQuery = dbClient
    .from("questions")
    .select(`
      *,
      subjects!questions_subject_id_fkey(name),
      chapters!questions_chapter_id_fkey(name),
      question_options (*)
    `)
    .in("subject_id", config.subjectIds)
    .in("chapter_id", config.chapterIds)
    .eq("status", "APPROVED")
    .eq("is_active", true);

  if (config.examType === "JEE_ADV") {
    candQuery = candQuery.or("exam_type.eq.JEE_ADV,exam_type.eq.JEE_ADVANCED");
  } else {
    candQuery = candQuery.eq("exam_type", config.examType);
  }

  const { data: candidateRows, error: candErr } = await candQuery;

  if (candErr || !candidateRows) {
    return { success: false, error: "Failed to retrieve questions from question bank." };
  }

  const candidates: CandidateQuestionWithProvenance[] = candidateRows.map((q: any) => ({
    ...q,
    subject_name: q.subjects?.name,
    chapter_name: q.chapters?.name,
    options: (q.question_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  // 2. Fetch Student Previous History
  const { data: attemptRows } = await supabase
    .from("attempts")
    .select("id")
    .eq("student_id", studentId);

  const attemptIds = (attemptRows || []).map((a) => a.id);
  let attemptedQuestionIds = new Set<string>();

  if (attemptIds.length > 0) {
    const { data: answers } = await supabase
      .from("answers")
      .select("question_id")
      .in("attempt_id", attemptIds);

    attemptedQuestionIds = new Set((answers || []).map((a) => a.question_id));
  }

  const { data: recentSelfTests } = await supabase
    .from("tests")
    .select("id")
    .eq("created_by", studentId)
    .eq("test_mode", "PRACTICE_SELF");

  const selfTestIds = (recentSelfTests || []).map((t) => t.id);
  let recentSelfTestQuestionIds = new Set<string>();

  if (selfTestIds.length > 0) {
    const { data: tqs } = await supabase
      .from("test_questions")
      .select("question_id")
      .in("test_id", selfTestIds);

    recentSelfTestQuestionIds = new Set((tqs || []).map((tq) => tq.question_id));
  }

  // 3. Execute Selection Algorithm
  const selectionResult = executeQuestionSelection(
    candidates,
    config,
    attemptedQuestionIds,
    recentSelfTestQuestionIds
  );

  if (!selectionResult.isSufficient && selectionResult.shortageDetails) {
    return {
      success: false,
      error: selectionResult.shortageDetails.message,
      shortageDetails: selectionResult.shortageDetails,
    };
  }

  const selectedQuestions = selectionResult.selectedQuestions;

  // 4. Generate Meaningful Title
  const examName = config.examType.replace("_", " ");
  const title =
    config.customTitle && config.customTitle.trim().length >= 3
      ? config.customTitle.trim()
      : `${examName} Practice (${selectedQuestions.length} PYQs) — ${new Date().toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        )}`;

  // 5. Create Private Test in Database
  const { data: newTest, error: testErr } = await supabase
    .from("tests")
    .insert({
      title,
      description: `Private self-practice paper generated from verified PYQs (${config.yearStart || 2018}-${config.yearEnd || 2026}).`,
      instructions: "NTA Examination Standard: +4 for correct, -1 for incorrect, 0 for unattempted.",
      exam_type: config.examType,
      test_mode: "PRACTICE_SELF",
      duration_minutes: config.durationMinutes,
      total_marks: selectedQuestions.length * 4,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      status: "PUBLISHED", // Ready to take immediately
      created_by: studentId,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (testErr || !newTest) {
    return { success: false, error: testErr?.message || "Failed to create practice test paper." };
  }

  // 6. Insert Question Snapshots (Frozen Immutability)
  const testQuestionsPayload = selectedQuestions.map((q, idx) => {
    const snapshot = {
      content_latex: q.content_latex,
      explanation_latex: q.explanation_latex,
      pyq_year: q.pyq_year,
      pyq_shift: q.pyq_shift,
      source_reference: q.source_reference,
      options: q.options.map((opt) => ({
        id: opt.id,
        option_key: opt.option_key,
        content_latex: opt.content_latex,
        is_correct: opt.is_correct,
      })),
    };

    return {
      test_id: newTest.id,
      question_id: q.id,
      order_index: idx + 1,
      marks: 4,
      negative_marks: -1,
      snapshot_data: snapshot,
    };
  });

  const { error: insertTqErr } = await dbClient
    .from("test_questions")
    .insert(testQuestionsPayload);

  if (insertTqErr) {
    return { success: false, error: `Failed to attach questions: ${insertTqErr.message}` };
  }

  revalidatePath("/student");
  return {
    success: true,
    testId: newTest.id,
  };
}

/**
 * Fetch Self-Test Summary for Pre-Start Review.
 */
export async function getSelfTestSummaryAction(testId: string): Promise<SelfTestSummaryDetails | null> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const studentId = session.user.id;
  const supabase = await createClient();

  const { data: test, error } = await supabase
    .from("tests")
    .select(`
      id, title, exam_type, duration_minutes, total_marks, marking_scheme, created_by, created_at,
      test_questions (
        id, snapshot_data,
        questions (
          difficulty, pyq_year, pyq_shift,
          subjects!questions_subject_id_fkey(name),
          chapters!questions_chapter_id_fkey(name)
        )
      )
    `)
    .eq("id", testId)
    .single();

  if (error || !test) {
    return null;
  }

  // Authorization check: Student must own the test if it is PRACTICE_SELF
  if (session.profile.role === "STUDENT" && test.created_by !== studentId) {
    throw new Error("Unauthorized to view this practice test.");
  }

  const subjectsSet = new Set<string>();
  const chaptersSet = new Set<string>();
  const yearsSet = new Set<number>();
  let difficulty = "Mixed";

  (test.test_questions || []).forEach((tq: any) => {
    const q = tq.questions;
    if (q) {
      if (q.subjects?.name) subjectsSet.add(q.subjects.name);
      if (q.chapters?.name) chaptersSet.add(q.chapters.name);
      if (q.pyq_year) yearsSet.add(q.pyq_year);
      if (q.difficulty) difficulty = q.difficulty;
    }
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
  const pyqYearsSummary =
    sortedYears.length > 1
      ? `${sortedYears[0]}–${sortedYears[sortedYears.length - 1]}`
      : sortedYears.length === 1
      ? `${sortedYears[0]}`
      : null;

  return {
    id: test.id,
    title: test.title,
    examType: test.exam_type,
    durationMinutes: test.duration_minutes,
    totalMarks: Number(test.total_marks) || 0,
    markingScheme: test.marking_scheme,
    difficulty,
    pyqYearsSummary,
    subjectsSummary: Array.from(subjectsSet),
    chaptersSummary: Array.from(chaptersSet),
    questionCount: test.test_questions?.length || 0,
    createdAt: test.created_at,
  };
}
