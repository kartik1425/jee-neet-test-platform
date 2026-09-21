"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ExamAttemptState, StudentExamQuestion, StudentExamOption } from "@/types/exam";
import { redirect } from "next/navigation";

/**
 * Start a new attempt or resume an existing active attempt for a test.
 */
export async function startOrResumeAttempt(testId: string): Promise<{ attemptId: string }> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const studentId = session.user.id;
  const supabase = await createClient();

  // 1. Check if test exists and is accessible
  const { data: test, error: testErr } = await supabase
    .from("tests")
    .select("id, duration_minutes, status")
    .eq("id", testId)
    .single();

  if (testErr || !test) {
    throw new Error("Test not found or unavailable.");
  }

  // 2. Check for existing active attempt (IN_PROGRESS)
  const { data: existingAttempt } = await supabase
    .from("attempts")
    .select("id, status, server_end_time")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .eq("status", "IN_PROGRESS")
    .maybeSingle();

  if (existingAttempt) {
    // Check if server time has already expired
    const now = Date.now();
    const endTime = new Date(existingAttempt.server_end_time).getTime();
    if (now >= endTime) {
      // Auto-submit expired attempt
      await supabase
        .from("attempts")
        .update({
          status: "AUTO_SUBMITTED",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existingAttempt.id);

      redirect(`/student/results/${existingAttempt.id}`);
    }

    return { attemptId: existingAttempt.id };
  }

  // 3. Create new attempt with authoritative server expiration time
  const durationMs = test.duration_minutes * 60 * 1000;
  const serverEndTime = new Date(Date.now() + durationMs).toISOString();

  const { data: newAttempt, error: createErr } = await supabase
    .from("attempts")
    .insert({
      test_id: testId,
      student_id: studentId,
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      server_end_time: serverEndTime,
      time_spent_seconds: 0,
    })
    .select("id")
    .single();

  if (createErr || !newAttempt) {
    throw new Error(`Failed to initialize exam attempt: ${createErr?.message}`);
  }

  return { attemptId: newAttempt.id };
}

/**
 * Fetch authoritative exam data and questions with student-safe options.
 */
export async function getExamAttemptData(attemptId: string): Promise<ExamAttemptState> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const supabase = await createClient();

  // 1. Fetch Attempt
  const { data: attempt, error: attemptErr } = await supabase
    .from("attempts")
    .select(`
      id, test_id, student_id, status, server_end_time, time_spent_seconds,
      tests (
        id, title, exam_type, duration_minutes, marking_scheme
      )
    `)
    .eq("id", attemptId)
    .single();

  if (attemptErr || !attempt) {
    throw new Error("Attempt not found.");
  }

  // Verify ownership
  if (attempt.student_id !== session.user.id && session.profile.role === "STUDENT") {
    throw new Error("Access denied: You cannot view another student's exam attempt.");
  }

  const testInfo = attempt.tests as any;
  const now = Date.now();
  const endTime = new Date(attempt.server_end_time).getTime();
  const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

  // 2. Fetch Test Questions with Sections
  const { data: testQuestions, error: tqErr } = await supabase
    .from("test_questions")
    .select(`
      id, question_id, section_id, order_index, marks, negative_marks, snapshot_data,
      test_sections(name),
      questions (
        id, content_latex,
        question_options (id, option_key, content_latex, order_index)
      )
    `)
    .eq("test_id", attempt.test_id)
    .order("order_index", { ascending: true });

  if (tqErr || !testQuestions) {
    throw new Error("Failed to load test questions.");
  }

  // Build sanitized questions array (guaranteeing NO is_correct leaks)
  const questions: StudentExamQuestion[] = testQuestions.map((tq: any) => {
    let contentLatex = tq.questions?.content_latex || "";
    let options: StudentExamOption[] = [];

    // Use immutable snapshot if present
    if (tq.snapshot_data && tq.snapshot_data.options) {
      contentLatex = tq.snapshot_data.content_latex;
      options = tq.snapshot_data.options.map((opt: any) => ({
        id: opt.id,
        option_key: opt.option_key,
        content_latex: opt.contentLatex || opt.content_latex,
      }));
    } else if (tq.questions?.question_options) {
      options = tq.questions.question_options
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((opt: any) => ({
          id: opt.id,
          option_key: opt.option_key,
          content_latex: opt.content_latex,
        }));
    }

    return {
      id: tq.question_id,
      test_question_id: tq.id,
      section_id: tq.section_id,
      section_name: tq.test_sections?.name || "General",
      order_index: tq.order_index,
      content_latex: contentLatex,
      marks: Number(tq.marks) || 4,
      negative_marks: Number(tq.negative_marks) || -1,
      options,
    };
  });

  // 3. Fetch Saved Attempt Answers
  const { data: savedAnswers } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_id, is_marked_for_review, is_visited, time_spent_seconds")
    .eq("attempt_id", attemptId);

  const answersMap: ExamAttemptState["answers"] = {};
  (savedAnswers || []).forEach((ans) => {
    answersMap[ans.question_id] = {
      selectedOptionId: ans.selected_option_id,
      isMarkedForReview: ans.is_marked_for_review,
      isVisited: ans.is_visited,
      timeSpentSeconds: ans.time_spent_seconds,
    };
  });

  return {
    attemptId: attempt.id,
    testId: attempt.test_id,
    testTitle: testInfo?.title || "Exam Session",
    examType: testInfo?.exam_type || "JEE_MAIN",
    durationMinutes: testInfo?.duration_minutes || 180,
    serverEndTime: attempt.server_end_time,
    remainingSeconds,
    status: attempt.status,
    markingScheme: testInfo?.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
    questions,
    answers: answersMap,
  };
}

/**
 * Autosave / Heartbeat action: persists student answer response and increments timer.
 */
export async function saveAnswerHeartbeatAction(
  attemptId: string,
  payload: {
    questionId: string;
    selectedOptionId: string | null;
    isMarkedForReview: boolean;
    timeSpentSeconds: number;
  }
) {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const supabase = await createClient();

  // Verify attempt is IN_PROGRESS
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, student_id, status, server_end_time")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return { success: false, error: "Attempt is not active." };
  }

  if (attempt.student_id !== session.user.id && session.profile.role === "STUDENT") {
    return { success: false, error: "Unauthorized attempt modification." };
  }

  // Upsert answer
  const { error: ansErr } = await supabase.from("attempt_answers").upsert(
    {
      attempt_id: attemptId,
      question_id: payload.questionId,
      selected_option_id: payload.selectedOptionId,
      is_marked_for_review: payload.isMarkedForReview,
      is_visited: true,
      time_spent_seconds: payload.timeSpentSeconds,
      last_saved_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" }
  );

  if (ansErr) {
    return { success: false, error: ansErr.message };
  }

  return { success: true };
}

/**
 * Submit Exam Attempt Action.
 * Transitions attempt to SUBMITTED or AUTO_SUBMITTED.
 */
export async function submitExamAttemptAction(attemptId: string, autoSubmitted = false) {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, student_id, status")
    .eq("id", attemptId)
    .single();

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  if (attempt.student_id !== session.user.id && session.profile.role === "STUDENT") {
    throw new Error("Access denied.");
  }

  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return { success: true, message: "Attempt already submitted." };
  }

  const finalStatus = autoSubmitted ? "AUTO_SUBMITTED" : "SUBMITTED";
  await supabase
    .from("attempts")
    .update({
      status: finalStatus,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  // Automatically trigger deterministic scoring pipeline
  const { scoreAttemptAction } = await import("@/lib/scoring/engine");
  await scoreAttemptAction(attemptId);

  return { success: true };
}
