import { describe, it, expect } from "vitest";
import {
  MISTAKE_CATEGORIES,
  AIMistakeClassificationOutputSchema,
} from "@/types/mistakes";
import { classifyMistakeDeterministically } from "@/lib/mistakes/ruleClassifier";

describe("Phase 12 Controlled Taxonomy & Deterministic Rules Suite", () => {
  /* ======================================================================== */
  /* 1. [UNIT] Controlled Error Taxonomy Completeness                         */
  /* ======================================================================== */
  describe("[UNIT] Controlled 10-Category Error Taxonomy", () => {
    it("contains all 10 mandatory taxonomy categories", () => {
      expect(MISTAKE_CATEGORIES).toHaveLength(10);
      expect(MISTAKE_CATEGORIES).toContain("CONCEPTUAL_ERROR");
      expect(MISTAKE_CATEGORIES).toContain("FORMULA_ERROR");
      expect(MISTAKE_CATEGORIES).toContain("CALCULATION_ERROR");
      expect(MISTAKE_CATEGORIES).toContain("MISREAD_QUESTION");
      expect(MISTAKE_CATEGORIES).toContain("WRONG_ASSUMPTION");
      expect(MISTAKE_CATEGORIES).toContain("TIME_PRESSURE");
      expect(MISTAKE_CATEGORIES).toContain("CARELESS_ERROR");
      expect(MISTAKE_CATEGORIES).toContain("GUESS");
      expect(MISTAKE_CATEGORIES).toContain("UNABLE_TO_START");
      expect(MISTAKE_CATEGORIES).toContain("UNKNOWN");
    });

    it("rejects non-whitelisted arbitrary category names in schema", () => {
      const invalidOutput = {
        mistake_type: "SILLY_BLUNDER_RANDOM",
        confidence: "HIGH",
        pedagogical_rationale: "Arbitrary blunder name",
      };
      expect(AIMistakeClassificationOutputSchema.safeParse(invalidOutput).success).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] Deterministic Rule Heuristics & Boundary Tests                 */
  /* ======================================================================== */
  describe("[UNIT] Deterministic Rule Classifier (classifyMistakeDeterministically)", () => {
    it("classifies visited unattempted questions with >=45s deliberation as UNABLE_TO_START", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: null,
        is_correct: null,
        time_spent_seconds: 60,
        is_marked_for_review: false,
        is_visited: true,
      });

      expect(res.mistake_type).toBe("UNABLE_TO_START");
      expect(res.confidence).toBe("HIGH");
      expect(res.source).toBe("RULE");
      expect(res.status).toBe("SUGGESTED");
      expect(res.rule_triggered).toBe("RULE_UNATTEMPTED_AFTER_DELIBERATION");
    });

    it("classifies sub-10s incorrect response on Hard difficulty as candidate GUESS", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: "opt-1",
        is_correct: false,
        time_spent_seconds: 6,
        is_marked_for_review: false,
        is_visited: true,
        difficulty: "HARD",
      });

      expect(res.mistake_type).toBe("GUESS");
      expect(res.confidence).toBe("MEDIUM");
      expect(res.rule_triggered).toBe("RULE_SUB_10S_HARD_GUESS");
    });

    it("classifies rapid incorrect answer (<=20s) as candidate TIME_PRESSURE", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: "opt-1",
        is_correct: false,
        time_spent_seconds: 15,
        is_marked_for_review: false,
        is_visited: true,
        difficulty: "MEDIUM",
      });

      expect(res.mistake_type).toBe("TIME_PRESSURE");
      expect(res.confidence).toBe("MEDIUM");
      expect(res.rule_triggered).toBe("RULE_RAPID_INCORRECT_PACING");
    });

    it("classifies extended deliberation (>=180s) on incorrect attempt as candidate CALCULATION_ERROR", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: "opt-1",
        is_correct: false,
        time_spent_seconds: 240,
        is_marked_for_review: false,
        is_visited: true,
        difficulty: "MEDIUM",
      });

      expect(res.mistake_type).toBe("CALCULATION_ERROR");
      expect(res.confidence).toBe("MEDIUM");
      expect(res.rule_triggered).toBe("RULE_EXTENDED_DELIBERATION_CALCULATION");
    });

    it("classifies short solve time (21-40s) as candidate MISREAD_QUESTION", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: "opt-1",
        is_correct: false,
        time_spent_seconds: 30,
        is_marked_for_review: false,
        is_visited: true,
        difficulty: "MEDIUM",
      });

      expect(res.mistake_type).toBe("MISREAD_QUESTION");
      expect(res.confidence).toBe("LOW");
      expect(res.rule_triggered).toBe("RULE_SHORT_SOLVE_MISREAD");
    });

    it("falls back to UNKNOWN when evidence is ambiguous for AI or teacher review", () => {
      const res = classifyMistakeDeterministically({
        selected_option_id: "opt-1",
        is_correct: false,
        time_spent_seconds: 90,
        is_marked_for_review: false,
        is_visited: true,
        difficulty: "MEDIUM",
      });

      expect(res.mistake_type).toBe("UNKNOWN");
      expect(res.confidence).toBe("LOW");
      expect(res.rule_triggered).toBe("RULE_FALLBACK_AMBIGUOUS");
    });
  });
});
