import { describe, it, expect } from "vitest";
import { aggregateStudentMistakes } from "@/lib/mistakes/aggregator";
import { PersistentMistakeRecord } from "@/types/mistakes";

describe("Phase 12 Longitudinal Recurring Mistake & Trend Aggregator Suite", () => {
  const studentId = "stu-test-123";

  function createMockMistake(
    id: string,
    chapterName: string,
    mistakeType: any,
    testId: string,
    createdAt: string,
    resolutionStatus: "OPEN" | "IMPROVING" | "RESOLVED" = "OPEN"
  ): PersistentMistakeRecord {
    return {
      id,
      attempt_answer_id: `ans-${id}`,
      student_id: studentId,
      question_id: `q-${id}`,
      attempt_id: `att-${testId}`,
      test_id: testId,
      subject_id: "sub-phy",
      chapter_id: `chap-${chapterName.toLowerCase()}`,
      topic_id: null,
      mistake_type: mistakeType,
      classification_source: "RULE",
      classification_confidence: "MEDIUM",
      classification_status: "SUGGESTED",
      resolution_status: resolutionStatus,
      evidence: {
        time_spent_seconds: 120,
        correct_option_key: "A",
        difficulty: "MEDIUM",
        is_marked_for_review: false,
        is_unattempted: false,
      },
      created_at: createdAt,
      updated_at: createdAt,
      ...( { subject_name: "Physics", chapter_name: chapterName } as any ),
    };
  }

  /* ======================================================================== */
  /* 1. [UNIT] Recurring Patterns Thresholds                                  */
  /* ======================================================================== */
  describe("[UNIT] Recurring Pattern Detection & Configurable Thresholds", () => {
    it("does NOT mark 1 or 2 occurrences as recurring under default threshold (>=3)", () => {
      const mistakes = [
        createMockMistake("m1", "Rotation", "CALCULATION_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m2", "Rotation", "CALCULATION_ERROR", "test-2", "2026-09-05T10:00:00Z"),
      ];

      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.recurring_patterns_count).toBe(0);

      const pattern = summary.recurring_patterns.find(
        (p) => p.chapter_name === "Rotation" && p.mistake_type === "CALCULATION_ERROR"
      );
      expect(pattern).toBeDefined();
      expect(pattern?.is_recurring).toBe(false);
      expect(pattern?.total_occurrences).toBe(2);
    });

    it("marks >=3 occurrences across multiple tests as RECURRING", () => {
      const mistakes = [
        createMockMistake("m1", "Rotation", "CONCEPTUAL_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m2", "Rotation", "CONCEPTUAL_ERROR", "test-2", "2026-09-05T10:00:00Z"),
        createMockMistake("m3", "Rotation", "CONCEPTUAL_ERROR", "test-3", "2026-09-10T10:00:00Z"),
      ];

      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.recurring_patterns_count).toBe(1);

      const pattern = summary.recurring_patterns.find(
        (p) => p.chapter_name === "Rotation" && p.mistake_type === "CONCEPTUAL_ERROR"
      );
      expect(pattern?.is_recurring).toBe(true);
      expect(pattern?.total_occurrences).toBe(3);
      expect(pattern?.tests_affected_count).toBe(3);
    });

    it("respects custom configurable recurring threshold", () => {
      const mistakes = [
        createMockMistake("m1", "Thermodynamics", "FORMULA_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m2", "Thermodynamics", "FORMULA_ERROR", "test-2", "2026-09-05T10:00:00Z"),
      ];

      // Custom threshold = 2
      const summary = aggregateStudentMistakes(mistakes, studentId, { recurringThreshold: 2 });
      expect(summary.recurring_patterns_count).toBe(1);
      expect(summary.recurring_patterns[0].is_recurring).toBe(true);
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] Deterministic Trend & Resolution Calculations                 */
  /* ======================================================================== */
  describe("[UNIT] Deterministic Trend & Resolution Engine", () => {
    it("assigns INSUFFICIENT_DATA when occurrences < 2", () => {
      const mistakes = [
        createMockMistake("m1", "Electrostatics", "MISREAD_QUESTION", "test-1", "2026-09-01T10:00:00Z"),
      ];
      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.recurring_patterns[0].trend).toBe("INSUFFICIENT_DATA");
      expect(summary.recurring_patterns[0].resolution_status).toBe("OPEN");
    });

    it("assigns IMPROVING when subsequent records are marked IMPROVING", () => {
      const mistakes = [
        createMockMistake("m1", "Kinematics", "CALCULATION_ERROR", "test-1", "2026-09-01T10:00:00Z", "OPEN"),
        createMockMistake("m2", "Kinematics", "CALCULATION_ERROR", "test-2", "2026-09-05T10:00:00Z", "IMPROVING"),
      ];
      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.recurring_patterns[0].trend).toBe("IMPROVING");
      expect(summary.recurring_patterns[0].resolution_status).toBe("IMPROVING");
      expect(summary.improving_patterns_count).toBe(1);
    });

    it("assigns RESOLVED when mastery criteria are met", () => {
      const mistakes = [
        createMockMistake("m1", "Optics", "CONCEPTUAL_ERROR", "test-1", "2026-09-01T10:00:00Z", "OPEN"),
        createMockMistake("m2", "Optics", "CONCEPTUAL_ERROR", "test-2", "2026-09-05T10:00:00Z", "RESOLVED"),
      ];
      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.recurring_patterns[0].resolution_status).toBe("RESOLVED");
      expect(summary.resolved_patterns_count).toBe(1);
    });
  });

  /* ======================================================================== */
  /* 3. [UNIT] Topic + Error Taxonomy Matrix Aggregations                     */
  /* ======================================================================== */
  describe("[UNIT] Topic + Error Taxonomy Matrix", () => {
    it("correctly tabulates mistake counts across categories per chapter", () => {
      const mistakes = [
        createMockMistake("m1", "Rotation", "CONCEPTUAL_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m2", "Rotation", "CONCEPTUAL_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m3", "Rotation", "CALCULATION_ERROR", "test-1", "2026-09-01T10:00:00Z"),
        createMockMistake("m4", "Thermodynamics", "MISREAD_QUESTION", "test-1", "2026-09-01T10:00:00Z"),
      ];

      const summary = aggregateStudentMistakes(mistakes, studentId);
      expect(summary.total_mistakes).toBe(4);
      expect(summary.matrix).toHaveLength(2);

      const rotRow = summary.matrix.find((r) => r.chapter_name === "Rotation");
      expect(rotRow).toBeDefined();
      expect(rotRow?.total_mistakes).toBe(3);
      expect(rotRow?.category_counts.CONCEPTUAL_ERROR).toBe(2);
      expect(rotRow?.category_counts.CALCULATION_ERROR).toBe(1);
      expect(rotRow?.category_counts.MISREAD_QUESTION).toBe(0);

      const thermoRow = summary.matrix.find((r) => r.chapter_name === "Thermodynamics");
      expect(thermoRow?.total_mistakes).toBe(1);
      expect(thermoRow?.category_counts.MISREAD_QUESTION).toBe(1);
    });
  });
});
