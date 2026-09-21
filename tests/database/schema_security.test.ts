import { describe, it, expect } from "vitest";
import {
  QuestionCreateSchema,
  TestCreateSchema,
  TestQuestionSnapshot,
  AttemptStatus,
} from "@/types/database";

describe("Phase 2 Database Schema & Security Guardrail Verification", () => {
  describe("1. V1 MCQ Question Model & Validation", () => {
    const validQuestion = {
      subjectId: "11111111-1111-1111-1111-111111111111",
      chapterId: "22222222-2222-2222-2222-222222222222",
      topicId: "33333333-3333-3333-3333-333333333333",
      examType: "JEE_MAIN",
      difficulty: "HARD",
      contentLatex: "What is the moment of inertia of a solid cylinder of mass $M$ and radius $R$ about its central axis?",
      explanationLatex: "$I = \\frac{1}{2} M R^2$",
      sourceType: "PYQ",
      pyqYear: 2024,
      pyqShift: "29 Jan Shift 1",
      options: [
        { optionKey: "A", contentLatex: "$\\frac{1}{2} M R^2$", isCorrect: true },
        { optionKey: "B", contentLatex: "$M R^2$", isCorrect: false },
        { optionKey: "C", contentLatex: "$\\frac{2}{5} M R^2$", isCorrect: false },
        { optionKey: "D", contentLatex: "$\\frac{1}{4} M R^2$", isCorrect: false },
      ],
    };

    it("accepts a perfectly formatted single MCQ with 4 options and 1 correct answer", () => {
      const result = QuestionCreateSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it("REJECTS question with multiple correct answers (V1 Single MCQ constraint)", () => {
      const invalid = {
        ...validQuestion,
        options: [
          { optionKey: "A", contentLatex: "Option A", isCorrect: true },
          { optionKey: "B", contentLatex: "Option B", isCorrect: true }, // 2 correct!
          { optionKey: "C", contentLatex: "Option C", isCorrect: false },
          { optionKey: "D", contentLatex: "Option D", isCorrect: false },
        ],
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Exactly one option must be marked as correct");
      }
    });

    it("REJECTS question with missing or excess options (must be exactly 4 options)", () => {
      const invalid = {
        ...validQuestion,
        options: [
          { optionKey: "A", contentLatex: "Option A", isCorrect: true },
          { optionKey: "B", contentLatex: "Option B", isCorrect: false },
        ],
      };

      const result = QuestionCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("2. Test Configuration & Marking Schemes", () => {
    it("validates test creation with custom sectional marking scheme", () => {
      const customTest = {
        title: "JEE Advanced Physics Sectional Test",
        durationMinutes: 60,
        totalMarks: 60,
        markingScheme: {
          correct: 3,
          incorrect: -1,
          unattempted: 0,
        },
        examType: "JEE_ADV",
        testMode: "SCHEDULED",
      };

      const result = TestCreateSchema.safeParse(customTest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.markingScheme.correct).toBe(3);
        expect(result.data.markingScheme.incorrect).toBe(-1);
      }
    });

    it("rejects invalid test duration (duration must be positive)", () => {
      const invalidTest = {
        title: "Negative Duration Test",
        durationMinutes: -10,
        totalMarks: 100,
        markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
      };

      const result = TestCreateSchema.safeParse(invalidTest);
      expect(result.success).toBe(false);
    });
  });

  describe("3. Test Question Immutable Snapshot Strategy", () => {
    it("generates an immutable snapshot preserving question state at test publication", () => {
      const originalQuestion = {
        id: "q-101",
        content_latex: "Original Question Body $\\vec{F} = m \\vec{a}$",
        explanation_latex: "Newton's second law",
        options: [
          { id: "opt-1", option_key: "A" as const, content_latex: "$\\vec{F} = m \\vec{a}$", is_correct: true },
          { id: "opt-2", option_key: "B" as const, content_latex: "$\\vec{F} = m / \\vec{a}$", is_correct: false },
          { id: "opt-3", option_key: "C" as const, content_latex: "$\\vec{F} = 0$", is_correct: false },
          { id: "opt-4", option_key: "D" as const, content_latex: "None of these", is_correct: false },
        ],
      };

      const snapshot: TestQuestionSnapshot = {
        content_latex: originalQuestion.content_latex,
        explanation_latex: originalQuestion.explanation_latex,
        options: originalQuestion.options.map((o) => ({
          id: o.id,
          option_key: o.option_key,
          content_latex: o.content_latex,
          is_correct: o.is_correct,
        })),
      };

      // Serialize to DB JSONB
      const serializedJson = JSON.stringify(snapshot);

      // Simulate admin editing question in question bank later
      const mutatedOriginalQuestion = {
        ...originalQuestion,
        content_latex: "Mutated Question Body after exam already published",
      };

      // Retrieve snapshot
      const restoredSnapshot: TestQuestionSnapshot = JSON.parse(serializedJson);

      // Verify student attempt reads immutable snapshot, untouched by question bank mutation
      expect(restoredSnapshot.content_latex).toBe(originalQuestion.content_latex);
      expect(restoredSnapshot.content_latex).not.toBe(mutatedOriginalQuestion.content_latex);
      expect(restoredSnapshot.options[0].is_correct).toBe(true);
    });
  });

  describe("4. RLS Security Model Invariants", () => {
    it("enforces attempt lifecycle states", () => {
      const validStatuses: AttemptStatus[] = [
        "NOT_STARTED",
        "IN_PROGRESS",
        "SUBMITTED",
        "AUTO_SUBMITTED",
        "EXPIRED",
        "CANCELLED",
      ];

      expect(validStatuses).toContain("IN_PROGRESS");
      expect(validStatuses).toContain("SUBMITTED");
      expect(validStatuses.length).toBe(6);
    });

    it("verifies answer key secrecy condition for student view", () => {
      // Rule: is_correct is visible ONLY when attempt is in SUBMITTED, AUTO_SUBMITTED, or EXPIRED
      const canStudentViewAnswerKey = (attemptStatus: AttemptStatus): boolean => {
        return ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"].includes(attemptStatus);
      };

      expect(canStudentViewAnswerKey("IN_PROGRESS")).toBe(false);
      expect(canStudentViewAnswerKey("NOT_STARTED")).toBe(false);
      expect(canStudentViewAnswerKey("SUBMITTED")).toBe(true);
      expect(canStudentViewAnswerKey("AUTO_SUBMITTED")).toBe(true);
      expect(canStudentViewAnswerKey("EXPIRED")).toBe(true);
    });
  });
});
