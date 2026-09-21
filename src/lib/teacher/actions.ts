"use server";

import { createClient } from "@/lib/supabase/server";
import {
  TeacherClassItem,
  ClassAnalyticsBundle,
  QuestionDifficultyAnalysis,
  StudentIndividualClassDetail,
  ClassTestPerformance,
} from "@/types/teacherAnalytics";
import {
  calculateClassPerformanceMetrics,
  calculateClassTopicMastery,
  calculateClassMistakeMatrix,
  calculateStudentPerformanceRows,
  calculateQuestionStruggleAnalysis,
  calculateMedian,
  formatClassAnalyticsCsv,
} from "./analytics";

/**
 * Server action to fetch teacher's authorized classes and the full analytics bundle
 * for the selected class.
 */
export async function getTeacherDashboardDataAction(
  selectedClassId?: string
): Promise<{
  success: boolean;
  classes?: TeacherClassItem[];
  selectedClassId?: string;
  bundle?: ClassAnalyticsBundle;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "TEACHER" && profile.role !== "ADMIN")) {
      return { success: false, error: "Forbidden: Teacher or Admin role required." };
    }

    const isAdmin = profile.role === "ADMIN";

    // 1. Fetch authorized classes
    let classQuery = supabase.from("classes").select(`
      id,
      name,
      grade,
      academic_year,
      created_by,
      created_at
    `);

    if (!isAdmin) {
      classQuery = classQuery.eq("created_by", user.id);
    }

    const { data: rawClasses, error: classErr } = await classQuery.order("created_at", {
      ascending: false,
    });

    if (classErr) {
      return { success: false, error: `Failed to fetch classes: ${classErr.message}` };
    }

    if (!rawClasses || rawClasses.length === 0) {
      return {
        success: true,
        classes: [],
        selectedClassId: undefined,
        bundle: undefined,
      };
    }

    // Determine target class
    const activeClassId =
      selectedClassId && rawClasses.some((c) => c.id === selectedClassId)
        ? selectedClassId
        : rawClasses[0].id;

    const activeClass = rawClasses.find((c) => c.id === activeClassId)!;

    // 2. Fetch class members (students)
    const { data: members, error: memberErr } = await supabase
      .from("class_members")
      .select(`
        student_id,
        student:profiles (id, full_name, email)
      `)
      .eq("class_id", activeClassId);

    if (memberErr) {
      return { success: false, error: `Failed to fetch class members: ${memberErr.message}` };
    }

    const students = (members || [])
      .map((m: any) => ({
        id: m.student?.id || m.student_id,
        full_name: m.student?.full_name || "Unknown Student",
        email: m.student?.email || "",
      }))
      .filter((s) => Boolean(s.id));

    const studentIds = students.map((s) => s.id);

    // 3. Fetch tests assigned to this class
    const { data: assignments, error: assignErr } = await supabase
      .from("test_assignments")
      .select(`
        test_id,
        assigned_at,
        test:tests (
          id,
          title,
          exam_type,
          duration_minutes,
          total_marks,
          status
        )
      `)
      .eq("class_id", activeClassId);

    if (assignErr) {
      return { success: false, error: `Failed to fetch test assignments: ${assignErr.message}` };
    }

    const assignedTests = (assignments || [])
      .map((a: any) => ({
        test_id: a.test_id,
        assigned_at: a.assigned_at,
        test: a.test,
      }))
      .filter((a) => Boolean(a.test));

    const testIds = assignedTests.map((a) => a.test_id);

    // 4. Fetch attempts for these students & tests
    let attempts: any[] = [];
    if (testIds.length > 0 && studentIds.length > 0) {
      const { data: attData, error: attErr } = await supabase
        .from("attempts")
        .select(`
          id,
          test_id,
          student_id,
          status,
          total_score,
          accuracy_percentage,
          submitted_at,
          created_at
        `)
        .in("test_id", testIds)
        .in("student_id", studentIds);

      if (!attErr && attData) {
        attempts = attData;
      }
    }

    // 5. Fetch mistake records for these students
    let rawMistakes: any[] = [];
    if (studentIds.length > 0) {
      const { data: mistData, error: mistErr } = await supabase
        .from("mistakes")
        .select(`
          id,
          student_id,
          mistake_type,
          classification_status,
          subject_id,
          chapter_id,
          topic_id,
          subject:subjects(name),
          chapter:chapters(name),
          topic:topics(name)
        `)
        .in("student_id", studentIds);

      if (!mistErr && mistData) {
        rawMistakes = mistData;
      }
    }

    // 6. Fetch taxonomy dictionaries for mapping
    const [subjRes, chapRes, topRes] = await Promise.all([
      supabase.from("subjects").select("id, name"),
      supabase.from("chapters").select("id, name"),
      supabase.from("topics").select("id, name"),
    ]);

    const subjectMap = new Map<string, string>();
    (subjRes.data || []).forEach((s) => subjectMap.set(s.id, s.name));

    const chapterMap = new Map<string, string>();
    (chapRes.data || []).forEach((c) => chapterMap.set(c.id, c.name));

    const topicMap = new Map<string, string>();
    (topRes.data || []).forEach((t) => topicMap.set(t.id, t.name));

    // 7. Calculate Per-Test Performances
    const testPerformances: ClassTestPerformance[] = assignedTests.map((at) => {
      const testAttempts = attempts.filter((a) => a.test_id === at.test_id);
      const completedAttempts = testAttempts.filter(
        (a) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED"
      );
      const scores = completedAttempts.map((a) => Number(a.total_score || 0));
      const accuracies = completedAttempts.map((a) => Number(a.accuracy_percentage || 0));

      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
          : 0;
      const medianScore = calculateMedian(scores);
      const avgAcc =
        accuracies.length > 0
          ? Math.round(accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length)
          : 0;

      const compPct =
        students.length > 0 ? Math.round((completedAttempts.length / students.length) * 100) : 0;

      return {
        test_id: at.test_id,
        title: at.test?.title || "Test",
        exam_type: at.test?.exam_type || "JEE_MAIN",
        duration_minutes: at.test?.duration_minutes || 180,
        total_marks: at.test?.total_marks || 300,
        assigned_at: at.assigned_at,
        participants_count: completedAttempts.length,
        total_students: students.length,
        average_score: avgScore,
        median_score: medianScore,
        average_accuracy: avgAcc,
        completion_percentage: compPct,
      };
    });

    // 8. Fetch Attempt Answers for Topic Mastery Breakdown
    const attemptIds = attempts.map((a) => a.id);
    let attemptAnswers: any[] = [];
    if (attemptIds.length > 0) {
      const { data: ansData } = await supabase
        .from("attempt_answers")
        .select(`
          is_correct,
          selected_option_id,
          question:questions (subject_id, chapter_id, topic_id)
        `)
        .in("attempt_id", attemptIds);

      if (ansData) {
        attemptAnswers = ansData;
      }
    }

    // 9. Build Aggregations
    const performanceMetrics = calculateClassPerformanceMetrics(attempts, students.length);
    const topicMastery = calculateClassTopicMastery(
      attemptAnswers,
      subjectMap,
      chapterMap,
      topicMap
    );
    const mistakeMatrix = calculateClassMistakeMatrix(rawMistakes);

    // Group attempts and mistakes by student
    const attemptsByStudent = new Map<string, any[]>();
    attempts.forEach((a) => {
      const list = attemptsByStudent.get(a.student_id) || [];
      list.push(a);
      attemptsByStudent.set(a.student_id, list);
    });

    const mistakesByStudent = new Map<string, any[]>();
    rawMistakes.forEach((m) => {
      const list = mistakesByStudent.get(m.student_id) || [];
      list.push(m);
      mistakesByStudent.set(m.student_id, list);
    });

    const studentRows = calculateStudentPerformanceRows(
      students,
      attemptsByStudent,
      mistakesByStudent,
      assignedTests.length
    );

    // Build class items summary list
    const teacherClasses: TeacherClassItem[] = rawClasses.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      academic_year: c.academic_year,
      student_count: c.id === activeClassId ? students.length : 0,
      test_count: c.id === activeClassId ? assignedTests.length : 0,
      created_at: c.created_at,
    }));

    const bundle: ClassAnalyticsBundle = {
      class_id: activeClass.id,
      class_name: activeClass.name,
      grade: activeClass.grade,
      academic_year: activeClass.academic_year,
      total_students: students.length,
      performance_metrics: performanceMetrics,
      test_performances: testPerformances,
      topic_mastery: topicMastery,
      mistake_matrix: mistakeMatrix,
      student_rows: studentRows,
    };

    return {
      success: true,
      classes: teacherClasses,
      selectedClassId: activeClassId,
      bundle,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected error loading teacher analytics.",
    };
  }
}

