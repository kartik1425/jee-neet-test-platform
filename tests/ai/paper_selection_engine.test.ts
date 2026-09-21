import { describe, it, expect } from "vitest";
import {
  executeAIPaperGeneration,
  filterEligibleCandidates,
  CandidateQuestionRecord,
} from "@/lib/tests/aiPaperGenerator";
import { AITestBlueprint } from "@/types/aiTestGenerator";
import { DBTaxonomyContext } from "@/lib/tests/blueprintValidator";

describe("Phase 10 AI Paper Selection & Integrity Engine Suite", () => {
  const mockTaxonomy: DBTaxonomyContext = {
    subjects: [{ id: "sub-phy", name: "Physics", code: "PHY", created_at: "2026-01-01" }],
    chapters: [
      { id: "ch-rot", subject_id: "sub-phy", name: "Rotation", order_index: 1, created_at: "2026-01-01" },
      { id: "ch-wep", subject_id: "sub-phy", name: "Work Energy Power", order_index: 2, created_at: "2026-01-01" },
    ],
  };

  const createMockQuestion = (
    id: string,
    chapterId: string,
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED",
    sourceType: "PYQ" | "INSTITUTE" = "PYQ",
    year = 2023,
    status = "APPROVED",
    isActive = true
  ): CandidateQuestionRecord => ({
    id,
    subject_id: "sub-phy",
    chapter_id: chapterId,
    topic_id: null,
    exam_type: "JEE_ADV",
    question_type: "SINGLE_MCQ",
    difficulty,
    content_latex: `Question text for ${id} with $\\tau = I\\alpha$`,
    explanation_latex: "Solution",
    source_type: sourceType,
    pyq_year: year,
    pyq_shift: "Shift 1",
    status: status as any,
    is_active: isActive,
    created_by: "teacher-1",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    options: [
      { id: `opt-${id}-A`, question_id: id, option_key: "A", content_latex: "A", is_correct: true, order_index: 1 },
      { id: `opt-${id}-B`, question_id: id, option_key: "B", content_latex: "B", is_correct: false, order_index: 2 },
      { id: `opt-${id}-C`, question_id: id, option_key: "C", content_latex: "C", is_correct: false, order_index: 3 },
      { id: `opt-${id}-D`, question_id: id, option_key: "D", content_latex: "D", is_correct: false, order_index: 4 },
    ],
  });

  const baseBlueprint: AITestBlueprint = {
    title: "Rotation Test",
    exam_type: "JEE_ADV",
    duration_minutes: 60,
    total_questions: 4,
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
    subjects: [
      {
        subject_name: "Physics",
        question_count: 4,
        chapter_names: ["Rotation"],
        topic_names: [],
        difficulty_distribution: { EASY: 0, MEDIUM: 25, HARD: 25, ADVANCED: 50 },
      },
    ],
    source_constraints: { pyq_only: true, exclude_recent_test_count: 2 },
    pedagogical_focus: ["conceptual"],
  };

  /* ======================================================================== */
  /* 1. UNIT: Hard Filtering & Eligibility Checks                             */
  /* ======================================================================== */
  describe("[UNIT] Non-Hallucination & Eligibility Hard Rules", () => {
    it("excludes non-APPROVED or inactive questions", () => {
      const candidates: CandidateQuestionRecord[] = [
        createMockQuestion("q1", "ch-rot", "ADVANCED", "PYQ", 2023, "APPROVED", true),
        createMockQuestion("q2", "ch-rot", "ADVANCED", "PYQ", 2023, "DRAFT", true), // DRAFT
        createMockQuestion("q3", "ch-rot", "ADVANCED", "PYQ", 2023, "ARCHIVED", true), // ARCHIVED
        createMockQuestion("q4", "ch-rot", "ADVANCED", "PYQ", 2023, "APPROVED", false), // INACTIVE
      ];

      const resolvedSub = {
        subject_id: "sub-phy",
        subject_name: "Physics",
        question_count: 4,
        chapter_ids: ["ch-rot"],
        chapter_names: ["Rotation"],
        topic_ids: [],
        topic_names: [],
        difficulty_distribution: { EASY: 0, MEDIUM: 0, HARD: 0, ADVANCED: 100 },
      };

      const eligible = filterEligibleCandidates(candidates, baseBlueprint, resolvedSub, new Set());
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe("q1");
    });

    it("excludes questions with invalid option shapes (not 4 options or 0/multiple answers)", () => {
      const qValid = createMockQuestion("q-valid", "ch-rot", "ADVANCED");
      const qBadOptions = createMockQuestion("q-bad-opt", "ch-rot", "ADVANCED");
      qBadOptions.options = qBadOptions.options.slice(0, 3); // only 3 options

      const qNoAnswer = createMockQuestion("q-no-ans", "ch-rot", "ADVANCED");
      qNoAnswer.options.forEach((o) => (o.is_correct = false)); // 0 correct

      const resolvedSub = {
        subject_id: "sub-phy",
        subject_name: "Physics",
        question_count: 4,
        chapter_ids: ["ch-rot"],
        chapter_names: ["Rotation"],
        topic_ids: [],
        topic_names: [],
        difficulty_distribution: { EASY: 0, MEDIUM: 0, HARD: 0, ADVANCED: 100 },
      };

      const eligible = filterEligibleCandidates(
        [qValid, qBadOptions, qNoAnswer],
        baseBlueprint,
        resolvedSub,
        new Set()
      );
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe("q-valid");
    });
  });

  /* ======================================================================== */
  /* 2. UNIT: Recent-Question Exclusion & PYQ Filters                         */
  /* ======================================================================== */
  describe("[UNIT] Recent Question Exclusion & PYQ Year Windows", () => {
    it("strictly excludes question IDs in the recent test exclusion set", () => {
      const candidates = [
        createMockQuestion("q1", "ch-rot", "ADVANCED"),
        createMockQuestion("q2", "ch-rot", "ADVANCED"),
        createMockQuestion("q3", "ch-rot", "ADVANCED"),
      ];

      const excludedSet = new Set(["q2"]);
      const resolvedSub = {
        subject_id: "sub-phy",
        subject_name: "Physics",
        question_count: 3,
        chapter_ids: ["ch-rot"],
        chapter_names: ["Rotation"],
        topic_ids: [],
        topic_names: [],
        difficulty_distribution: { EASY: 0, MEDIUM: 0, HARD: 0, ADVANCED: 100 },
      };

      const eligible = filterEligibleCandidates(candidates, baseBlueprint, resolvedSub, excludedSet);
      expect(eligible.map((q) => q.id)).toEqual(["q1", "q3"]);
    });

    it("filters out questions outside requested PYQ year window", () => {
      const candidates = [
        createMockQuestion("q-old", "ch-rot", "ADVANCED", "PYQ", 2015),
        createMockQuestion("q-valid", "ch-rot", "ADVANCED", "PYQ", 2021),
        createMockQuestion("q-future", "ch-rot", "ADVANCED", "PYQ", 2028),
      ];

      const yearConstrainedBlueprint: AITestBlueprint = {
        ...baseBlueprint,
        source_constraints: {
          pyq_only: true,
          year_start: 2018,
          year_end: 2024,
          exclude_recent_test_count: 0,
        },
      };

      const resolvedSub = {
        subject_id: "sub-phy",
        subject_name: "Physics",
        question_count: 3,
        chapter_ids: ["ch-rot"],
        chapter_names: ["Rotation"],
        topic_ids: [],
        topic_names: [],
        difficulty_distribution: { EASY: 0, MEDIUM: 0, HARD: 0, ADVANCED: 100 },
      };

      const eligible = filterEligibleCandidates(
        candidates,
        yearConstrainedBlueprint,
        resolvedSub,
        new Set()
      );
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe("q-valid");
    });
  });

  /* ======================================================================== */
  /* 3. UNIT: Shortage Handling & Full Generation Pipeline                    */
  /* ======================================================================== */
  describe("[UNIT] Shortage Handling & Paper Compilation", () => {
    it("reports shortage transparently and never inserts invalid questions", () => {
      // Only 2 candidate questions exist, but 4 are requested
      const candidates = [
        createMockQuestion("q1", "ch-rot", "ADVANCED"),
        createMockQuestion("q2", "ch-rot", "HARD"),
      ];

      const result = executeAIPaperGeneration(baseBlueprint, mockTaxonomy, candidates, new Set());

      expect(result.success).toBe(false);
      expect(result.is_shortage).toBe(true);
      expect(result.total_selected).toBe(2);
      expect(result.shortage_details?.requested).toBe(4);
      expect(result.shortage_details?.available).toBe(2);
      expect(result.shortage_details?.suggested_actions).toBeDefined();
    });

    it("successfully compiles a valid paper when candidate pool is sufficient", () => {
      const candidates = [
        createMockQuestion("q1", "ch-rot", "ADVANCED"),
        createMockQuestion("q2", "ch-rot", "ADVANCED"),
        createMockQuestion("q3", "ch-rot", "HARD"),
        createMockQuestion("q4", "ch-rot", "MEDIUM"),
        createMockQuestion("q5", "ch-rot", "EASY"),
      ];

      const result = executeAIPaperGeneration(baseBlueprint, mockTaxonomy, candidates, new Set());

      expect(result.success).toBe(true);
      expect(result.is_shortage).toBe(false);
      expect(result.total_selected).toBe(4);
      expect(result.selected_questions).toHaveLength(4);
      expect(result.selected_questions[0].selection_reason).toBeDefined();
    });
  });
});
