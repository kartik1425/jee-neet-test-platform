import { describe, it, expect } from "vitest";
import {
  calculateMedian,
  calculateClassPerformanceMetrics,
  calculateClassTopicMastery,
  calculateClassMistakeMatrix,
  calculateStudentPerformanceRows,
  calculateQuestionStruggleAnalysis,
  formatClassAnalyticsCsv,
} from "@/lib/teacher/analytics";
import { ClassAnalyticsBundle } from "@/types/teacherAnalytics";

describe("Phase 13 Teacher Class Analytics Suite [UNIT]", () => {
  /* ======================================================================== */
  /* 1. [UNIT] Deterministic Median Calculation                               */
  /* ======================================================================== */
  describe("[UNIT] calculateMedian", () => {
    it("returns 0 for empty array", () => {
      expect(calculateMedian([])).toBe(0);
    });

    it("returns single element for 1-item array", () => {
      expect(calculateMedian([42])).toBe(42);
    });

    it("computes middle value for odd-length array", () => {
      expect(calculateMedian([10, 50, 30])).toBe(30);
      expect(calculateMedian([5, 1, 9, 3, 7])).toBe(5);
    });

    it("computes average of two middle values for even-length array", () => {
      expect(calculateMedian([10, 20, 30, 40])).toBe(25);
      expect(calculateMedian([10, 20])).toBe(15);
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] Class Performance Metrics                                      */
  /* ======================================================================== */
  describe("[UNIT] calculateClassPerformanceMetrics", () => {
    it("handles zero attempts gracefully", () => {
      const res = calculateClassPerformanceMetrics([], 30);
      expect(res.average_score).toBe(0);
      expect(res.median_score).toBe(0);
      expect(res.average_accuracy).toBe(0);
      expect(res.participation_rate).toBe(0);
      expect(res.completion_rate).toBe(0);
      expect(res.total_attempts).toBe(0);
      expect(res.highest_score).toBe(0);
      expect(res.lowest_score).toBe(0);
    });

    it("calculates accurate mean, median, participation, and completion", () => {
      const attempts = [
        { student_id: "s1", total_score: 100, accuracy_percentage: 80, status: "SUBMITTED" },
        { student_id: "s2", total_score: 80, accuracy_percentage: 60, status: "SUBMITTED" },
        { student_id: "s3", total_score: 60, accuracy_percentage: 40, status: "AUTO_SUBMITTED" },
        { student_id: "s4", total_score: 0, accuracy_percentage: 0, status: "IN_PROGRESS" },
      ];

      const res = calculateClassPerformanceMetrics(attempts, 4);

      expect(res.total_attempts).toBe(4);
      expect(res.average_score).toBe(80); // (100 + 80 + 60) / 3 = 80
      expect(res.median_score).toBe(80);
      expect(res.average_accuracy).toBe(60); // (80 + 60 + 40) / 3 = 60
      expect(res.participation_rate).toBe(100); // 4 distinct students with attempts / 4 enrolled = 100%
      expect(res.completion_rate).toBe(75); // 3 completed / 4 attempts = 75%
      expect(res.highest_score).toBe(100);
      expect(res.lowest_score).toBe(60);
    });
  });

  /* ======================================================================== */
  /* 3. [UNIT] Class Topic Mastery Breakdown & Evidence Thresholds             */
  /* ======================================================================== */
  describe("[UNIT] calculateClassTopicMastery", () => {
    const subjectMap = new Map([["subj-1", "Physics"]]);
    const chapterMap = new Map([["chap-1", "Rotational Dynamics"], ["chap-2", "Electrostatics"]]);
    const topicMap = new Map([["top-1", "Moment of Inertia"]]);

    it("marks topics with <2 attempts as INSUFFICIENT_DATA", () => {
      const answers = [
        {
          question: { subject_id: "subj-1", chapter_id: "chap-1", topic_id: "top-1" },
          is_correct: true,
          selected_option_id: "opt-1",
        },
      ];

      const res = calculateClassTopicMastery(answers, subjectMap, chapterMap, topicMap);
      expect(res).toHaveLength(1);
      expect(res[0].evidence_status).toBe("INSUFFICIENT_DATA");
      expect(res[0].attempted_count).toBe(1);
      expect(res[0].accuracy_percentage).toBe(100);
    });

    it("marks topics with >=3 attempts and <50% accuracy as NEEDS_ATTENTION", () => {
      const answers = [
        {
          question: { subject_id: "subj-1", chapter_id: "chap-1", topic_id: "top-1" },
          is_correct: false,
          selected_option_id: "opt-1",
        },
        {
          question: { subject_id: "subj-1", chapter_id: "chap-1", topic_id: "top-1" },
          is_correct: false,
          selected_option_id: "opt-1",
        },
        {
          question: { subject_id: "subj-1", chapter_id: "chap-1", topic_id: "top-1" },
          is_correct: true,
          selected_option_id: "opt-1",
        },
      ];

      const res = calculateClassTopicMastery(answers, subjectMap, chapterMap, topicMap);
      expect(res).toHaveLength(1);
      expect(res[0].evidence_status).toBe("NEEDS_ATTENTION");
      expect(res[0].accuracy_percentage).toBe(33); // 1 / 3 = 33%
    });

    it("marks topics with >=70% accuracy as STRONG", () => {
      const answers = [
        {
          question: { subject_id: "subj-1", chapter_id: "chap-2" },
          is_correct: true,
          selected_option_id: "opt-1",
        },
        {
          question: { subject_id: "subj-1", chapter_id: "chap-2" },
          is_correct: true,
          selected_option_id: "opt-1",
        },
        {
          question: { subject_id: "subj-1", chapter_id: "chap-2" },
          is_correct: true,
          selected_option_id: "opt-1",
        },
      ];

      const res = calculateClassTopicMastery(answers, subjectMap, chapterMap, topicMap);
      expect(res).toHaveLength(1);
      expect(res[0].evidence_status).toBe("STRONG");
      expect(res[0].accuracy_percentage).toBe(100);
    });
  });

  /* ======================================================================== */
  /* 4. [UNIT] Class Mistake Matrix Aggregation                               */
  /* ======================================================================== */
  describe("[UNIT] calculateClassMistakeMatrix", () => {
    it("aggregates mistakes by subject and chapter across all 10 categories", () => {
      const mistakes = [
        {
          mistake_type: "CONCEPTUAL_ERROR" as const,
          classification_status: "CONFIRMED",
          subject_name: "Physics",
          chapter_name: "Rotational Dynamics",
        },
        {
          mistake_type: "CONCEPTUAL_ERROR" as const,
          classification_status: "SUGGESTED",
          subject_name: "Physics",
          chapter_name: "Rotational Dynamics",
        },
        {
          mistake_type: "CALCULATION_ERROR" as const,
          classification_status: "CONFIRMED",
          subject_name: "Physics",
          chapter_name: "Rotational Dynamics",
        },
        {
          mistake_type: "TIME_PRESSURE" as const,
          classification_status: "SUGGESTED",
          subject_name: "Chemistry",
          chapter_name: "Thermodynamics",
        },
      ];

      const res = calculateClassMistakeMatrix(mistakes);
      expect(res).toHaveLength(2);

      const rot = res.find((r) => r.chapter_name === "Rotational Dynamics")!;
      expect(rot.total_mistakes).toBe(3);
      expect(rot.confirmed_count).toBe(2);
      expect(rot.suggested_count).toBe(1);
      expect(rot.category_counts.CONCEPTUAL_ERROR).toBe(2);
      expect(rot.category_counts.CALCULATION_ERROR).toBe(1);
      expect(rot.category_counts.FORMULA_ERROR).toBe(0);

      const thermo = res.find((r) => r.chapter_name === "Thermodynamics")!;
      expect(thermo.total_mistakes).toBe(1);
      expect(thermo.category_counts.TIME_PRESSURE).toBe(1);
    });
  });

  /* ======================================================================== */
  /* 5. [UNIT] Student Performance Rows & Deterministic Trends                */
  /* ======================================================================== */
  describe("[UNIT] calculateStudentPerformanceRows", () => {
    const students = [
      { id: "s1", full_name: "Aarav Sharma", email: "aarav@school.edu" },
      { id: "s2", full_name: "Diya Patel", email: "diya@school.edu" },
      { id: "s3", full_name: "Rohan Gupta", email: "rohan@school.edu" },
    ];

    it("calculates trend as IMPROVING when recent accuracy gains >= 5%", () => {
      const attemptsByStudent = new Map([
        [
          "s1",
          [
            { id: "a1", total_score: 50, accuracy_percentage: 50, status: "SUBMITTED", created_at: "2026-09-01T00:00:00Z" },
            { id: "a2", total_score: 70, accuracy_percentage: 75, status: "SUBMITTED", created_at: "2026-09-05T00:00:00Z" },
          ],
        ],
      ]);

      const rows = calculateStudentPerformanceRows(students.slice(0, 1), attemptsByStudent, new Map(), 2);
      expect(rows[0].trend).toBe("IMPROVING");
      expect(rows[0].average_accuracy).toBe(63); // (50 + 75) / 2 = 62.5 -> 63
      expect(rows[0].attention_status).toBe("IMPROVING");
    });

    it("calculates trend as WORSENING and status NEEDS_REVIEW when accuracy drops >= 5%", () => {
      const attemptsByStudent = new Map([
        [
          "s2",
          [
            { id: "a1", total_score: 80, accuracy_percentage: 80, status: "SUBMITTED", created_at: "2026-09-01T00:00:00Z" },
            { id: "a2", total_score: 40, accuracy_percentage: 45, status: "SUBMITTED", created_at: "2026-09-05T00:00:00Z" },
          ],
        ],
      ]);

      const rows = calculateStudentPerformanceRows(students.slice(1, 2), attemptsByStudent, new Map(), 2);
      expect(rows[0].trend).toBe("WORSENING");
      expect(rows[0].attention_status).toBe("NEEDS_REVIEW");
    });

    it("flags NEEDS_REVIEW if student has >=3 recurring mistakes even if accuracy is above 50%", () => {
      const attemptsByStudent = new Map([
        [
          "s3",
          [
            { id: "a1", total_score: 60, accuracy_percentage: 60, status: "SUBMITTED", created_at: "2026-09-01T00:00:00Z" },
            { id: "a2", total_score: 60, accuracy_percentage: 60, status: "SUBMITTED", created_at: "2026-09-05T00:00:00Z" },
          ],
        ],
      ]);

      const mistakesByStudent = new Map([
        [
          "s3",
          [
            { mistake_type: "CONCEPTUAL_ERROR", is_recurring: true },
            { mistake_type: "FORMULA_ERROR", is_recurring: true },
            { mistake_type: "CALCULATION_ERROR", is_recurring: true },
          ],
        ],
      ]);

      const rows = calculateStudentPerformanceRows(students.slice(2, 3), attemptsByStudent, mistakesByStudent, 2);
      expect(rows[0].recurring_mistake_count).toBe(3);
      expect(rows[0].attention_status).toBe("NEEDS_REVIEW");
    });
  });

  /* ======================================================================== */
  /* 6. [UNIT] Question Struggle & Distractor Analysis                        */
  /* ======================================================================== */
  describe("[UNIT] calculateQuestionStruggleAnalysis", () => {
    const testQuestions = [
      {
        id: "tq1",
        question_id: "q1",
        order_index: 1,
        question: {
          id: "q1",
          content_latex: "Find the work done: $\\int F \\cdot dr$",
          difficulty: "HARD",
          subject_id: "subj-1",
          chapter_id: "chap-1",
          options: [
            { id: "opt-A", option_key: "A", content_latex: "10 J", is_correct: false },
            { id: "opt-B", option_key: "B", content_latex: "20 J", is_correct: true },
            { id: "opt-C", option_key: "C", content_latex: "30 J", is_correct: false },
            { id: "opt-D", option_key: "D", content_latex: "40 J", is_correct: false },
          ],
        },
      },
    ];

    const subjectMap = new Map([["subj-1", "Physics"]]);
    const chapterMap = new Map([["chap-1", "Work and Energy"]]);
    const topicMap = new Map();

    it("computes option distribution and identifies the primary distractor trap", () => {
      const answers = [
        { question_id: "q1", selected_option_id: "opt-B", is_correct: true },
        { question_id: "q1", selected_option_id: "opt-A", is_correct: false },
        { question_id: "q1", selected_option_id: "opt-A", is_correct: false },
        { question_id: "q1", selected_option_id: "opt-C", is_correct: false },
      ];

      const res = calculateQuestionStruggleAnalysis(testQuestions as any, answers, subjectMap, chapterMap, topicMap);
      expect(res).toHaveLength(1);

      const q = res[0];
      expect(q.total_attempts).toBe(4);
      expect(q.correct_count).toBe(1);
      expect(q.incorrect_count).toBe(3);
      expect(q.accuracy_percentage).toBe(25); // 1/4 = 25%
      expect(q.most_selected_wrong_option_key).toBe("A"); // Option A was picked twice

      const optA = q.options.find((o) => o.option_key === "A")!;
      expect(optA.selected_count).toBe(2);
      expect(optA.selected_percentage).toBe(50);
    });
  });

  /* ======================================================================== */
  /* 7. [UNIT] CSV Export Formatting                                          */
  /* ======================================================================== */
  describe("[UNIT] formatClassAnalyticsCsv", () => {
    it("generates correctly formatted CSV rows with escaped fields", () => {
      const bundle: ClassAnalyticsBundle = {
        class_id: "class-1",
        class_name: 'JEE "Elite" Batch',
        grade: "12th",
        academic_year: 2026,
        total_students: 2,
        performance_metrics: {
          average_score: 75.5,
          median_score: 75,
          average_accuracy: 68,
          participation_rate: 100,
          completion_rate: 100,
          total_attempts: 2,
          highest_score: 90,
          lowest_score: 61,
        },
        test_performances: [],
        topic_mastery: [],
        mistake_matrix: [],
        student_rows: [
          {
            student_id: "s1",
            student_name: 'Aarav "Ace" Sharma',
            email: "aarav@school.edu",
            tests_completed: 2,
            total_tests_assigned: 2,
            average_score: 90,
            average_accuracy: 85,
            total_questions_solved: 60,
            recurring_mistake_count: 0,
            weak_topic_count: 0,
            trend: "IMPROVING",
            attention_status: "IMPROVING",
            last_attempt_at: "2026-09-10T10:00:00Z",
          },
        ],
      };

      const csv = formatClassAnalyticsCsv(bundle);
      expect(csv).toContain("Student Name,Email,Class,Grade,Tests Completed");
      expect(csv).toContain('"Aarav ""Ace"" Sharma","aarav@school.edu","JEE ""Elite"" Batch","12th",2,90,85%,IMPROVING,IMPROVING,0');
    });
  });
});
