import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireRole, AuthSession } from "@/lib/auth/session";

function getDbClient(fallbackSupabase: any) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey && supabaseUrl) {
    return createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return fallbackSupabase;
}

import {
  StudentDashboardData,
  StudentTestSummary,
  StudentActiveAttemptSummary,
  StudentAttemptHistoryRecord,
  StudentOverallMetrics,
  StudentSubjectPerformance,
} from "@/types/student";
import { TestStatus } from "@/types/database";

/**
 * Pure aggregation helper to calculate lifetime performance metrics.
 */
export function calculateStudentOverallMetrics(results: any[]): StudentOverallMetrics {
  if (!results || results.length === 0) {
    return {
      testsCompletedCount: 0,
      totalQuestionsAttempted: 0,
      totalCorrectCount: 0,
      totalIncorrectCount: 0,
      overallAccuracyPercentage: 0,
      totalTimeSpentMinutes: 0,
      subjectBreakdown: [],
      strongTopics: [],
      weakTopics: [],
    };
  }

  let totalQuestionsAttempted = 0;
  let totalCorrectCount = 0;
  let totalIncorrectCount = 0;
  let totalTimeSpentSeconds = 0;

  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      totalAttempted: number;
      totalCorrect: number;
      totalIncorrect: number;
      totalQuestions: number;
      totalScore: number;
    }
  >();

  const topicMap = new Map<
    string,
    {
      topicName: string;
      subjectName: string;
      correct: number;
      attempted: number;
    }
  >();

  for (const res of results) {
    totalQuestionsAttempted += Number(res.attempted_count) || 0;
    totalCorrectCount += Number(res.correct_count) || 0;
    totalIncorrectCount += Number(res.incorrect_count) || 0;
    totalTimeSpentSeconds += Number(res.total_time_spent_seconds) || 0;

    // Aggregate Subjects
    const subjectList = Array.isArray(res.subject_breakdown) ? res.subject_breakdown : [];
    for (const sub of subjectList) {
      const sId = sub.subjectId || sub.subjectName || "unknown";
      const sName = sub.subjectName || "General";
      const existing = subjectMap.get(sId) || {
        subjectId: sId,
        subjectName: sName,
        totalAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalQuestions: 0,
        totalScore: 0,
      };

      existing.totalAttempted += Number(sub.attempted) || 0;
      existing.totalCorrect += Number(sub.correct) || 0;
      existing.totalIncorrect += Number(sub.incorrect) || 0;
      existing.totalQuestions += Number(sub.totalQuestions) || 0;
      existing.totalScore += Number(sub.score) || 0;
      subjectMap.set(sId, existing);
    }

    // Aggregate Topics
    const topicList = Array.isArray(res.topic_breakdown) ? res.topic_breakdown : [];
    for (const top of topicList) {
      if (!top.topicName) continue;
      const tKey = `${top.subjectName || ""}:${top.topicName}`;
      const existing = topicMap.get(tKey) || {
        topicName: top.topicName,
        subjectName: top.subjectName || "General",
        correct: 0,
        attempted: 0,
      };
      existing.correct += Number(top.correct) || 0;
      existing.attempted += Number(top.attempted) || 0;
      topicMap.set(tKey, existing);
    }
  }

  const subjectBreakdown: StudentSubjectPerformance[] = Array.from(subjectMap.values()).map((s) => ({
    ...s,
    accuracyPercentage: s.totalAttempted > 0 ? Math.round((s.totalCorrect / s.totalAttempted) * 100 * 10) / 10 : 0,
  }));

  const overallAccuracyPercentage =
    totalQuestionsAttempted > 0 ? Math.round((totalCorrectCount / totalQuestionsAttempted) * 100 * 10) / 10 : 0;

  // Derive Top Strong & Weak Topics (min 1 attempted question)
  const topicStats = Array.from(topicMap.values())
    .filter((t) => t.attempted > 0)
    .map((t) => ({
      topicName: t.topicName,
      subjectName: t.subjectName,
      accuracy: Math.round((t.correct / t.attempted) * 100),
      totalCount: t.attempted,
    }));

  const strongTopics = [...topicStats]
    .filter((t) => t.accuracy >= 60)
    .sort((a, b) => b.accuracy - a.accuracy || b.totalCount - a.totalCount)
    .slice(0, 5);

  const weakTopics = [...topicStats]
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.totalCount - a.totalCount)
    .slice(0, 5);

  return {
    testsCompletedCount: results.length,
    totalQuestionsAttempted,
    totalCorrectCount,
    totalIncorrectCount,
    overallAccuracyPercentage,
    totalTimeSpentMinutes: Math.round(totalTimeSpentSeconds / 60),
    subjectBreakdown,
    strongTopics,
    weakTopics,
  };
}

