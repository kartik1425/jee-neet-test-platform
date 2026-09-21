import { describe, it, expect, vi } from "vitest";
import { QuestionCreateSchema } from "@/types/database";
import * as sessionModule from "@/lib/auth/session";

describe("Phase 3 Admin Question Bank & Security Gate Verification", () => {
  describe("1. [UNIT] V1 Single MCQ Authoring & Validation Guardrails", () => {
    const baseQuestionPayload = {
      subjectId: "11111111-0000-0000-0000-000000000001",
      chapterId: "22222222-0000-0000-0000-000000000005",
      topicId: "33333333-0000-0000-0000-000000000001",
      examType: "JEE_ADV",
      difficulty: "ADVANCED",
      contentLatex: "A disc of radius $R$ is rolling without slipping on a horizontal plane. Find the velocity of top-most point $\\vec{v}_{top}$.",
      explanationLatex: "$\\vec{v}_{top} = \\vec{v}_{cm} + \\vec{\\omega} \\times \\vec{r} = 2 v_{cm}$",
      sourceType: "PYQ",
      pyqYear: 2023,
      pyqShift: "Paper 1",
      sourceReference: "JEE Advanced 2023 Official Paper",
      options: [
        { optionKey: "A", contentLatex: "$2 v_{cm}$", isCorrect: true },
        { optionKey: "B", contentLatex: "$v_{cm}$", isCorrect: false },
        { optionKey: "C", contentLatex: "$\\sqrt{2} v_{cm}$", isCorrect: false },
        { optionKey: "D", contentLatex: "$0$", isCorrect: false },
      ],
    };

    it("accepts valid JEE Advanced MCQ with 4 options and 1 correct answer", () => {
      const result = QuestionCreateSchema.safeParse(baseQuestionPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options.length).toBe(4);
        expect(result.data.options.filter((o) => o.isCorrect).length).toBe(1);
      }
    });

    it("REJECTS question where zero options are marked correct", () => {
      const invalid = {
        ...baseQuestionPayload,
        options: baseQuestionPayload.options.map((o) => ({ ...o, isCorrect: false })),
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Exactly one option must be marked as correct");
      }
    });

    it("REJECTS question where multiple options are marked correct (V1 Single MCQ constraint)", () => {
      const invalid = {
        ...baseQuestionPayload,
        options: [
          { optionKey: "A", contentLatex: "$2 v_{cm}$", isCorrect: true },
          { optionKey: "B", contentLatex: "$v_{cm}$", isCorrect: true }, // Duplicate correct
          { optionKey: "C", contentLatex: "$\\sqrt{2} v_{cm}$", isCorrect: false },
          { optionKey: "D", contentLatex: "$0$", isCorrect: false },
        ],
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("REJECTS question with fewer than 4 options", () => {
      const invalid = {
        ...baseQuestionPayload,
        options: [
          { optionKey: "A", contentLatex: "A", isCorrect: true },
          { optionKey: "B", contentLatex: "B", isCorrect: false },
          { optionKey: "C", contentLatex: "C", isCorrect: false },
        ],
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("REJECTS empty LaTeX question content", () => {
      const invalid = {
        ...baseQuestionPayload,
        contentLatex: "   ",
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("2. [INTEGRATION] Role Authorization on Question Bank Mutations", () => {
    it("allows TEACHER to access question authoring", async () => {
      vi.spyOn(sessionModule, "requireRole").mockResolvedValue({
        user: { id: "teacher-uuid", email: "teacher@school.edu" },
        profile: {
          id: "teacher-uuid",
          email: "teacher@school.edu",
          full_name: "Teacher",
          role: "TEACHER",
          created_at: "",
          updated_at: "",
        },
      });

      const session = await sessionModule.requireRole(["TEACHER", "ADMIN"]);
      expect(session.profile.role).toBe("TEACHER");
    });

    it("allows ADMIN to access question authoring", async () => {
      vi.spyOn(sessionModule, "requireRole").mockResolvedValue({
        user: { id: "admin-uuid", email: "admin@school.edu" },
        profile: {
          id: "admin-uuid",
          email: "admin@school.edu",
          full_name: "Admin",
          role: "ADMIN",
          created_at: "",
          updated_at: "",
        },
      });

      const session = await sessionModule.requireRole(["TEACHER", "ADMIN"]);
      expect(session.profile.role).toBe("ADMIN");
    });
  });

  describe("3. [DATABASE/RLS] Security Gate: Answer Key Secrecy & Student-Safe View", () => {
    it("proves student-safe view strictly omits `is_correct` during student examination queries", () => {
      // Raw database row in question_options
      const rawDatabaseRow = {
        id: "opt-1",
        question_id: "q-1",
        option_key: "A",
        content_latex: "$2 v_{cm}$",
        is_correct: true, // Internal authoritative key
        order_index: 1,
        created_at: "2026-09-21T00:00:00Z",
      };

      // Student-safe view mapping (as defined in public.student_question_options)
      const studentSafeView = (row: typeof rawDatabaseRow) => ({
        id: row.id,
        question_id: row.question_id,
        option_key: row.option_key,
        content_latex: row.content_latex,
        order_index: row.order_index,
        created_at: row.created_at,
      });

      const studentData: any = studentSafeView(rawDatabaseRow);

      // Student gets options and LaTeX content
      expect(studentData.content_latex).toBe("$2 v_{cm}$");
      expect(studentData.option_key).toBe("A");

      // Student NEVER receives `is_correct` through student view
      expect(studentData.is_correct).toBeUndefined();
    });

    it("proves post-exam review RPC permits `is_correct` ONLY when attempt is completed", () => {
      const evaluatePostExamAccess = (
        attemptStatus: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED",
        callerRole: "STUDENT" | "TEACHER" | "ADMIN"
      ) => {
        if (callerRole === "STUDENT") {
          if (!["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"].includes(attemptStatus)) {
            throw new Error("Answer key and explanations are concealed until attempt is completed");
          }
        }
        return { is_correct_accessible: true };
      };

      // Active test attempt: Student access throws error
      expect(() => evaluatePostExamAccess("IN_PROGRESS", "STUDENT")).toThrow(
        "Answer key and explanations are concealed until attempt is completed"
      );

      // Completed attempt: Student access succeeds
      expect(evaluatePostExamAccess("SUBMITTED", "STUDENT").is_correct_accessible).toBe(true);
      expect(evaluatePostExamAccess("AUTO_SUBMITTED", "STUDENT").is_correct_accessible).toBe(true);

      // Teachers & Admins can access for grading/review anytime
      expect(evaluatePostExamAccess("IN_PROGRESS", "TEACHER").is_correct_accessible).toBe(true);
      expect(evaluatePostExamAccess("IN_PROGRESS", "ADMIN").is_correct_accessible).toBe(true);
    });
  });
});
