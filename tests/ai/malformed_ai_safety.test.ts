import { describe, it, expect } from "vitest";
import { AIExtractedQuestionSchema } from "@/types/ai";

describe("Phase 9 AI Untrusted Output & Malformed Schema Safety Suite", () => {
  const validAiOutput = {
    question_latex: "Find the work done in moving charge $q = 2\\text{ C}$ across potential difference $V = 12\\text{ V}$.",
    options: [
      { option_key: "A", content_latex: "6 J", is_correct: false },
      { option_key: "B", content_latex: "24 J", is_correct: true },
      { option_key: "C", content_latex: "12 J", is_correct: false },
      { option_key: "D", content_latex: "48 J", is_correct: false },
    ],
    correct_option_key: "B",
    explanation_latex: "$W = qV = (2)(12) = 24\\text{ J}$.",
    exam_type: "JEE_MAIN",
    suggested_subject_name: "Physics",
    suggested_chapter_name: "Electrostatics",
    suggested_topic_name: "Electric Potential",
    difficulty: "EASY",
    source_type: "PYQ",
    pyq_year: 2023,
    concept_tags: ["Work", "Potential"],
    confidence: 0.95,
  };

  /* ======================================================================== */
  /* 1. UNIT: Schema Enforcement on AI JSON Outputs                           */
  /* ======================================================================== */
  describe("[UNIT] AI Extraction Schema Rigorous Boundaries", () => {
    it("accepts valid schema-compliant AI extraction output", () => {
      const parsed = AIExtractedQuestionSchema.safeParse(validAiOutput);
      expect(parsed.success).toBe(true);
    });

    it("strictly rejects AI output with 5 options or 3 options", () => {
      const fiveOptions = {
        ...validAiOutput,
        options: [
          ...validAiOutput.options,
          { option_key: "E", content_latex: "96 J", is_correct: false },
        ],
      };
      expect(AIExtractedQuestionSchema.safeParse(fiveOptions).success).toBe(false);

      const threeOptions = {
        ...validAiOutput,
        options: validAiOutput.options.slice(0, 3),
      };
      expect(AIExtractedQuestionSchema.safeParse(threeOptions).success).toBe(false);
    });

    it("rejects AI output with missing required fields", () => {
      const missingOptions = { ...validAiOutput, options: undefined };
      expect(AIExtractedQuestionSchema.safeParse(missingOptions).success).toBe(false);

      const missingKey = { ...validAiOutput, correct_option_key: undefined };
      expect(AIExtractedQuestionSchema.safeParse(missingKey).success).toBe(false);
    });

    it("rejects AI output with invalid option keys or empty content", () => {
      const invalidKeys = {
        ...validAiOutput,
        options: [
          { option_key: "1", content_latex: "A", is_correct: false },
          { option_key: "2", content_latex: "B", is_correct: false },
          { option_key: "3", content_latex: "C", is_correct: true },
          { option_key: "4", content_latex: "D", is_correct: false },
        ],
      };
      expect(AIExtractedQuestionSchema.safeParse(invalidKeys).success).toBe(false);

      const emptyContent = {
        ...validAiOutput,
        options: [
          { option_key: "A", content_latex: "", is_correct: true },
          ...validAiOutput.options.slice(1),
        ],
      };
      expect(AIExtractedQuestionSchema.safeParse(emptyContent).success).toBe(false);
    });

    it("rejects AI output with invalid exam types or invalid difficulty names", () => {
      const badExam = { ...validAiOutput, exam_type: "SAT_MATH" };
      expect(AIExtractedQuestionSchema.safeParse(badExam).success).toBe(false);

      const badDiff = { ...validAiOutput, difficulty: "EXTREME_HARD" };
      expect(AIExtractedQuestionSchema.safeParse(badDiff).success).toBe(false);
    });
  });
});