/**
 * Pure helper to compute test action state (START, RESUME, UPCOMING, EXPIRED, COMPLETED).
 */
export function computeTestActionState(
  test: {
    status: TestStatus;
    start_time?: string | null;
    end_time?: string | null;
  },
  activeAttempt?: any,
  latestAttempt?: any,
  nowMs = Date.now()
): {
  actionState: "START" | "RESUME" | "UPCOMING" | "EXPIRED" | "COMPLETED";
  canStart: boolean;
} {
  if (activeAttempt && activeAttempt.status === "IN_PROGRESS") {
    return { actionState: "RESUME", canStart: true };
  }

  const startTimeMs = test.start_time ? new Date(test.start_time).getTime() : null;
  const endTimeMs = test.end_time ? new Date(test.end_time).getTime() : null;

  if (startTimeMs && nowMs < startTimeMs) {
    return { actionState: "UPCOMING", canStart: false };
  }

  if (endTimeMs && nowMs > endTimeMs) {
    if (latestAttempt) {
      return { actionState: "COMPLETED", canStart: false };
    }
    return { actionState: "EXPIRED", canStart: false };
  }

  if (latestAttempt) {
    return { actionState: "COMPLETED", canStart: true }; // Practice re-attempt or review
  }

  return { actionState: "START", canStart: true };
}

/**
 * Fetch Comprehensive Data for Student Portal Dashboard.
 */
