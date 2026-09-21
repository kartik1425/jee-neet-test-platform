import { describe, it, expect } from "vitest";
import {
  calculateClassPerformanceMetrics,
  calculateClassTopicMastery,
  calculateClassMistakeMatrix,
  calculateStudentPerformanceRows,
  calculateQuestionStruggleAnalysis,
  formatClassAnalyticsCsv,
} from "@/lib/teacher/analytics";
import { ClassAnalyticsBundle } from "@/types/teacherAnalytics";

describe("Phase 13 Teacher Analytics Pipeline Integration Suite [INTEGRATION]", () => {
  /* ======================================================================== */
  /* 1. [INTEGRATION] End-to-End Class Bundle Aggregation                      */
  /* ======================================================================== */
  it("compiles a cohesive multi-student, multi-test class analytics bundle", () => {
    // 1. Synthetic Roster
    const students = [
      { id: "stu-1", full_name: "Aarav Sharma", email: "aarav@school.edu" },
      { id: "stu-2", full_name: "Diya Patel", email: "diya@school.edu" },
      { id: "stu-3", full_name: "Rohan Gupta", email: "rohan@school.edu" },
    ];

    // 2. Attempts across 2 tests
    const attempts = [
      // Test 1
      { id: "att-1", test_id: "test-1", student_id: "stu-1", total_score: 80, accuracy_percentage: 80, status: "SUBMITTED", created_at: "2026-09-01T10:00:00Z" },
      { id: "att-2", test_id: "test-1", student_id: "stu-2", total_score: 50, accuracy_percentage: 50, status: "SUBMITTED", created_at: "2026-09-01T10:00:00Z" },
      { id: "att-3", test_id: "test-1", student_id: "stu-3", total_score: 30, accuracy_percentage: 30, status: "AUTO_SUBMITTED", created_at: "2026-09-01T10:00:00Z" },
      // Test 2
      { id: "att-4", test_id: "test-2", student_id: "stu-1", total_score: 90, accuracy_percentage: 90, status: "SUBMITTED", created_at: "2026-09-08T10:00:00Z" },
      { id: "att-5", test_id: "test-2", student_id: "stu-2", total_score: 30, accuracy_percentage: 30, status: "SUBMITTED", created_at: "2026-09-08T10:00:00Z" },
    ];

    // 3. Taxonomy Maps
    const subjectMap = new Map([["subj-phy", "Physics"]]);
    const chapterMap = new Map([
      ["chap-rot", "Rotational Dynamics"],
      ["chap-opt", "Ray Optics"],
    ]);
    const topicMap = new Map([["top-moi", "Moment of Inertia"]]);

    // 4. Answers
    const answers = [
      { question: { subject_id: "subj-phy", chapter_id: "chap-rot", topic_id: "top-moi" }, is_correct: true, selected_option_id: "opt-1" },
      { question: { subject_id: "subj-phy", chapter_id: "chap-rot", topic_id: "top-moi" }, is_correct: false, selected_option_id: "opt-2" },
      { question: { subject_id: "subj-phy", chapter_id: "chap-rot", topic_id: "top-moi" }, is_correct: true, selected_option_id: "opt-1" },
      { question: { subject_id: "subj-phy", chapter_id: "chap-opt" }, is_correct: false, selected_option_id: "opt-3" },
      { question: { subject_id: "subj-phy", chapter_id: "chap-opt" }, is_correct: false, selected_option_id: "opt-3" },
      { question: { subject_id: "subj-phy", chapter_id: "chap-opt" }, is_correct: false, selected_option_id: "opt-4" },
    ];

    // 5. Mistakes
    const rawMistakes = [
      { student_id: "stu-2", mistake_type: "CONCEPTUAL_ERROR" as const, classification_status: "CONFIRMED", subject_name: "Physics", chapter_name: "Rotational Dynamics" },
      { student_id: "stu-2", mistake_type: "CALCULATION_ERROR" as const, classification_status: "SUGGESTED", subject_name: "Physics", chapter_name: "Rotational Dynamics" },
      { student_id: "stu-3", mistake_type: "UNABLE_TO_START" as const, classification_status: "CONFIRMED", subject_name: "Physics", chapter_name: "Ray Optics" },
    ];

    // Execute Pipeline Aggregations
    const metrics = calculateClassPerformanceMetrics(attempts, students.length);
    expect(metrics.total_attempts).toBe(5);
    expect(metrics.participation_rate).toBe(100); // 3 distinct students / 3 enrolled = 100%
    expect(metrics.completion_rate).toBe(100); // 5 completed / 5 total = 100%
    expect(metrics.highest_score).toBe(90);
    expect(metrics.lowest_score).toBe(30);

    const topicMastery = calculateClassTopicMastery(answers, subjectMap, chapterMap, topicMap);
    expect(topicMastery).toHaveLength(2);
    const rayOptics = topicMastery.find((t) => t.chapter_name === "Ray Optics")!;
    expect(rayOptics.accuracy_percentage).toBe(0);
    expect(rayOptics.evidence_status).toBe("NEEDS_ATTENTION");

    const mistakeMatrix = calculateClassMistakeMatrix(rawMistakes);
    expect(mistakeMatrix).toHaveLength(2);
    const rotMistakes = mistakeMatrix.find((m) => m.chapter_name === "Rotational Dynamics")!;
    expect(rotMistakes.total_mistakes).toBe(2);

    // Group attempts by student
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

    const studentRows = calculateStudentPerformanceRows(students, attemptsByStudent, mistakesByStudent, 2);
    expect(studentRows).toHaveLength(3);

    const aarav = studentRows.find((s) => s.student_id === "stu-1")!;
    expect(aarav.trend).toBe("IMPROVING"); // 80 -> 90 (+10)
    expect(aarav.attention_status).toBe("IMPROVING");

    const diya = studentRows.find((s) => s.student_id === "stu-2")!;
    expect(diya.trend).toBe("WORSENING"); // 50 -> 30 (-20)
    expect(diya.attention_status).toBe("NEEDS_REVIEW");

    const rohan = studentRows.find((s) => s.student_id === "stu-3")!;
    expect(rohan.attention_status).toBe("NEEDS_REVIEW"); // 1 attempt with accuracy 30% (<50%)

    // Assemble Bundle & Format CSV
    const bundle: ClassAnalyticsBundle = {
      class_id: "class-12a",
      class_name: "Class 12A JEE",
      grade: "12th",
      academic_year: 2026,
      total_students: students.length,
      performance_metrics: metrics,
      test_performances: [],
      topic_mastery: topicMastery,
      mistake_matrix: mistakeMatrix,
      student_rows: studentRows,
    };

    const csv = formatClassAnalyticsCsv(bundle);
    expect(csv).toContain("Aarav Sharma");
    expect(csv).toContain("Diya Patel");
    expect(csv).toContain("Rohan Gupta");
    expect(csv).toContain("Class 12A JEE");
  });
});
