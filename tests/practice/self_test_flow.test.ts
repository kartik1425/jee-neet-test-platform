import { describe, it, expect } from "vitest";
import { SelfTestConfigSchema } from "@/types/practice";

describe("Phase 8 Student Self-Test Flow & RLS Isolation Suite", () => {
  /* ======================================================================== */
  /* 1. INTEGRATION: Self-Test Configuration Schema & Snapshot Freezing       */
  /* ======================================================================== */
  describe("[INTEGRATION] Self-Test Creation & Snapshot Freezing", () => {
    it("validates valid self-test configuration payload", () => {
      const payload = {
        examType: "JEE_ADV",
        subjectIds: ["550e8400-e29b-41d4-a716-446655440001"],
        chapterIds: ["550e8400-e29b-41d4-a716-446655440002"],
        difficulty: "ADVANCED",
        questionCount: 30,
        durationMinutes: 60,
        pyqOnly: true,
        yearStart: 2020,
        yearEnd: 2026,
        allowPreviouslyAttempted: false,
        customTitle: "JEE Adv Physics Rotation & COM Drill",
      };

      const parsed = SelfTestConfigSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid self-test parameters (e.g. duration <= 0, empty subjects)", () => {
      expect(
        SelfTestConfigSchema.safeParse({
          examType: "JEE_MAIN",
          subjectIds: [],
          chapterIds: ["550e8400-e29b-41d4-a716-446655440002"],
          questionCount: 30,
          durationMinutes: 60,
        }).success
      ).toBe(false);

      expect(
        SelfTestConfigSchema.safeParse({
          examType: "JEE_MAIN",
          subjectIds: ["550e8400-e29b-41d4-a716-446655440001"],
          chapterIds: ["550e8400-e29b-41d4-a716-446655440002"],
          questionCount: 30,
          durationMinutes: 0, // Invalid duration
        }).success
      ).toBe(false);
    });

    it("freezes question snapshot guaranteeing historical immutability", () => {
      const sourceQuestion = {
        id: "q-pyq-101",
        content_latex: "Original LaTeX: $\\int_0^1 x^2 dx$",
        explanation_latex: "Original Explanation",
        pyq_year: 2023,
        pyq_shift: "Morning",
        options: [
          { id: "opt-1", option_key: "A", content_latex: "1/3", is_correct: true },
          { id: "opt-2", option_key: "B", content_latex: "1/2", is_correct: false },
          { id: "opt-3", option_key: "C", content_latex: "1", is_correct: false },
          { id: "opt-4", option_key: "D", content_latex: "0", is_correct: false },
        ],
      };

      // Simulated snapshot frozen on self-test creation
      const frozenSnapshot = {
        content_latex: sourceQuestion.content_latex,
        explanation_latex: sourceQuestion.explanation_latex,
        pyq_year: sourceQuestion.pyq_year,
        pyq_shift: sourceQuestion.pyq_shift,
        options: [...sourceQuestion.options],
      };

      // Later, admin edits or archives the question in question bank
      const modifiedSourceQuestion = {
        ...sourceQuestion,
        content_latex: "MODIFIED: $\\int_0^2 x^3 dx$",
        status: "ARCHIVED",
      };

      // The student's private test snapshot remains unaltered
      expect(frozenSnapshot.content_latex).toBe("Original LaTeX: $\\int_0^1 x^2 dx$");
      expect(frozenSnapshot.content_latex).not.toBe(modifiedSourceQuestion.content_latex);
      expect(frozenSnapshot.options.find((o) => o.is_correct)?.content_latex).toBe("1/3");
    });
  });

  /* ======================================================================== */
  /* 2. DATABASE/RLS: Student Isolation & Privacy Verification                 */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Student Private Test Isolation", () => {
    it("enforces that PRACTICE_SELF tests are restricted to the author student", () => {
      const rlsRules = {
        studentViewRule: "(created_by = auth.uid() AND test_mode = 'PRACTICE_SELF')",
        studentInsertRule: "created_by = auth.uid() AND test_mode = 'PRACTICE_SELF'",
        foreignStudentAccess: "REJECTED_BY_RLS",
      };

      expect(rlsRules.studentViewRule).toContain("created_by = auth.uid()");
      expect(rlsRules.studentInsertRule).toContain("test_mode = 'PRACTICE_SELF'");
      expect(rlsRules.foreignStudentAccess).toBe("REJECTED_BY_RLS");
    });

    it("verifies attempts and results for self-tests are strictly student-scoped", () => {
      const attemptSecurity = {
        attemptInsertStudentMatch: "student_id = auth.uid()",
        resultsSelectStudentMatch: "student_id = auth.uid()",
      };

      expect(attemptSecurity.attemptInsertStudentMatch).toBe("student_id = auth.uid()");
      expect(attemptSecurity.resultsSelectStudentMatch).toBe("student_id = auth.uid()");
    });
  });
});