export async function getStudentDashboardData(
  preloadedSession?: AuthSession
): Promise<StudentDashboardData> {
  const session = preloadedSession || (await requireRole(["STUDENT", "TEACHER", "ADMIN"]));
  const studentId = session.user.id;
  const supabase = await createClient();
  const db = getDbClient(supabase);

  // 1. Parallel independent queries: classes, active attempt, submitted attempts, completed results, published tests, practice tests
  const [
    { data: memberRows },
    { data: activeAttemptRow },
    { data: submittedAttempts },
    { data: resultsData },
    { data: officialTests },
    { data: practiceRows },
  ] = await Promise.all([
    // 1. Enrolled Classes
    db
      .from("class_members")
      .select("class_id, classes (id, name, grade)")
      .eq("student_id", studentId),

    // 2. Active (In-Progress) Attempt
    db
      .from("attempts")
      .select(`
        id, test_id, started_at, server_end_time, status,
        tests (
          id, title, exam_type, duration_minutes,
          test_questions (count)
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "IN_PROGRESS")
      .maybeSingle(),

    // 3. Submitted Unscored Attempts Sync
    db
      .from("attempts")
      .select("id")
      .eq("student_id", studentId)
      .in("status", ["SUBMITTED", "AUTO_SUBMITTED"])
      .limit(10),

    // 4. Completed Test Results
    db
      .from("test_results")
      .select(`
        id, attempt_id, test_id, total_score, maximum_score, total_questions,
        attempted_count, correct_count, incorrect_count, unattempted_count,
        accuracy_percentage, total_time_spent_seconds,
        subject_breakdown, chapter_breakdown, topic_breakdown, calculated_at,
        tests (id, title, exam_type)
      `)
      .eq("student_id", studentId)
      .order("calculated_at", { ascending: false })
      .limit(50),

    // 5. Published Official / Teacher Mock & Scheduled Tests
    db
      .from("tests")
      .select(`
        id, title, description, exam_type, test_mode, duration_minutes, total_marks,
        marking_scheme, status, start_time, end_time,
        test_questions (count)
      `)
      .in("test_mode", ["MOCK", "SCHEDULED"])
      .in("status", ["PUBLISHED", "LIVE", "SCHEDULED"])
      .limit(50),

    // 6. Student's Own Private Practice Tests
    db
      .from("tests")
      .select(`
        id, title, description, exam_type, test_mode, duration_minutes, total_marks,
        marking_scheme, status, start_time, end_time,
        test_questions (count)
      `)
      .eq("test_mode", "PRACTICE_SELF")
      .eq("created_by", studentId)
      .in("status", ["PUBLISHED", "LIVE"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const classes = (memberRows || []).map((m: any) => ({
    classId: m.class_id,
    className: m.classes?.name || "Class",
    grade: m.classes?.grade || "12th",
  }));

  const classIds = classes.map((c: { classId: string }) => c.classId);

  let activeAttempt: StudentActiveAttemptSummary | null = null;
  if (activeAttemptRow && activeAttemptRow.tests) {
    const testObj: any = activeAttemptRow.tests;
    activeAttempt = {
      attemptId: activeAttemptRow.id,
      testId: activeAttemptRow.test_id,
      testTitle: testObj.title,
      examType: testObj.exam_type,
      startedAt: activeAttemptRow.started_at,
      serverEndTime: activeAttemptRow.server_end_time,
      totalQuestions: testObj.test_questions?.[0]?.count || 0,
      durationMinutes: testObj.duration_minutes,
    };
  }

  // 2. Fast non-blocking auto-sync for any unscored submitted attempt
  if (submittedAttempts && submittedAttempts.length > 0) {
    const scoredIds = new Set((resultsData || []).map((r: any) => r.attempt_id));
    for (const att of submittedAttempts) {
      if (!scoredIds.has(att.id)) {
        try {
          const { scoreAttemptAction } = await import("@/lib/scoring/engine");
          await scoreAttemptAction(att.id);
        } catch (sErr) {
          console.warn(`Auto-score sync warning for attempt ${att.id}:`, sErr);
        }
      }
    }
  }

  // 3. Fetch assignments in parallel with class IDs
  const { data: assignmentRows } = await db
    .from("test_assignments")
    .select(`
      id, test_id, class_id, student_id, due_at,
      tests (
        id, title, description, exam_type, test_mode, duration_minutes, total_marks,
        marking_scheme, status, start_time, end_time,
        test_questions (count)
      )
    `)
    .or(
      classIds.length > 0
        ? `student_id.eq.${studentId},class_id.in.(${classIds.join(",")})`
        : `student_id.eq.${studentId}`
    );

  const recentAttempts: StudentAttemptHistoryRecord[] = (resultsData || []).map((r: any) => ({
    attemptId: r.attempt_id,
    testId: r.test_id,
    testTitle: r.tests?.title || "Exam Paper",
    examType: r.tests?.exam_type || "JEE_MAIN",
    submittedAt: r.calculated_at,
    totalScore: Number(r.total_score) || 0,
    maximumScore: Number(r.maximum_score) || 0,
    accuracyPercentage: Number(r.accuracy_percentage) || 0,
    attemptedCount: Number(r.attempted_count) || 0,
    correctCount: Number(r.correct_count) || 0,
    incorrectCount: Number(r.incorrect_count) || 0,
    totalTimeSpentSeconds: Number(r.total_time_spent_seconds) || 0,
  }));

  const resultMapByTestId = new Map<string, any>();
  recentAttempts.forEach((r) => {
    if (!resultMapByTestId.has(r.testId)) {
      resultMapByTestId.set(r.testId, r);
    }
  });

  const nowMs = Date.now();

  const assignedTestMap = new Map<string, StudentTestSummary>();
  (assignmentRows || [])
    .filter((a: any) => a.tests && a.tests.status !== "DRAFT" && a.tests.status !== "ARCHIVED")
    .forEach((a: any) => {
      const t = a.tests;
      if (!assignedTestMap.has(t.id)) {
        const latest = resultMapByTestId.get(t.id);
        const isCurrentActive = activeAttempt?.testId === t.id;
        const { actionState, canStart } = computeTestActionState(t, isCurrentActive ? activeAttempt : null, latest, nowMs);

        assignedTestMap.set(t.id, {
          id: t.id,
          title: t.title,
          description: t.description,
          examType: t.exam_type,
          testMode: t.test_mode,
          durationMinutes: t.duration_minutes,
          totalMarks: Number(t.total_marks) || 0,
          markingScheme: t.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
          status: t.status,
          startTime: t.start_time,
          endTime: t.end_time,
          dueAt: a.due_at,
          assignmentSource: a.student_id === studentId ? ("DIRECT" as const) : ("CLASS" as const),
          questionCount: t.test_questions?.[0]?.count || 0,
          activeAttempt: isCurrentActive ? activeAttempt : null,
          latestAttempt: latest,
          canStart,
          actionState,
        });
      }
    });

  // Also populate any published mock tests not explicitly in assignment table
  (officialTests || []).forEach((t: any) => {
    if (!assignedTestMap.has(t.id)) {
      const latest = resultMapByTestId.get(t.id);
      const isCurrentActive = activeAttempt?.testId === t.id;
      const { actionState, canStart } = computeTestActionState(t, isCurrentActive ? activeAttempt : null, latest, nowMs);

      assignedTestMap.set(t.id, {
        id: t.id,
        title: t.title,
        description: t.description,
        examType: t.exam_type,
        testMode: t.test_mode,
        durationMinutes: t.duration_minutes,
        totalMarks: Number(t.total_marks) || 0,
        markingScheme: t.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
        status: t.status,
        startTime: t.start_time,
        endTime: t.end_time,
        dueAt: t.end_time,
        assignmentSource: "CLASS" as const,
        questionCount: t.test_questions?.[0]?.count || 0,
        activeAttempt: isCurrentActive ? activeAttempt : null,
        latestAttempt: latest,
        canStart,
        actionState,
      });
    }
  });

  const assignedTests = Array.from(assignedTestMap.values());

  const practiceTests: StudentTestSummary[] = (practiceRows || []).map((t: any) => {
    const latest = resultMapByTestId.get(t.id);
    const isCurrentActive = activeAttempt?.testId === t.id;
    const { actionState, canStart } = computeTestActionState(t, isCurrentActive ? activeAttempt : null, latest, nowMs);

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      examType: t.exam_type,
      testMode: t.test_mode,
      durationMinutes: t.duration_minutes,
      totalMarks: Number(t.total_marks) || 0,
      markingScheme: t.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
      status: t.status,
      startTime: t.start_time,
      endTime: t.end_time,
      assignmentSource: "SELF_PRACTICE" as const,
      questionCount: t.test_questions?.[0]?.count || 0,
      activeAttempt: isCurrentActive ? activeAttempt : null,
      latestAttempt: latest,
      canStart,
      actionState,
    };
  });

  const metrics = calculateStudentOverallMetrics(resultsData || []);

  return {
    profile: {
      id: studentId,
      fullName: session.profile.full_name || "Student",
      email: session.user.email || "",
      role: session.profile.role,
      targetExam: (session.profile.target_exam as any) || "JEE_MAIN",
      avatarUrl: session.profile.avatar_url || null,
      classes,
    },
    activeAttempt,
    assignedTests,
    practiceTests,
    recentAttempts,
    metrics,
  };
}
