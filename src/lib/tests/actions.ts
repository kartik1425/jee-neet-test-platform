"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import {
  TestDraftSchema,
  TestAssignmentSchema,
  validateTestForPublication,
  TestDetail,
} from "@/types/tests";
import { TestStatus } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface TestListParams {
  page?: number;
  limit?: number;
  examType?: string;
  status?: string;
  search?: string;
}

/**
 * Fetch Paginated Tests List for Admin & Teacher console.
 */
export async function getAdminTestsList(params: TestListParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  let query = supabase.from("tests").select(
    `
      *,
      test_questions(count),
      test_assignments(count),
      attempts(count)
    `,
    { count: "exact" }
  );

  if (params.examType && params.examType !== "ALL") {
    query = query.eq("exam_type", params.examType);
  }
  if (params.status && params.status !== "ALL") {
    query = query.eq("status", params.status);
  }
  if (params.search && params.search.trim() !== "") {
    query = query.ilike("title", `%${params.search.trim()}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error("Error fetching tests list:", error);
    return {
      tests: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const now = Date.now();
  const tests = data.map((t: any) => {
    let computedStatus: TestStatus = t.status;
    if (t.status === "SCHEDULED" || t.status === "PUBLISHED") {
      const startTime = t.start_time ? new Date(t.start_time).getTime() : null;
      const endTime = t.end_time ? new Date(t.end_time).getTime() : null;

      if (startTime && now >= startTime && (!endTime || now <= endTime)) {
        computedStatus = "LIVE";
      } else if (endTime && now > endTime) {
        computedStatus = "COMPLETED";
      }
    }

    return {
      ...t,
      status: computedStatus,
      question_count: t.test_questions?.[0]?.count || 0,
      assignment_count: t.test_assignments?.[0]?.count || 0,
      attempt_count: t.attempts?.[0]?.count || 0,
    };
  });

  const total = count || 0;
  return {
    tests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Fetch Complete Test Detail for Admin Editor / Preview / Assign.
 */
export async function getTestDetailForAdmin(testId: string): Promise<TestDetail | null> {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: test, error: testErr } = await supabase
    .from("tests")
    .select(`
      *,
      test_sections (*),
      test_questions (
        id, question_id, section_id, order_index, marks, negative_marks, snapshot_data,
        questions (
          id, content_latex, explanation_latex, subject_id, chapter_id, topic_id,
          status, difficulty, exam_type, source_type, pyq_year, pyq_shift,
          question_options (id, option_key, content_latex, is_correct, order_index)
        )
      ),
      test_assignments (
        id, class_id, student_id, assigned_at, due_at,
        classes(name),
        profiles(full_name)
      )
    `)
    .eq("id", testId)
    .single();

  if (testErr || !test) {
    return null;
  }

  const formattedQuestions = (test.test_questions || [])
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((tq: any) => ({
      id: tq.id,
      question_id: tq.question_id,
      section_id: tq.section_id,
      section_name: (test.test_sections || []).find((s: any) => s.id === tq.section_id)?.name || "General",
      order_index: tq.order_index,
      marks: Number(tq.marks) || 4,
      negative_marks: Number(tq.negative_marks) || -1,
      question: {
        ...tq.questions,
        options: (tq.questions?.question_options || []).sort(
          (a: any, b: any) => a.order_index - b.order_index
        ),
      },
    }));

  const formattedAssignments = (test.test_assignments || []).map((ta: any) => ({
    id: ta.id,
    class_id: ta.class_id,
    class_name: ta.classes?.name,
    student_id: ta.student_id,
    student_name: ta.profiles?.full_name,
    assigned_at: ta.assigned_at,
    due_at: ta.due_at,
  }));

  return {
    ...test,
    sections: test.test_sections || [],
    questions: formattedQuestions,
    assignments: formattedAssignments,
  };
}

/**
 * Create a new Test in DRAFT status.
 */
export async function createTestDraftAction(rawData: any) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const parsed = TestDraftSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, description, instructions, examType, testMode, durationMinutes, markingScheme, startTime, endTime } = parsed.data;
  const supabase = await createClient();

  const { data: test, error: err } = await supabase
    .from("tests")
    .insert({
      title,
      description: description || null,
      instructions: instructions || null,
      exam_type: examType,
      test_mode: testMode,
      duration_minutes: durationMinutes,
      total_marks: 0, // Will recalculate as questions are added
      marking_scheme: markingScheme,
      status: "DRAFT",
      start_time: startTime || null,
      end_time: endTime || null,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (err || !test) {
    return { success: false, error: err?.message || "Failed to create test draft." };
  }

  revalidatePath("/admin/tests");
  return { success: true, testId: test.id };
}

/**
 * Update Test Metadata.
 */
export async function updateTestDraftAction(testId: string, rawData: any) {
  await requireRole(["TEACHER", "ADMIN"]);
  const parsed = TestDraftSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, description, instructions, examType, testMode, durationMinutes, markingScheme, startTime, endTime } = parsed.data;
  const supabase = await createClient();

  const { error: err } = await supabase
    .from("tests")
    .update({
      title,
      description: description || null,
      instructions: instructions || null,
      exam_type: examType,
      test_mode: testMode,
      duration_minutes: durationMinutes,
      marking_scheme: markingScheme,
      start_time: startTime || null,
      end_time: endTime || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId);

  if (err) {
    return { success: false, error: err.message };
  }

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

/**
 * Add a Question to a Test Draft.
 */
export async function addQuestionToTestAction(
  testId: string,
  questionId: string,
  sectionId?: string | null,
  marks = 4,
  negativeMarks = -1
) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  // Check test status
  const { data: test } = await supabase
    .from("tests")
    .select("status, total_marks")
    .eq("id", testId)
    .single();

  if (!test || (test.status !== "DRAFT" && test.status !== "PUBLISHED")) {
    return { success: false, error: "Cannot modify questions for a LIVE or COMPLETED test." };
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("test_questions")
    .select("id")
    .eq("test_id", testId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "This question is already included in this test." };
  }

  // Get current order count
  const { count } = await supabase
    .from("test_questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId);

  const nextOrder = (count || 0) + 1;

  const { error: insertErr } = await supabase.from("test_questions").insert({
    test_id: testId,
    question_id: questionId,
    section_id: sectionId || null,
    order_index: nextOrder,
    marks,
    negative_marks: negativeMarks,
  });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  // Update total marks on test
  await supabase
    .from("tests")
    .update({ total_marks: (test.total_marks || 0) + marks })
    .eq("id", testId);

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

/**
 * Remove a Question from a Test Draft.
 */
export async function removeQuestionFromTestAction(testId: string, testQuestionId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  // Check test status
  const { data: test } = await supabase
    .from("tests")
    .select("status")
    .eq("id", testId)
    .single();

  if (!test || test.status === "LIVE" || test.status === "COMPLETED") {
    return { success: false, error: "Cannot delete questions from a LIVE or COMPLETED test." };
  }

  const { data: tq } = await supabase
    .from("test_questions")
    .select("marks")
    .eq("id", testQuestionId)
    .single();

  const { error: delErr } = await supabase
    .from("test_questions")
    .delete()
    .eq("id", testQuestionId);

  if (delErr) {
    return { success: false, error: delErr.message };
  }

  // Recalculate total marks
  if (tq) {
    const { data: allQuestions } = await supabase
      .from("test_questions")
      .select("marks")
      .eq("test_id", testId);

    const newTotal = (allQuestions || []).reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    await supabase.from("tests").update({ total_marks: newTotal }).eq("id", testId);
  }

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

/**
 * Publish Test: Validates integrity, creates frozen snapshots, and locks the paper.
 */
export async function publishTestAction(testId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const testDetail = await getTestDetailForAdmin(testId);
  if (!testDetail) {
    return { success: false, error: "Test not found." };
  }

  // Run validation
  const validation = validateTestForPublication(testDetail);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Publication validation failed:\n• ${validation.errors.join("\n• ")}`,
    };
  }

  // Freeze immutable snapshot for each question
  for (const tq of testDetail.questions) {
    const q = tq.question;
    const snapshot = {
      content_latex: q.content_latex,
      explanation_latex: q.explanation_latex,
      options: (q.options || []).map((opt) => ({
        id: opt.id,
        option_key: opt.option_key,
        content_latex: opt.content_latex,
        is_correct: opt.is_correct,
      })),
    };

    await supabase
      .from("test_questions")
      .update({ snapshot_data: snapshot })
      .eq("id", tq.id);
  }

  const newStatus: TestStatus = testDetail.start_time ? "SCHEDULED" : "PUBLISHED";

  const { error: pubErr } = await supabase
    .from("tests")
    .update({
      status: newStatus,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId);

  if (pubErr) {
    return { success: false, error: pubErr.message };
  }

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${testId}`);
  return { success: true, status: newStatus };
}

/**
 * Assign Test to a Class.
 */
export async function assignTestToClassAction(testId: string, classId: string, dueAt?: string | null) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { error: assignErr } = await supabase.from("test_assignments").insert({
    test_id: testId,
    class_id: classId,
    assigned_by: session.user.id,
    due_at: dueAt || null,
  });

  if (assignErr) {
    return { success: false, error: assignErr.message };
  }

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

/**
 * Assign Test to an Individual Student.
 */
export async function assignTestToStudentAction(testId: string, studentId: string, dueAt?: string | null) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { error: assignErr } = await supabase.from("test_assignments").insert({
    test_id: testId,
    student_id: studentId,
    assigned_by: session.user.id,
    due_at: dueAt || null,
  });

  if (assignErr) {
    return { success: false, error: assignErr.message };
  }

  revalidatePath(`/admin/tests/${testId}`);
  return { success: true };
}

/**
 * Archive Test Action.
 */
export async function archiveTestAction(testId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { error: archErr } = await supabase
    .from("tests")
    .update({
      status: "ARCHIVED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId);

  if (archErr) {
    return { success: false, error: archErr.message };
  }

  revalidatePath("/admin/tests");
  return { success: true };
}
