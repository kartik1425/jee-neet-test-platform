import { describe, it, expect } from "vitest";
import { MockAIProvider } from "@/lib/ai/mockAdapter";
import { buildDeterministicAnalyticsPayload } from "@/lib/analytics/diagnosticAggregator";
import { AIDiagnosticReportSchema } from "@/types/diagnosticReport";
import { AttemptWithDetails, AnswerWithQuestion } from "@/lib/analytics/diagnosticAggregator";
import { Subject, Chapter } from "@/types/database";

describe("Phase 11 AI Diagnostic Report End-to-End Pipeline Suite", () => {
  const subjects: Subject[] = [
    { id: "sub-1", name: "Physics", code: "PHY", created_at: "2026-01-01" },
    { id: "sub-2", name: "Chemistry", code: "CHE", created_at: "2026-01-01" },
    { id: "sub-3", name: "Mathematics", code: "MAT", created_at: "2026-01-01" },
  ];

  const chapters: Chapter[] = [
    { id: "ch-1", subject_id: "sub-1", name: "Kinematics", order_index: 1, created_at: "2026-01-01" },
    { id: "ch-2", subject_id: "sub-2", name: "Atomic Structure", order_index: 2, created_at: "2026-01-01" },
    { id: "ch-3", subject_id: "sub-3", name: "Calculus", order_index: 3, created_at: "2026-01-01" },
  ];

  /* ======================================================================== */
  /* 1. [INTEGRATION] Pipeline Integration with 100% Score (Zero Mistakes)     */
  /* ======================================================================== */
  describe("[INTEGRATION] Perfect Score Attempt Handling", () => {
    it("handles zero incorrect questions gracefully with maintenance action plan", async () => {
      const perfectAttempt: AttemptWithDetails = {
        id: "att-perfect",
        test_id: "test-perfect",
        student_id: "stu-1",
        status: "SUBMITTED",
        started_at: "2026-09-21T10:00:00Z",
        submitted_at: "2026-09-21T11:00:00Z",
        server_end_time: "2026-09-21T11:00:00Z",
        time_spent_seconds: 3000,
        total_score: 12,
        accuracy_percentage: 100,
        calculated_stats: { total_attempted: 3, total_correct: 3, total_incorrect: 0 },
        created_at: "2026-09-21T10:00:00Z",
        updated_at: "2026-09-21T11:00:00Z",
        test: {
          id: "test-perfect",
          title: "Physics Sectional",
          exam_type: "JEE_MAIN",
          duration_minutes: 60,
          total_marks: 12,
        },
      };

      const perfectAnswers: AnswerWithQuestion[] = [1, 2, 3].map((i) => ({
        id: `ans-${i}`,
        attempt_id: "att-perfect",
        question_id: `q-${i}`,
        selected_option_id: `opt-${i}-a`,
        is_marked_for_review: false,
        is_visited: true,
        time_spent_seconds: 60,
        is_correct: true,
        marks_awarded: 4,
        last_saved_at: "2026-09-21T10:30:00Z",
        question: {
          id: `q-${i}`,
          subject_id: "sub-1",
          chapter_id: "ch-1",
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "MEDIUM",
          content_latex: `Question ${i}`,
          source_type: "INSTITUTE",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: `opt-${i}-a`, question_id: `q-${i}`, option_key: "A", content_latex: "Opt A", is_correct: true, order_index: 0, created_at: "2026-01-01" },
            { id: `opt-${i}-b`, question_id: `q-${i}`, option_key: "B", content_latex: "Opt B", is_correct: false, order_index: 1, created_at: "2026-01-01" },
            { id: `opt-${i}-c`, question_id: `q-${i}`, option_key: "C", content_latex: "Opt C", is_correct: false, order_index: 2, created_at: "2026-01-01" },
            { id: `opt-${i}-d`, question_id: `q-${i}`, option_key: "D", content_latex: "Opt D", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      }));

      const payload = buildDeterministicAnalyticsPayload(perfectAttempt, perfectAnswers, subjects, chapters);
      expect(payload.incorrect_questions).toHaveLength(0);
      expect(payload.accuracy_percentage).toBe(100);

      const provider = new MockAIProvider();
      const report = await provider.generateDiagnosticReport(payload);

      expect(report.mistake_analysis).toHaveLength(0);
      expect(report.action_plan.length).toBeGreaterThanOrEqual(1);
      expect(AIDiagnosticReportSchema.safeParse(report).success).toBe(true);
    });
  });

  /* ======================================================================== */
  /* 2. [INTEGRATION] Multi-Subject 6-Section Full Pipeline Check             */
  /* ======================================================================== */
  describe("[INTEGRATION] Multi-Subject Realistic Attempt", () => {
    it("preserves exact evidence thresholds across subjects through the full pipeline", async () => {
      const attempt: AttemptWithDetails = {
        id: "att-multi",
        test_id: "test-multi",
        student_id: "stu-2",
        status: "SUBMITTED",
        started_at: "2026-09-21T09:00:00Z",
        submitted_at: "2026-09-21T12:00:00Z",
        server_end_time: "2026-09-21T12:00:00Z",
        time_spent_seconds: 10800,
        total_score: 30,
        accuracy_percentage: 60,
        calculated_stats: { total_attempted: 10, total_correct: 6, total_incorrect: 4 },
        created_at: "2026-09-21T09:00:00Z",
        updated_at: "2026-09-21T12:00:00Z",
        test: {
          id: "test-multi",
          title: "Full Length Mock 1",
          exam_type: "JEE_MAIN",
          duration_minutes: 180,
          total_marks: 120,
        },
      };

      // 4 questions in Kinematics (3 correct, 1 incorrect => 75% => STRONG)
      // 4 questions in Atomic Structure (1 correct, 3 incorrect => 25% => NEEDS_ATTENTION)
      // 1 question in Calculus (0 correct, 1 incorrect => 0% => INSUFFICIENT_DATA because total attempted < 2)
      const answers: AnswerWithQuestion[] = [
        // Kinematics (4)
        ...[1, 2, 3].map((i) => createMockAnswer("att-multi", `q-kin-${i}`, "sub-1", "ch-1", true, 60)),
        createMockAnswer("att-multi", "q-kin-4", "sub-1", "ch-1", false, 180),
        // Atomic Structure (4)
        createMockAnswer("att-multi", "q-atom-1", "sub-2", "ch-2", true, 50),
        ...[2, 3, 4].map((i) => createMockAnswer("att-multi", `q-atom-${i}`, "sub-2", "ch-2", false, 120)),
        // Calculus (1)
        createMockAnswer("att-multi", "q-calc-1", "sub-3", "ch-3", false, 300),
      ];

      const payload = buildDeterministicAnalyticsPayload(attempt, answers, subjects, chapters);

      // Verify deterministic classifications
      const kinChap = payload.chapter_metrics.find((c) => c.chapter_name === "Kinematics");
      const atomChap = payload.chapter_metrics.find((c) => c.chapter_name === "Atomic Structure");
      const calcChap = payload.chapter_metrics.find((c) => c.chapter_name === "Calculus");

      expect(kinChap?.evidence_status).toBe("STRONG");
      expect(atomChap?.evidence_status).toBe("NEEDS_ATTENTION");
      expect(calcChap?.evidence_status).toBe("INSUFFICIENT_DATA");

      // Verify AI interpretation matches evidence status
      const provider = new MockAIProvider();
      const report = await provider.generateDiagnosticReport(payload);

      const aiCalc = report.chapter_analysis.find((c) => c.chapter_name === "Calculus");
      expect(aiCalc?.status).toBe("INSUFFICIENT_DATA");
      expect(aiCalc?.confidence).toBe("LOW");

      const aiAtom = report.chapter_analysis.find((c) => c.chapter_name === "Atomic Structure");
      expect(aiAtom?.status).toBe("NEEDS_ATTENTION");
      expect(aiAtom?.confidence).toBe("HIGH");

      // Action plan prioritizes Atomic Structure
      expect(report.action_plan[0].topic_name).toBe("Atomic Structure");
    });
  });
});

function createMockAnswer(
  attemptId: string,
  questionId: string,
  subjectId: string,
  chapterId: string,
  isCorrect: boolean,
  timeSpent: number
): AnswerWithQuestion {
  return {
    id: `ans-${questionId}`,
    attempt_id: attemptId,
    question_id: questionId,
    selected_option_id: isCorrect ? `opt-${questionId}-a` : `opt-${questionId}-b`,
    is_marked_for_review: false,
    is_visited: true,
    time_spent_seconds: timeSpent,
    is_correct: isCorrect,
    marks_awarded: isCorrect ? 4 : -1,
    last_saved_at: "2026-09-21T10:00:00Z",
    question: {
      id: questionId,
      subject_id: subjectId,
      chapter_id: chapterId,
      exam_type: "JEE_MAIN",
      question_type: "SINGLE_MCQ",
      difficulty: "MEDIUM",
      content_latex: `Question ${questionId}`,
      source_type: "INSTITUTE",
      status: "APPROVED",
      is_active: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      options: [
        { id: `opt-${questionId}-a`, question_id: questionId, option_key: "A", content_latex: "Correct Opt", is_correct: true, order_index: 0, created_at: "2026-01-01" },
        { id: `opt-${questionId}-b`, question_id: questionId, option_key: "B", content_latex: "Wrong Opt", is_correct: false, order_index: 1, created_at: "2026-01-01" },
        { id: `opt-${questionId}-c`, question_id: questionId, option_key: "C", content_latex: "Other Opt", is_correct: false, order_index: 2, created_at: "2026-01-01" },
        { id: `opt-${questionId}-d`, question_id: questionId, option_key: "D", content_latex: "Another Opt", is_correct: false, order_index: 3, created_at: "2026-01-01" },
      ],
    },
  };
}
