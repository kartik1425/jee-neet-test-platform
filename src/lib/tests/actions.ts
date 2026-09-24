"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import {
  TestDraftSchema,
  TestAssignmentSchema,
  validateTestForPublication,
  TestDetail,
} from "@/types/tests";
import { TestStatus } from "@/types/database";
import { revalidatePath } from "next/cache";

function getDbClient(fallbackSupabase: any) {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return createAdminClient();
    }
  } catch {
    // Fallback
  }
  return fallbackSupabase;
}

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
  const dbClient = getDbClient(supabase);

  let query = dbClient.from("tests").select(
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
  const dbClient = getDbClient(supabase);

  const { data: test, error: testErr } = await dbClient
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
  const dbClient = getDbClient(supabase);

  const { data: test, error: err } = await dbClient
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
  const dbClient = getDbClient(supabase);

  const { error: err } = await dbClient
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
  const dbClient = getDbClient(supabase);

  // Check test status
  const { data: test } = await dbClient
    .from("tests")
    .select("status, total_marks")
    .eq("id", testId)
    .single();

  if (!test || (test.status !== "DRAFT" && test.status !== "PUBLISHED")) {
    return { success: false, error: "Cannot modify questions for a LIVE or COMPLETED test." };
  }

  // Check duplicate
  const { data: existing } = await dbClient
    .from("test_questions")
    .select("id")
    .eq("test_id", testId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "This question is already included in this test." };
  }

  // Get current order count
  const { count } = await dbClient
    .from("test_questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId);

  const nextOrder = (count || 0) + 1;

  const { error: insertErr } = await dbClient.from("test_questions").insert({
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
  await dbClient
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
  const dbClient = getDbClient(supabase);

  // Check test status
  const { data: test } = await dbClient
    .from("tests")
    .select("status")
    .eq("id", testId)
    .single();

  if (!test || test.status === "LIVE" || test.status === "COMPLETED") {
    return { success: false, error: "Cannot delete questions from a LIVE or COMPLETED test." };
  }

  const { data: tq } = await dbClient
    .from("test_questions")
    .select("marks")
    .eq("id", testQuestionId)
    .single();

  const { error: delErr } = await dbClient
    .from("test_questions")
    .delete()
    .eq("id", testQuestionId);

  if (delErr) {
    return { success: false, error: delErr.message };
  }

  // Recalculate total marks
  if (tq) {
    const { data: allQuestions } = await dbClient
      .from("test_questions")
      .select("marks")
      .eq("test_id", testId);

    const newTotal = (allQuestions || []).reduce((acc: number, q: any) => acc + (Number(q.marks) || 0), 0);
    await dbClient.from("tests").update({ total_marks: newTotal }).eq("id", testId);
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
  const dbClient = getDbClient(supabase);

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
      options: (q.options || []).map((opt: any) => ({
        id: opt.id,
        option_key: opt.option_key,
        content_latex: opt.content_latex,
        is_correct: opt.is_correct,
      })),
    };

    await dbClient
      .from("test_questions")
      .update({ snapshot_data: snapshot })
      .eq("id", tq.id);
  }

  const newStatus: TestStatus = testDetail.start_time ? "SCHEDULED" : "PUBLISHED";

  const { error: pubErr } = await dbClient
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
  const dbClient = getDbClient(supabase);

  const { error: assignErr } = await dbClient.from("test_assignments").insert({
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
  const dbClient = getDbClient(supabase);

  const { error: assignErr } = await dbClient.from("test_assignments").insert({
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
  const dbClient = getDbClient(supabase);

  const { error: archErr } = await dbClient
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

/**
 * AI Multimodal Extraction of Questions from PDF or Camera Photo.
 */
export async function extractQuestionsFromMediaAction(
  base64Data: string,
  mimeType: string,
  context?: { examType?: string; defaultSubject?: string }
) {
  await requireRole(["TEACHER", "ADMIN"]);
  const { getAIProvider } = await import("@/lib/ai");
  const { MockAIProvider } = await import("@/lib/ai/mockAdapter");

  try {
    const aiProvider = getAIProvider();
    const questions = await aiProvider.extractQuestionsFromMedia(base64Data, mimeType, context);
    return { success: true, questions };
  } catch (err: any) {
    console.warn("AI Multimodal extraction fallback to MockAIProvider:", err?.message);
    const mock = new MockAIProvider();
    const questions = await mock.extractQuestionsFromMedia(base64Data, mimeType, context);
    return { success: true, questions, isFallback: true };
  }
}

/**
 * Bulk create newly extracted questions and link them directly to a test.
 */
export async function createAndAddBulkQuestionsToTestAction(
  testId: string,
  extractedQuestions: any[]
) {
  const session = await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  if (!extractedQuestions || extractedQuestions.length === 0) {
    return { success: false, error: "No questions provided." };
  }

  // Fetch Subject and Chapter mappings
  const { data: subjects } = await dbClient.from("subjects").select("id, name");
  const { data: chapters } = await dbClient.from("chapters").select("id, name, subject_id");

  const defaultSubj = subjects?.[0]?.id || "11111111-0000-0000-0000-000000000001";
  const defaultChap = chapters?.[0]?.id || "754cf45c-0d59-4879-a1a0-a73723ee7903";

  // Fetch current test max order_index
  const { data: currentTq } = await dbClient
    .from("test_questions")
    .select("order_index, marks, negative_marks")
    .eq("test_id", testId)
    .order("order_index", { ascending: false })
    .limit(1);

  let nextOrderIndex = (currentTq?.[0]?.order_index || 0) + 1;
  const marksPerQ = currentTq?.[0]?.marks || 4;
  const negMarksPerQ = currentTq?.[0]?.negative_marks ?? -1;

  let addedCount = 0;

  for (const eq of extractedQuestions) {
    // Match subject by name
    const matchedSubj = subjects?.find(
      (s: any) => s.name.toLowerCase() === (eq.suggested_subject_name || "").toLowerCase()
    );
    const subjectId = matchedSubj ? matchedSubj.id : defaultSubj;

    // Match chapter by name
    const matchedChap = chapters?.find(
      (c: any) =>
        c.subject_id === subjectId &&
        c.name.toLowerCase().includes((eq.suggested_chapter_name || "").toLowerCase().slice(0, 5))
    );
    const chapterId = matchedChap ? matchedChap.id : defaultChap;

    // 1. Insert Question
    const { data: newQ, error: qErr } = await dbClient
      .from("questions")
      .insert({
        content_latex: eq.question_latex,
        explanation_latex: eq.explanation_latex || null,
        subject_id: subjectId,
        chapter_id: chapterId,
        difficulty: eq.difficulty || "MEDIUM",
        exam_type: eq.exam_type || "JEE_MAIN",
        source_type: "INSTITUTE",
        status: "APPROVED",
        is_active: true,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (qErr || !newQ) {
      console.error("Error creating extracted question:", qErr);
      continue;
    }

    // 2. Insert Options
    const optionsToInsert = (eq.options || []).map((opt: any, idx: number) => ({
      question_id: newQ.id,
      option_key: opt.option_key || ["A", "B", "C", "D"][idx],
      content_latex: opt.contentLatex || opt.content_latex || `Option ${opt.option_key}`,
      is_correct: Boolean(opt.is_correct || opt.option_key === eq.correct_option_key),
      order_index: idx + 1,
    }));

    const { data: savedOptions } = await dbClient
      .from("question_options")
      .insert(optionsToInsert)
      .select();

    // 3. Link to test_questions with snapshot
    const snapshot = {
      content_latex: newQ.content_latex,
      explanation_latex: newQ.explanation_latex,
      source_reference: `Teacher Extracted • ${new Date().toLocaleDateString()}`,
      options: (savedOptions || optionsToInsert).map((o: any) => ({
        id: o.id || `opt-${o.option_key}`,
        option_key: o.option_key,
        content_latex: o.content_latex,
        is_correct: o.is_correct,
      })),
    };

    await dbClient.from("test_questions").insert({
      test_id: testId,
      question_id: newQ.id,
      order_index: nextOrderIndex++,
      marks: marksPerQ,
      negative_marks: negMarksPerQ,
      snapshot_data: snapshot,
    });

    addedCount++;
  }

  // Update total marks on test
  const { data: allTq } = await dbClient
    .from("test_questions")
    .select("marks")
    .eq("test_id", testId);

  const newTotalMarks = (allTq || []).reduce((acc: number, cur: any) => acc + (Number(cur.marks) || 4), 0);
  await dbClient
    .from("tests")
    .update({ total_marks: newTotalMarks, updated_at: new Date().toISOString() })
    .eq("id", testId);

  revalidatePath(`/admin/tests/${testId}`);
  revalidatePath("/admin/tests");
  return { success: true, addedCount, newTotalMarks };
}

/**
 * Teacher & Admin Student Marks and Attendance Roster.
 */
export async function getTestAttendanceAndMarksAction(testId: string) {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();
  const dbClient = getDbClient(supabase);

  // 1. Fetch Test Details
  const { data: test, error: tErr } = await dbClient
    .from("tests")
    .select("id, title, duration_minutes, total_marks, exam_type, status, start_time, end_time, marking_scheme")
    .eq("id", testId)
    .single();

  if (tErr || !test) {
    return { success: false, error: "Test not found." };
  }

  // 2. Fetch all direct assignments and class assignments
  const { data: assignments } = await dbClient
    .from("test_assignments")
    .select(`
      id, class_id, student_id, due_at,
      classes(id, name, class_members(student_id, profiles(id, full_name, email))),
      profiles(id, full_name, email)
    `)
    .eq("test_id", testId);

  const assignedStudentMap = new Map<string, { id: string; fullName: string; email: string; className?: string }>();

  (assignments || []).forEach((a: any) => {
    if (a.student_id && a.profiles) {
      assignedStudentMap.set(a.student_id, {
        id: a.profiles.id,
        fullName: a.profiles.full_name,
        email: a.profiles.email,
        className: "Direct Assigned",
      });
    }
    if (a.classes && a.classes.class_members) {
      a.classes.class_members.forEach((cm: any) => {
        if (cm.profiles && !assignedStudentMap.has(cm.student_id)) {
          assignedStudentMap.set(cm.student_id, {
            id: cm.profiles.id,
            fullName: cm.profiles.full_name,
            email: cm.profiles.email,
            className: a.classes.name,
          });
        }
      });
    }
  });

  // 3. Fetch all attempts and test_results for this test
  const { data: attempts } = await dbClient
    .from("attempts")
    .select(`
      id, student_id, status, started_at, submitted_at, time_spent_seconds, total_score, accuracy_percentage,
      profiles(id, full_name, email),
      test_results(
        id, total_score, maximum_score, attempted_count, correct_count, incorrect_count, unattempted_count, accuracy_percentage, total_time_spent_seconds
      )
    `)
    .eq("test_id", testId);

  const studentSubmissions: any[] = [];
  const studentAttemptIds = new Set<string>();

  (attempts || []).forEach((att: any) => {
    studentAttemptIds.add(att.student_id);
    const stu = att.profiles || assignedStudentMap.get(att.student_id) || {
      id: att.student_id,
      fullName: "Student",
      email: "Unknown",
    };

    const tr = Array.isArray(att.test_results) ? att.test_results[0] : att.test_results;

    studentSubmissions.push({
      attemptId: att.id,
      studentId: att.student_id,
      studentName: stu.full_name || stu.fullName || "Student",
      studentEmail: stu.email || "Unknown",
      status: att.status,
      startedAt: att.started_at,
      submittedAt: att.submitted_at,
      totalScore: tr ? Number(tr.total_score) : Number(att.total_score) || 0,
      maximumScore: tr ? Number(tr.maximum_score) : Number(test.total_marks) || 0,
      accuracyPercentage: tr ? Number(tr.accuracy_percentage) : Number(att.accuracy_percentage) || 0,
      attemptedCount: tr?.attempted_count || 0,
      correctCount: tr?.correct_count || 0,
      incorrectCount: tr?.incorrect_count || 0,
      unattemptedCount: tr?.unattempted_count || 0,
      timeSpentMinutes: Math.round((tr?.total_time_spent_seconds || att.time_spent_seconds || 0) / 60),
    });
  });

  // 4. Derive Absent Students
  const absentStudents: any[] = [];
  assignedStudentMap.forEach((stu, sId) => {
    if (!studentAttemptIds.has(sId)) {
      absentStudents.push({
        studentId: sId,
        studentName: stu.fullName,
        studentEmail: stu.email,
        className: stu.className,
        status: "ABSENT",
      });
    }
  });

  return {
    success: true,
    test,
    totalAssigned: assignedStudentMap.size,
    totalSubmitted: studentSubmissions.filter((s) => s.status === "SUBMITTED" || s.status === "AUTO_SUBMITTED").length,
    totalInProgress: studentSubmissions.filter((s) => s.status === "IN_PROGRESS").length,
    totalAbsent: absentStudents.length,
    submissions: studentSubmissions,
    absentStudents,
  };
}
