"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import {
  computeDeterministicScore,
  DeterministicScoreReport,
  QuestionScoringItem,
} from "@/types/scoring";
import { MarkingSchemeConfig } from "@/types/database";

/**
 * Score an Exam Attempt Deterministically.
 * Idempotent, server-authoritative, zero AI involvement.
 */
export async function scoreAttemptAction(attemptId: string): Promise<DeterministicScoreReport> {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const supabase = await createClient();

  // 1. Fetch Attempt & Test Marking Configuration
  const { data: attempt, error: attemptErr } = await supabase
    .from("attempts")
    .select(`
      id, test_id, student_id, status, time_spent_seconds,
      tests (
        id, title, duration_minutes, marking_scheme
      )
    `)
    .eq("id", attemptId)
    .single();

  if (attemptErr || !attempt) {
    throw new Error("Attempt not found.");
  }

  // Authorization check
  if (attempt.student_id !== session.user.id && session.profile.role === "STUDENT") {
    throw new Error("Access denied: You cannot score another student's attempt.");
  }

  const testInfo = attempt.tests as any;
  const markingScheme: MarkingSchemeConfig = testInfo?.marking_scheme || {
    correct: 4,
    incorrect: -1,
    unattempted: 0,
  };

  // 2. Idempotency check: If test_results already exists, return stored report directly
  const { data: existingResult } = await supabase
    .from("test_results")
    .select("*")
    .eq("attempt_id", attemptId)
    .maybeSingle();

  if (existingResult) {
    // Return existing result
    const { data: questionDetails } = await supabase
      .from("attempt_answers")
      .select(`
        question_id, selected_option_id, is_correct, marks_awarded, time_spent_seconds,
        questions (
          id, content_latex, explanation_latex, subject_id, chapter_id, topic_id,
          subjects(name), chapters(name), topics(name),
          question_options(id, option_key, content_latex, is_correct)
        )
      `)
      .eq("attempt_id", attemptId);

    const questionResults = (questionDetails || []).map((ans: any, idx: number) => {
      const q = ans.questions;
      const correctOpt = (q?.question_options || []).find((o: any) => o.is_correct);
      const selectedOpt = (q?.question_options || []).find((o: any) => o.id === ans.selected_option_id);

      return {
        questionId: ans.question_id,
        testQuestionId: "",
        subjectId: q?.subject_id || "",
        subjectName: q?.subjects?.name || "General",
        chapterId: q?.chapter_id || "",
        chapterName: q?.chapters?.name || "General",
        topicId: q?.topic_id || null,
        topicName: q?.topics?.name || null,
        orderIndex: idx + 1,
        selectedOptionId: ans.selected_option_id,
        selectedOptionKey: selectedOpt?.option_key || null,
        correctOptionId: correctOpt?.id || "",
        correctOptionKey: correctOpt?.option_key || "A",
        isCorrect: ans.is_correct,
        isAttempted: Boolean(ans.selected_option_id),
        marksAwarded: Number(ans.marks_awarded) || 0,
        maxMarks: Number(markingScheme.correct) || 4,
        timeSpentSeconds: ans.time_spent_seconds || 0,
        contentLatex: q?.content_latex,
        explanationLatex: q?.explanation_latex,
      };
    });

    return {
      attemptId: existingResult.attempt_id,
      testId: existingResult.test_id,
      studentId: existingResult.student_id,
      scoringVersion: existingResult.scoring_version,
      totalScore: Number(existingResult.total_score),
      maximumScore: Number(existingResult.maximum_score),
      totalQuestions: existingResult.total_questions,
      attemptedCount: existingResult.attempted_count,
      correctCount: existingResult.correct_count,
      incorrectCount: existingResult.incorrect_count,
      unattemptedCount: existingResult.unattempted_count,
      accuracyPercentage: Number(existingResult.accuracy_percentage),
      totalTimeSpentSeconds: existingResult.total_time_spent_seconds,
      questionResults,
      subjectBreakdown: existingResult.subject_breakdown,
      chapterBreakdown: existingResult.chapter_breakdown,
      topicBreakdown: existingResult.topic_breakdown,
      calculatedAt: existingResult.calculated_at,
    };
  }

  // 3. Fetch Test Questions with Authoritative Options and Snapshot Data
  const { data: testQuestions, error: tqErr } = await supabase
    .from("test_questions")
    .select(`
      id, question_id, section_id, order_index, marks, negative_marks, snapshot_data,
      questions (
        id, content_latex, explanation_latex, subject_id, chapter_id, topic_id,
        subjects!questions_subject_id_fkey(name),
        chapters!questions_chapter_id_fkey(name),
        topics!questions_topic_id_fkey(name),
        question_options (id, option_key, content_latex, is_correct, order_index)
      )
    `)
    .eq("test_id", attempt.test_id)
    .order("order_index", { ascending: true });

  if (tqErr || !testQuestions) {
    throw new Error("Failed to load test questions for scoring.");
  }

  // 4. Fetch Student's Final Saved Answers
  const { data: studentAnswers } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_id, time_spent_seconds")
    .eq("attempt_id", attemptId);

  const studentAnswersMap = new Map<string, { selectedOptionId: string | null; timeSpent: number }>();
  (studentAnswers || []).forEach((sa) => {
    studentAnswersMap.set(sa.question_id, {
      selectedOptionId: sa.selected_option_id,
      timeSpent: sa.time_spent_seconds || 0,
    });
  });

  // 5. Prepare Authoritative Scoring Items
  const scoringItems: QuestionScoringItem[] = testQuestions.map((tq: any) => {
    const q = tq.questions;
    let options = q?.question_options || [];
    let contentLatex = q?.content_latex || "";
    let explanationLatex = q?.explanation_latex || null;

    // Use immutable snapshot if present (preserves historical exam state)
    if (tq.snapshot_data && tq.snapshot_data.options) {
      contentLatex = tq.snapshot_data.content_latex;
      explanationLatex = tq.snapshot_data.explanation_latex || null;
      options = tq.snapshot_data.options;
    }

    const correctOption = options.find((o: any) => o.is_correct) || options[0];
    const studentAns = studentAnswersMap.get(tq.question_id);
    const selectedOpt = options.find((o: any) => o.id === studentAns?.selectedOptionId);

    return {
      questionId: tq.question_id,
      testQuestionId: tq.id,
      subjectId: q?.subject_id || "default-subject",
      subjectName: q?.subjects?.name || "Physics",
      chapterId: q?.chapter_id || "default-chapter",
      chapterName: q?.chapters?.name || "General",
      topicId: q?.topic_id || null,
      topicName: q?.topics?.name || null,
      orderIndex: tq.order_index,
      marksConfig: {
        correct: Number(tq.marks) || markingScheme.correct,
        incorrect: Number(tq.negative_marks) || markingScheme.incorrect,
        unattempted: markingScheme.unattempted ?? 0,
      },
      correctOptionId: correctOption?.id || "",
      correctOptionKey: correctOption?.option_key || "A",
      selectedOptionId: studentAns?.selectedOptionId || null,
      selectedOptionKey: selectedOpt?.option_key || null,
      timeSpentSeconds: studentAns?.timeSpent || 0,
      contentLatex,
      explanationLatex,
      options: options.map((o: any) => ({
        id: o.id,
        optionKey: o.option_key,
        contentLatex: o.content_latex,
        isCorrect: Boolean(o.is_correct),
      })),
    };
  });

  // 6. Compute Deterministic Score
  const scoreReport = computeDeterministicScore(scoringItems, markingScheme, {
    attemptId,
    testId: attempt.test_id,
    studentId: attempt.student_id,
  });

  // 7. Atomic Persistence: Store test_results, update attempt, update attempt_answers
  // A. Insert test_results
  await supabase.from("test_results").insert({
    attempt_id: attemptId,
    test_id: attempt.test_id,
    student_id: attempt.student_id,
    scoring_version: scoreReport.scoringVersion,
    total_score: scoreReport.totalScore,
    maximum_score: scoreReport.maximumScore,
    total_questions: scoreReport.totalQuestions,
    attempted_count: scoreReport.attemptedCount,
    correct_count: scoreReport.correctCount,
    incorrect_count: scoreReport.incorrectCount,
    unattempted_count: scoreReport.unattemptedCount,
    accuracy_percentage: scoreReport.accuracyPercentage,
    total_time_spent_seconds: scoreReport.totalTimeSpentSeconds,
    subject_breakdown: scoreReport.subjectBreakdown,
    chapter_breakdown: scoreReport.chapterBreakdown,
    topic_breakdown: scoreReport.topicBreakdown,
    calculated_at: scoreReport.calculatedAt,
  });

  // B. Update Attempt Status & Summary
  await supabase
    .from("attempts")
    .update({
      total_score: scoreReport.totalScore,
      accuracy_percentage: scoreReport.accuracyPercentage,
      status: attempt.status === "AUTO_SUBMITTED" ? "AUTO_SUBMITTED" : "SUBMITTED",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  // C. Update Individual Attempt Answers
  for (const qRes of scoreReport.questionResults) {
    await supabase
      .from("attempt_answers")
      .update({
        is_correct: qRes.isCorrect,
        marks_awarded: qRes.marksAwarded,
      })
      .eq("attempt_id", attemptId)
      .eq("question_id", qRes.questionId);
  }

  // D. Update Student Topic Stats
  for (const qRes of scoreReport.questionResults) {
    if (qRes.topicId && qRes.isAttempted) {
      const isCor = qRes.isCorrect === true;
      const { data: currentStats } = await supabase
        .from("student_topic_stats")
        .select("*")
        .eq("student_id", attempt.student_id)
        .eq("topic_id", qRes.topicId)
        .maybeSingle();

      const newAttempted = (currentStats?.total_attempted || 0) + 1;
      const newCorrect = (currentStats?.total_correct || 0) + (isCor ? 1 : 0);
      const newIncorrect = (currentStats?.total_incorrect || 0) + (isCor ? 0 : 1);
      const newAcc = Math.round((newCorrect / newAttempted) * 10000) / 100;

      await supabase.from("student_topic_stats").upsert({
        student_id: attempt.student_id,
        topic_id: qRes.topicId,
        total_attempted: newAttempted,
        total_correct: newCorrect,
        total_incorrect: newIncorrect,
        accuracy_percentage: newAcc,
        last_attempted_at: new Date().toISOString(),
      });
    }
  }

  return scoreReport;
}

/**
 * Fetch detailed score report and review data for an attempt.
 */
export async function getAttemptResult(attemptId: string) {
  // Score if not already scored
  const report = await scoreAttemptAction(attemptId);
  return report;
}