/**
 * Server action to get question difficulty & struggle breakdown for a specific test.
 */
export async function getTestQuestionAnalysisAction(
  testId: string,
  classId: string
): Promise<{
  success: boolean;
  questions?: QuestionDifficultyAnalysis[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "TEACHER" && profile.role !== "ADMIN")) {
      return { success: false, error: "Forbidden: Teacher or Admin role required." };
    }

    // Fetch class students
    const { data: members } = await supabase
      .from("class_members")
      .select("student_id")
      .eq("class_id", classId);

    const studentIds = (members || []).map((m) => m.student_id);

    // Fetch test questions
    const { data: testQuestions, error: tqErr } = await supabase
      .from("test_questions")
      .select(`
        id,
        question_id,
        order_index,
        question:questions (
          id,
          content_latex,
          difficulty,
          subject_id,
          chapter_id,
          topic_id,
          options:question_options (
            id,
            option_key,
            content_latex,
            is_correct
          )
        )
      `)
      .eq("test_id", testId)
      .order("order_index", { ascending: true });

    if (tqErr || !testQuestions) {
      return { success: false, error: `Failed to fetch test questions: ${tqErr?.message}` };
    }

    // Fetch attempts for this test from this class
    let answers: any[] = [];
    if (studentIds.length > 0) {
      const { data: attempts } = await supabase
        .from("attempts")
        .select("id")
        .eq("test_id", testId)
        .in("student_id", studentIds);

      const attemptIds = (attempts || []).map((a) => a.id);

      if (attemptIds.length > 0) {
        const { data: ansData } = await supabase
          .from("attempt_answers")
          .select("question_id, selected_option_id, is_correct")
          .in("attempt_id", attemptIds);

        if (ansData) {
          answers = ansData;
        }
      }
    }

    // Fetch taxonomy
    const [subjRes, chapRes, topRes] = await Promise.all([
      supabase.from("subjects").select("id, name"),
      supabase.from("chapters").select("id, name"),
      supabase.from("topics").select("id, name"),
    ]);

    const subjectMap = new Map<string, string>();
    (subjRes.data || []).forEach((s) => subjectMap.set(s.id, s.name));

    const chapterMap = new Map<string, string>();
    (chapRes.data || []).forEach((c) => chapterMap.set(c.id, c.name));

    const topicMap = new Map<string, string>();
    (topRes.data || []).forEach((t) => topicMap.set(t.id, t.name));

    const analysis = calculateQuestionStruggleAnalysis(
      testQuestions as any,
      answers,
      subjectMap,
      chapterMap,
      topicMap
    );

    return {
      success: true,
      questions: analysis,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected error analyzing question difficulty.",
    };
  }
}

