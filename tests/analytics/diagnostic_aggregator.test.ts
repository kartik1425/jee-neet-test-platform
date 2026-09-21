import { describe, it, expect } from "vitest";
import {
  determineChapterEvidenceStatus,
  buildDeterministicAnalyticsPayload,
} from "@/lib/analytics/diagnosticAggregator";
import { AttemptWithDetails, AnswerWithQuestion } from "@/lib/analytics/diagnosticAggregator";
import { Subject, Chapter, Topic } from "@/types/database";

describe("Phase 11 Diagnostic Analytics Aggregator & Evidence Threshold Suite", () => {
  /* ======================================================================== */
  /* 1. [UNIT] Evidence Threshold Tests                                       */
  /* ======================================================================== */
  describe("[UNIT] Evidence Thresholds (determineChapterEvidenceStatus)", () => {
    it("classifies < 2 attempts as INSUFFICIENT_DATA regardless of accuracy", () => {
      // 0 attempts
      expect(determineChapterEvidenceStatus(5, 0, 0)).toBe("INSUFFICIENT_DATA");
      // 1 attempt with 0% accuracy
      expect(determineChapterEvidenceStatus(1, 1, 0)).toBe("INSUFFICIENT_DATA");
      // 1 attempt with 100% accuracy
      expect(determineChapterEvidenceStatus(1, 1, 100)).toBe("INSUFFICIENT_DATA");
    });

    it("classifies >= 2 attempts with >= 70% accuracy as STRONG", () => {
      expect(determineChapterEvidenceStatus(2, 2, 100)).toBe("STRONG");
      expect(determineChapterEvidenceStatus(4, 4, 75)).toBe("STRONG");
      expect(determineChapterEvidenceStatus(10, 10, 80)).toBe("STRONG");
    });

    it("classifies >= 2 attempts with < 50% accuracy as NEEDS_ATTENTION", () => {
      expect(determineChapterEvidenceStatus(2, 2, 0)).toBe("NEEDS_ATTENTION");
      expect(determineChapterEvidenceStatus(3, 3, 33)).toBe("NEEDS_ATTENTION");
      expect(determineChapterEvidenceStatus(5, 5, 40)).toBe("NEEDS_ATTENTION");
    });

    it("defaults intermediate 50-69% accuracy to STRONG or acceptable", () => {
      expect(determineChapterEvidenceStatus(3, 3, 66)).toBe("STRONG");
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] Mathematical & Aggregation Invariants                          */
  /* ======================================================================== */
  describe("[UNIT] buildDeterministicAnalyticsPayload Facts & Boundaries", () => {
    const mockSubjects: Subject[] = [
      { id: "sub-1", name: "Physics", code: "PHY", created_at: "2026-01-01" },
      { id: "sub-2", name: "Chemistry", code: "CHE", created_at: "2026-01-01" },
    ];

    const mockChapters: Chapter[] = [
      { id: "chap-1", subject_id: "sub-1", name: "Rotation", order_index: 1, created_at: "2026-01-01" },
      { id: "chap-2", subject_id: "sub-2", name: "Thermodynamics", order_index: 2, created_at: "2026-01-01" },
    ];

    const mockTopics: Topic[] = [
      { id: "top-1", chapter_id: "chap-1", name: "Torque", order_index: 1, created_at: "2026-01-01" },
    ];

    const mockAttempt: AttemptWithDetails = {
      id: "att-123",
      test_id: "test-456",
      student_id: "stu-789",
      status: "SUBMITTED",
      started_at: "2026-09-21T10:00:00Z",
      submitted_at: "2026-09-21T11:00:00Z",
      server_end_time: "2026-09-21T11:00:00Z",
      time_spent_seconds: 3600,
      total_score: 8,
      accuracy_percentage: 50,
      calculated_stats: {
        total_attempted: 4,
        total_correct: 2,
        total_incorrect: 2,
      },
      created_at: "2026-09-21T10:00:00Z",
      updated_at: "2026-09-21T11:00:00Z",
      test: {
        id: "test-456",
        title: "JEE Mock Paper 1",
        exam_type: "JEE_MAIN",
        duration_minutes: 60,
        total_marks: 20,
      },
    };

    const mockAnswers: AnswerWithQuestion[] = [
      // Q1: Physics - Rotation - Correct
      {
        id: "ans-1",
        attempt_id: "att-123",
        question_id: "q-1",
        selected_option_id: "opt-1-a",
        is_marked_for_review: false,
        is_visited: true,
        time_spent_seconds: 120,
        is_correct: true,
        marks_awarded: 4,
        last_saved_at: "2026-09-21T10:10:00Z",
        question: {
          id: "q-1",
          subject_id: "sub-1",
          chapter_id: "chap-1",
          topic_id: "top-1",
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "MEDIUM",
          content_latex: "Find torque $\\tau$.",
          explanation_latex: "$\\tau = r \\times F$",
          source_type: "PYQ",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: "opt-1-a", question_id: "q-1", option_key: "A", content_latex: "10 Nm", is_correct: true, order_index: 0, created_at: "2026-01-01" },
            { id: "opt-1-b", question_id: "q-1", option_key: "B", content_latex: "20 Nm", is_correct: false, order_index: 1, created_at: "2026-01-01" },
            { id: "opt-1-c", question_id: "q-1", option_key: "C", content_latex: "30 Nm", is_correct: false, order_index: 2, created_at: "2026-01-01" },
            { id: "opt-1-d", question_id: "q-1", option_key: "D", content_latex: "40 Nm", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      },
      // Q2: Physics - Rotation - Incorrect
      {
        id: "ans-2",
        attempt_id: "att-123",
        question_id: "q-2",
        selected_option_id: "opt-2-b",
        is_marked_for_review: true,
        is_visited: true,
        time_spent_seconds: 200,
        is_correct: false,
        marks_awarded: -1,
        last_saved_at: "2026-09-21T10:20:00Z",
        question: {
          id: "q-2",
          subject_id: "sub-1",
          chapter_id: "chap-1",
          topic_id: "top-1",
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "HARD",
          content_latex: "Moment of inertia of a disk.",
          explanation_latex: "$I = \\frac{1}{2} M R^2$",
          source_type: "PYQ",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: "opt-2-a", question_id: "q-2", option_key: "A", content_latex: "$M R^2$", is_correct: false, order_index: 0, created_at: "2026-01-01" },
            { id: "opt-2-b", question_id: "q-2", option_key: "B", content_latex: "$2 M R^2$", is_correct: false, order_index: 1, created_at: "2026-01-01" },
            { id: "opt-2-c", question_id: "q-2", option_key: "C", content_latex: "$\\frac{1}{2} M R^2$", is_correct: true, order_index: 2, created_at: "2026-01-01" },
            { id: "opt-2-d", question_id: "q-2", option_key: "D", content_latex: "$\\frac{1}{4} M R^2$", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      },
      // Q3: Physics - Rotation - Incorrect
      {
        id: "ans-3",
        attempt_id: "att-123",
        question_id: "q-3",
        selected_option_id: "opt-3-a",
        is_marked_for_review: false,
        is_visited: true,
        time_spent_seconds: 40,
        is_correct: false,
        marks_awarded: -1,
        last_saved_at: "2026-09-21T10:30:00Z",
        question: {
          id: "q-3",
          subject_id: "sub-1",
          chapter_id: "chap-1",
          topic_id: "top-1",
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "MEDIUM",
          content_latex: "Angular momentum formula.",
          explanation_latex: "$L = I \\omega$",
          source_type: "PYQ",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: "opt-3-a", question_id: "q-3", option_key: "A", content_latex: "$I / \\omega$", is_correct: false, order_index: 0, created_at: "2026-01-01" },
            { id: "opt-3-b", question_id: "q-3", option_key: "B", content_latex: "$I \\omega$", is_correct: true, order_index: 1, created_at: "2026-01-01" },
            { id: "opt-3-c", question_id: "q-3", option_key: "C", content_latex: "$I^2 \\omega$", is_correct: false, order_index: 2, created_at: "2026-01-01" },
            { id: "opt-3-d", question_id: "q-3", option_key: "D", content_latex: "$I / \\omega^2$", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      },
      // Q4: Chemistry - Thermodynamics - Correct
      {
        id: "ans-4",
        attempt_id: "att-123",
        question_id: "q-4",
        selected_option_id: "opt-4-a",
        is_marked_for_review: false,
        is_visited: true,
        time_spent_seconds: 60,
        is_correct: true,
        marks_awarded: 4,
        last_saved_at: "2026-09-21T10:40:00Z",
        question: {
          id: "q-4",
          subject_id: "sub-2",
          chapter_id: "chap-2",
          topic_id: null,
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "EASY",
          content_latex: "First law of thermodynamics.",
          explanation_latex: "$\\Delta U = q + w$",
          source_type: "PYQ",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: "opt-4-a", question_id: "q-4", option_key: "A", content_latex: "$\\Delta U = q + w$", is_correct: true, order_index: 0, created_at: "2026-01-01" },
            { id: "opt-4-b", question_id: "q-4", option_key: "B", content_latex: "$\\Delta U = q - w$", is_correct: false, order_index: 1, created_at: "2026-01-01" },
            { id: "opt-4-c", question_id: "q-4", option_key: "C", content_latex: "$\\Delta U = w / q$", is_correct: false, order_index: 2, created_at: "2026-01-01" },
            { id: "opt-4-d", question_id: "q-4", option_key: "D", content_latex: "$\\Delta U = 0$", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      },
      // Q5: Chemistry - Thermodynamics - Unattempted
      {
        id: "ans-5",
        attempt_id: "att-123",
        question_id: "q-5",
        selected_option_id: null,
        is_marked_for_review: false,
        is_visited: false,
        time_spent_seconds: 0,
        is_correct: null,
        marks_awarded: 0,
        last_saved_at: "2026-09-21T10:50:00Z",
        question: {
          id: "q-5",
          subject_id: "sub-2",
          chapter_id: "chap-2",
          topic_id: null,
          exam_type: "JEE_MAIN",
          question_type: "SINGLE_MCQ",
          difficulty: "MEDIUM",
          content_latex: "Enthalpy change.",
          explanation_latex: "$\\Delta H = \\Delta U + P\\Delta V$",
          source_type: "PYQ",
          status: "APPROVED",
          is_active: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          options: [
            { id: "opt-5-a", question_id: "q-5", option_key: "A", content_latex: "$\\Delta H = \\Delta U + P\\Delta V$", is_correct: true, order_index: 0, created_at: "2026-01-01" },
            { id: "opt-5-b", question_id: "q-5", option_key: "B", content_latex: "$\\Delta H = \\Delta U$", is_correct: false, order_index: 1, created_at: "2026-01-01" },
            { id: "opt-5-c", question_id: "q-5", option_key: "C", content_latex: "$\\Delta H = P\\Delta V$", is_correct: false, order_index: 2, created_at: "2026-01-01" },
            { id: "opt-5-d", question_id: "q-5", option_key: "D", content_latex: "$\\Delta H = 0$", is_correct: false, order_index: 3, created_at: "2026-01-01" },
          ],
        },
      },
    ];

    it("aggregates exact scores, correct/incorrect/unattempted counts", () => {
      const payload = buildDeterministicAnalyticsPayload(
        mockAttempt,
        mockAnswers,
        mockSubjects,
        mockChapters,
        mockTopics
      );

      expect(payload.attempt_id).toBe("att-123");
      expect(payload.test_id).toBe("test-456");
      expect(payload.total_attempted).toBe(4);
      expect(payload.total_correct).toBe(2);
      expect(payload.total_incorrect).toBe(2);
      expect(payload.total_unattempted).toBe(1);
    });

    it("correctly applies evidence status to chapters based on sample size", () => {
      const payload = buildDeterministicAnalyticsPayload(
        mockAttempt,
        mockAnswers,
        mockSubjects,
        mockChapters,
        mockTopics
      );

      // Rotation has 3 attempts, 1 correct (33% accuracy) => NEEDS_ATTENTION
      const rot = payload.chapter_metrics.find((c) => c.chapter_name === "Rotation");
      expect(rot).toBeDefined();
      expect(rot?.attempted).toBe(3);
      expect(rot?.correct).toBe(1);
      expect(rot?.accuracy).toBe(33);
      expect(rot?.evidence_status).toBe("NEEDS_ATTENTION");

      // Thermodynamics has 1 attempted (100% accuracy) out of 2 questions => INSUFFICIENT_DATA because attempted < 2
      const thermo = payload.chapter_metrics.find((c) => c.chapter_name === "Thermodynamics");
      expect(thermo).toBeDefined();
      expect(thermo?.attempted).toBe(1);
      expect(thermo?.evidence_status).toBe("INSUFFICIENT_DATA");
    });

    it("calculates time metrics: avg time on correct vs incorrect", () => {
      const payload = buildDeterministicAnalyticsPayload(
        mockAttempt,
        mockAnswers,
        mockSubjects,
        mockChapters,
        mockTopics
      );

      // Correct times: Q1 (120s), Q4 (60s) => avg = 90s
      expect(payload.time_metrics.avg_time_correct_seconds).toBe(90);
      // Incorrect times: Q2 (200s), Q3 (40s) => avg = 120s
      expect(payload.time_metrics.avg_time_incorrect_seconds).toBe(120);
      // Longest question: Q2 with 200s
      expect(payload.time_metrics.longest_question_id).toBe("q-2");
      expect(payload.time_metrics.longest_question_seconds).toBe(200);
    });

    it("extracts precise incorrect question evidence for AI diagnosis without leaking PII", () => {
      const payload = buildDeterministicAnalyticsPayload(
        mockAttempt,
        mockAnswers,
        mockSubjects,
        mockChapters,
        mockTopics
      );

      expect(payload.incorrect_questions).toHaveLength(2);

      const q2Evidence = payload.incorrect_questions.find((q) => q.question_id === "q-2");
      expect(q2Evidence).toBeDefined();
      expect(q2Evidence?.selected_option_key).toBe("B");
      expect(q2Evidence?.correct_option_key).toBe("C");
      expect(q2Evidence?.marks_awarded).toBe(-1);
      expect(q2Evidence?.time_spent_seconds).toBe(200);
      expect(q2Evidence?.marked_for_review).toBe(true);

      // Verify no student name, email, or personal identifiers exist in payload
      const jsonStr = JSON.stringify(payload);
      expect(jsonStr).not.toContain("stu-789");
      expect(jsonStr).not.toContain("email");
    });
  });
});
