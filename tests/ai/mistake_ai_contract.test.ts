import { describe, it, expect } from "vitest";
import { AIMistakeClassificationOutputSchema } from "@/types/mistakes";
import { MockAIProvider } from "@/lib/ai/mockAdapter";
import { GeminiAdapter } from "@/lib/ai/geminiAdapter";

describe("Phase 12 AI Mistake Classification Schema & Contract Suite", () => {
  /* ======================================================================== */
  /* 1. [AI CONTRACT] Schema Boundary Verification                            */
  /* ======================================================================== */
  describe("[AI CONTRACT] AIMistakeClassificationOutputSchema", () => {
    it("accepts valid schema-compliant classification output", () => {
      const valid = {
        mistake_type: "CONCEPTUAL_ERROR",
        confidence: "HIGH",
        pedagogical_rationale: "Student confused torque with angular momentum in rotating frame.",
      };
      const parsed = AIMistakeClassificationOutputSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid mistake type strings", () => {
      const invalidType = {
        mistake_type: "UNSUPPORTED_ERROR_TYPE",
        confidence: "HIGH",
        pedagogical_rationale: "Some rationale text here.",
      };
      expect(AIMistakeClassificationOutputSchema.safeParse(invalidType).success).toBe(false);
    });

    it("rejects invalid confidence values (e.g. VERY_HIGH)", () => {
      const invalidConfidence = {
        mistake_type: "CALCULATION_ERROR",
        confidence: "VERY_HIGH",
        pedagogical_rationale: "Some rationale text here.",
      };
      expect(AIMistakeClassificationOutputSchema.safeParse(invalidConfidence).success).toBe(false);
    });

    it("rejects rationale shorter than 5 characters", () => {
      const shortRationale = {
        mistake_type: "FORMULA_ERROR",
        confidence: "MEDIUM",
        pedagogical_rationale: "Bad",
      };
      expect(AIMistakeClassificationOutputSchema.safeParse(shortRationale).success).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 2. [AI CONTRACT] MockAIProvider and GeminiAdapter Implementation         */
  /* ======================================================================== */
  describe("[AI CONTRACT] Provider classifyMistake() Integration", () => {
    const sampleInput = {
      question_id: "q-101",
      question_latex: "Find the work done $\\int F dx$.",
      options: [
        { option_key: "A", content_latex: "10 J", is_correct: true },
        { option_key: "B", content_latex: "20 J", is_correct: false },
        { option_key: "C", content_latex: "30 J", is_correct: false },
        { option_key: "D", content_latex: "40 J", is_correct: false },
      ],
      selected_option_key: "B",
      correct_option_key: "A",
      time_spent_seconds: 220,
      difficulty: "HARD",
      subject_name: "Physics",
      chapter_name: "Work Power Energy",
      is_marked_for_review: false,
    };

    it("MockAIProvider returns schema-compliant classification for calculation error (>180s)", async () => {
      const provider = new MockAIProvider();
      const output = await provider.classifyMistake(sampleInput);

      expect(output.mistake_type).toBe("CALCULATION_ERROR");
      expect(output.confidence).toBe("MEDIUM");
      expect(output.pedagogical_rationale).toContain("arithmetic or algebraic");
      expect(AIMistakeClassificationOutputSchema.safeParse(output).success).toBe(true);
    });

    it("GeminiAdapter enforces API key presence", async () => {
      const adapter = new GeminiAdapter("");
      await expect(adapter.classifyMistake(sampleInput)).rejects.toThrow(
        /GEMINI_API_KEY is not configured/i
      );
    });
  });
});