/**
 * Server action to get student individual performance detail within a class.
 */
export async function getStudentClassDetailAction(
  studentId: string,
  classId: string
): Promise<{
  success: boolean;
  detail?: StudentIndividualClassDetail;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "TEACHER" && profile.role !== "ADMIN")) {
      return { success: false, error: "Forbidden: Teacher or Admin role required." };
    }

    // Verify student is in the class
    const { data: membership } = await supabase
      .from("class_members")
      .select("student_id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .single();

    if (!membership) {
      return { success: false, error: "Student does not belong to this class." };
    }

    // Fetch student profile
    const { data: studentUser } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", studentId)
      .single();

    if (!studentUser) {
      return { success: false, error: "Student profile not found." };
    }

    // Fetch attempts
    const { data: attempts } = await supabase
      .from("attempts")
      .select(`
        id,
        test_id,
        status,
        total_score,
        accuracy_percentage,
        submitted_at,
        created_at,
        test:tests (id, title, total_marks)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    const completedAttempts = (attempts || []).filter(
      (a) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED"
    );

    const scores = completedAttempts.map((a) => Number(a.total_score || 0));
    const accuracies = completedAttempts.map((a) => Number(a.accuracy_percentage || 0));

    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((acc, s) => acc + s, 0) / scores.length) * 10) / 10
        : 0;
    const avgAccuracy =
      accuracies.length > 0
        ? Math.round(accuracies.reduce((acc, a) => acc + a, 0) / accuracies.length)
        : 0;

    // Fetch student's mistakes
    const { data: rawMistakes } = await supabase
      .from("mistakes")
      .select(`
        id,
        mistake_type,
        chapter:chapters (name)
      `)
      .eq("student_id", studentId);

    // Group recurring mistakes by chapter & type
    const mistakeGroupMap = new Map<string, { chapter_name: string; mistake_type: any; count: number }>();
    (rawMistakes || []).forEach((m: any) => {
      const chapName = m.chapter?.name || "General";
      const key = `${chapName}:${m.mistake_type}`;
      const existing = mistakeGroupMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        mistakeGroupMap.set(key, {
          chapter_name: chapName,
          mistake_type: m.mistake_type,
          count: 1,
        });
      }
    });

    const recurringMistakes = Array.from(mistakeGroupMap.values())
      .map((g) => ({
        chapter_name: g.chapter_name,
        mistake_type: g.mistake_type,
        occurrences: g.count,
        trend: (g.count >= 3 ? "WORSENING" : "STABLE") as any,
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    const recentAttempts = completedAttempts.slice(0, 10).map((a: any) => ({
      attempt_id: a.id,
      test_id: a.test_id,
      test_title: a.test?.title || "Test",
      submitted_at: a.submitted_at || a.created_at,
      score: Number(a.total_score || 0),
      max_score: Number(a.test?.total_marks || 300),
      accuracy: Number(a.accuracy_percentage || 0),
    }));

    const detail: StudentIndividualClassDetail = {
      student_id: studentUser.id,
      student_name: studentUser.full_name || "Student",
      email: studentUser.email || "",
      average_score: avgScore,
      average_accuracy: avgAccuracy,
      total_tests: completedAttempts.length,
      weak_topics: [],
      recurring_mistakes: recurringMistakes,
      recent_attempts: recentAttempts,
    };

    return {
      success: true,
      detail,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected error retrieving student detail.",
    };
  }
}

/**
 * Server action to export class analytics as CSV.
 */
export async function exportClassAnalyticsCsvAction(
  classId: string
): Promise<{
  success: boolean;
  csv?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const res = await getTeacherDashboardDataAction(classId);
    if (!res.success || !res.bundle) {
      return { success: false, error: res.error || "Failed to load class bundle for export." };
    }

    const csvContent = formatClassAnalyticsCsv(res.bundle);
    const sanitizedName = res.bundle.class_name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `class_analytics_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      success: true,
      csv: csvContent,
      filename,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected error exporting CSV.",
    };
  }
}
