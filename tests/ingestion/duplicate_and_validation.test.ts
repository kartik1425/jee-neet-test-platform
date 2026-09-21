import { describe, it, expect } from "vitest";
import { validateStagingItem } from "@/lib/ingestion/validator";
import {
  canonicalizeQuestionText,
  calculateTokenSimilarity,
  evaluateDuplicateCandidate,
} from "@/lib/ingestion/duplicateDetector";
import { StagingOptionItem } from "@/types/ingestion";

describe("Phase 9 Staging Validation & Duplicate Detection Suite", () => {
  const validOptions: StagingOptionItem[] = [
    { option_key: "A", content_latex: "10 m/s", is_correct: true },
    { option_key: "B", content_latex: "20 m/s", is_correct: false },
    { option_key: "C", content_latex: "30 m/s", is_correct: false },
    { option_key: "D", content_latex: "40 m/s", is_correct: false },
  ];

  /* ======================================================================== */
  /* 1. UNIT: Staging Item Validation Rules                                   */
  /* ======================================================================== */
  describe("[UNIT] Staging Item Validation Pipeline", () => {
    it("validates a compliant question with 4 options, 1 answer, and taxonomy", () => {
      const res = validateStagingItem(
        "Calculate the acceleration of the mass $m = 2\\text{ kg}$.",
        validOptions,
        "A",
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002"
      );

      expect(res.isValid).toBe(true);
      expect(res.answerStatus).toBe("VERIFIED");
      expect(res.suggestedStatus).toBe("VALIDATED");
      expect(res.errors).toHaveLength(0);
    });

    it("rejects questions with fewer or greater than 4 options", () => {
      const res = validateStagingItem(
        "Question body",
        validOptions.slice(0, 3), // Only 3 options
        "A",
        "sub-1",
        "chap-1"
      );

      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes("exactly 4 options"))).toBe(true);
    });

    it("rejects questions with empty option text", () => {
      const emptyOpt = [
        ...validOptions.slice(0, 3),
        { option_key: "D" as const, content_latex: "   ", is_correct: false },
      ];

      const res = validateStagingItem("Question body", emptyOpt, "A", "sub-1", "chap-1");
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes("cannot be empty"))).toBe(true);
    });

    it("flags missing answer keys as MISSING", () => {
      const unselectedOptions = validOptions.map((o) => ({ ...o, is_correct: false }));
      const res = validateStagingItem("Question body", unselectedOptions, null, "sub-1", "chap-1");

      expect(res.isValid).toBe(false);
      expect(res.answerStatus).toBe("MISSING");
      expect(res.errors.some((e) => e.includes("No correct answer"))).toBe(true);
    });

    it("flags conflicting answer keys as CONFLICTING", () => {
      // Option A is marked true in array, but correctKey is 'B'
      const res = validateStagingItem("Question body", validOptions, "B", "sub-1", "chap-1");

      expect(res.isValid).toBe(false);
      expect(res.answerStatus).toBe("CONFLICTING");
      expect(res.errors.some((e) => e.includes("Conflicting answer"))).toBe(true);
    });
  });

  /* ======================================================================== */
  /* 2. UNIT: Multi-Tier Duplicate Detection Engine                           */
  /* ======================================================================== */
  describe("[UNIT] Duplicate Detection & Similarity Matching", () => {
    const existingBank = [
      {
        id: "q-bank-01",
        content_latex: "Find the work done by a constant force $\\vec{F} = 10\\hat{i}\\text{ N}$ on displacement $\\vec{d} = 5\\hat{i}\\text{ m}$.",
      },
      {
        id: "q-bank-02",
        content_latex: "What is the oxidation number of sulfur in sulfuric acid $\\text{H}_2\\text{SO}_4$?",
      },
    ];

    it("detects exact duplicate match regardless of whitespace and LaTeX delimiters", () => {
      const exactCandidate = "Find the work done by a constant force $\\vec{F} = 10 \\hat{i} \\text{ N}$ on displacement $\\vec{d} = 5 \\hat{i} \\text{ m}$.";
      const result = evaluateDuplicateCandidate(exactCandidate, existingBank);

      expect(result.status).toBe("DUPLICATE");
      expect(result.similarityScore).toBe(1.0);
      expect(result.matchedQuestionId).toBe("q-bank-01");
    });

    it("detects high similarity near-duplicate questions", () => {
      const nearCandidate = "Calculate the work done by constant force $\\vec{F} = 10\\hat{i}\\text{ N}$ for displacement $\\vec{d} = 5\\hat{i}\\text{ m}$.";
      const result = evaluateDuplicateCandidate(nearCandidate, existingBank);

      expect(["DUPLICATE", "POSSIBLE_DUPLICATE"]).toContain(result.status);
      expect(result.matchedQuestionId).toBe("q-bank-01");
      expect(result.similarityScore).toBeGreaterThanOrEqual(0.65);
    });

    it("classifies novel questions as NEW", () => {
      const novelCandidate = "Determine the focal length of a convex lens with refractive index $\\mu = 1.5$.";
      const result = evaluateDuplicateCandidate(novelCandidate, existingBank);

      expect(result.status).toBe("NEW");
      expect(result.similarityScore).toBeLessThan(0.65);
      expect(result.matchedQuestionId).toBeNull();
    });
  });
});
