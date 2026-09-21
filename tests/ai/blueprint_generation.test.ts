import { describe, it, expect } from "vitest";
import {
  AITestBlueprintSchema,
  AITestBlueprint,
} from "@/types/aiTestGenerator";
import {
  validateBlueprintAgainstTaxonomy,
  DBTaxonomyContext,
} from "@/lib/tests/blueprintValidator";
import { calculateDifficultyQuotas } from "@/lib/tests/aiPaperGenerator";
import { MockAIProvider } from "@/lib/ai/mockAdapter";

describe("Phase 10 AI Blueprint Generation & Taxonomy Mapping Suite", () => {
  const mockTaxonomy: DBTaxonomyContext = {
    subjects: [
      { id: "sub-1", name: "Physics", code: "PHY", created_at: "2026-01-01" },
      { id: "sub-2", name: "Chemistry", code: "CHEM", created_at: "2026-01-01" },
      { id: "sub-3", name: "Mathematics", code: "MATH", created_at: "2026-01-01" },
    ],
    chapters: [
      { id: "ch-1", subject_id: "sub-1", name: "Rotation", order_index: 1, created_at: "2026-01-01" },
      { id: "ch-2", subject_id: "sub-1", name: "Work Energy Power", order_index: 2, created_at: "2026-01-01" },
      { id: "ch-3", subject_id: "sub-2", name: "Thermodynamics", order_index: 1, created_at: "2026-01-01" },
      { id: "ch-4", subject_id: "sub-3", name: "Calculus", order_index: 1, created_at: "2026-01-01" },
    ],
  };

  /* ======================================================================== */
  /* 1. UNIT: Blueprint Schema Validation                                     */
  /* ======================================================================== */
  describe("[UNIT] Blueprint Zod Schema Validation", () => {
    it("parses valid blueprint with subjects and difficulty distribution", () => {
      const raw = {
        title: "JEE Advanced Physics Mock",
        exam_type: "JEE_ADV",
        duration_minutes: 90,
        total_questions: 30,
        subjects: [
          {
            subject_name: "Physics",
            question_count: 30,
            chapter_names: ["Rotation", "Work Energy Power"],
            difficulty_distribution: { EASY: 0, MEDIUM: 20, HARD: 40, ADVANCED: 40 },
          },
        ],
        source_constraints: {
          pyq_only: true,
          year_start: 2018,
          year_end: 2024,
          exclude_recent_test_count: 2,
        },
      };

      const result = AITestBlueprintSchema.safeParse(raw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_questions).toBe(30);
        expect(result.data.subjects[0].chapter_names).toHaveLength(2);
      }
    });

    it("rejects blueprint with missing required fields or negative counts", () => {
      const invalid = {
        title: "Hi", // < 3 chars
        exam_type: "INVALID_EXAM",
        total_questions: -5,
        subjects: [],
      };

      const result = AITestBlueprintSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 2. UNIT: Deterministic Taxonomy Mapping & Validation                     */
  /* ======================================================================== */
  describe("[UNIT] Taxonomy Mapping & Question Sum Validation", () => {
    it("maps matching subject and chapter names to real database IDs", () => {
      const rawBlueprint: AITestBlueprint = {
        title: "Mechanics Special",
        exam_type: "JEE_ADV",
        duration_minutes: 60,
        total_questions: 20,
        marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
        subjects: [
          {
            subject_name: "Physics",
            question_count: 20,
            chapter_names: ["Rotation", "Work Energy Power"],
            topic_names: [],
            difficulty_distribution: { EASY: 0, MEDIUM: 30, HARD: 40, ADVANCED: 30 },
          },
        ],
        source_constraints: { pyq_only: true, exclude_recent_test_count: 2 },
        pedagogical_focus: ["conceptual"],
      };

      const validation = validateBlueprintAgainstTaxonomy(rawBlueprint, mockTaxonomy);
      expect(validation.is_valid).toBe(true);
      expect(validation.resolved_subjects).toHaveLength(1);
      expect(validation.resolved_subjects[0].subject_id).toBe("sub-1");
      expect(validation.resolved_subjects[0].chapter_ids).toEqual(["ch-1", "ch-2"]);
    });

    it("flags error if sum of subject question counts does not match total_questions", () => {
      const mismatched: AITestBlueprint = {
        title: "Mismatched Test",
        exam_type: "JEE_MAIN",
        duration_minutes: 60,
        total_questions: 30, // Claims 30
        marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
        subjects: [
          {
            subject_name: "Physics",
            question_count: 15, // Only 15
            chapter_names: ["Rotation"],
            topic_names: [],
            difficulty_distribution: { EASY: 20, MEDIUM: 50, HARD: 30, ADVANCED: 0 },
          },
        ],
        source_constraints: { pyq_only: false, exclude_recent_test_count: 0 },
        pedagogical_focus: ["standard"],
      };

      const validation = validateBlueprintAgainstTaxonomy(mismatched, mockTaxonomy);
      expect(validation.is_valid).toBe(false);
      expect(validation.validation_errors[0]).toContain("Sum of subject question counts (15) does not match");
    });

    it("flags unrecognized subjects and chapters", () => {
      const unknownTax: AITestBlueprint = {
        title: "Unknown Subject Test",
        exam_type: "JEE_MAIN",
        duration_minutes: 60,
        total_questions: 10,
        marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
        subjects: [
          {
            subject_name: "Astronomy", // Not in DB
            question_count: 10,
            chapter_names: ["Black Holes"],
            topic_names: [],
            difficulty_distribution: { EASY: 0, MEDIUM: 50, HARD: 50, ADVANCED: 0 },
          },
        ],
        source_constraints: { pyq_only: false, exclude_recent_test_count: 0 },
        pedagogical_focus: ["standard"],
      };

      const validation = validateBlueprintAgainstTaxonomy(unknownTax, mockTaxonomy);
      expect(validation.is_valid).toBe(false);
      expect(validation.unrecognized_subjects).toContain("Astronomy");
    });
  });

  /* ======================================================================== */
  /* 3. UNIT: Difficulty Quota Allocation                                     */
  /* ======================================================================== */
  describe("[UNIT] Difficulty Quota Allocation Calculation", () => {
    it("allocates correct integer counts based on percentage distribution", () => {
      const quotas = calculateDifficultyQuotas(30, {
        EASY: 0,
        MEDIUM: 20,
        HARD: 40,
        ADVANCED: 40,
      });

      expect(quotas.EASY).toBe(0);
      expect(quotas.MEDIUM).toBe(6); // 20% of 30
      expect(quotas.HARD).toBe(12); // 40% of 30
      expect(quotas.ADVANCED).toBe(12); // 40% of 30
      expect(quotas.EASY + quotas.MEDIUM + quotas.HARD + quotas.ADVANCED).toBe(30);
    });

    it("handles remainder distribution accurately without dropping questions", () => {
      const quotas = calculateDifficultyQuotas(25, {
        EASY: 33,
        MEDIUM: 33,
        HARD: 34,
        ADVANCED: 0,
      });

      const total = quotas.EASY + quotas.MEDIUM + quotas.HARD + quotas.ADVANCED;
      expect(total).toBe(25);
    });
  });

  /* ======================================================================== */
  /* 4. UNIT: Mock AI Provider Natural Language Parsing                       */
  /* ======================================================================== */
  describe("[UNIT] Mock AI Provider Prompt Blueprint Extraction", () => {
    it("extracts exam type, count, subjects, and PYQ constraints from natural prompt", async () => {
      const provider = new MockAIProvider();
      const prompt =
        "Create a 30-question very difficult JEE Advanced Physics paper from Rotation and Work Energy Power. Use PYQs only.";

      const availableTax = [
        { subjectName: "Physics", chapterNames: ["Rotation", "Work Energy Power"] },
      ];

      const blueprint = await provider.generateTestBlueprint(prompt, availableTax);

      expect(blueprint.exam_type).toBe("JEE_ADV");
      expect(blueprint.total_questions).toBe(30);
      expect(blueprint.source_constraints.pyq_only).toBe(true);
      expect(blueprint.subjects).toHaveLength(1);
      expect(blueprint.subjects[0].subject_name).toBe("Physics");
      expect(blueprint.subjects[0].question_count).toBe(30);
      expect(blueprint.subjects[0].difficulty_distribution.ADVANCED).toBeGreaterThan(0);
    });
  });
});
