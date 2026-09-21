import { describe, it, expect } from "vitest";
import {
  distributeQuestionsAcrossSubjects,
  isValidQualifyingQuestion,
  categorizeQuestionsByPriority,
  sampleQuestionsFromBuckets,
  filterCandidateQuestions,
  executeQuestionSelection,
  CandidateQuestionWithProvenance,
} from "@/lib/practice/selectionEngine";
import { SelfTestConfig } from "@/types/practice";

describe("Phase 8 Deterministic Question Selection Engine Suite", () => {
  /* ======================================================================== */
  /* 1. UNIT: Subject Balancing Distribution                                  */
  /* ======================================================================== */
  describe("[UNIT] Cross-Subject Distribution Balancing", () => {
    it("distributes questions equally when total is divisible by subject count", () => {
      const dist = distributeQuestionsAcrossSubjects(30, ["sub-phy", "sub-chem", "sub-math"]);
      expect(dist["sub-phy"]).toBe(10);
      expect(dist["sub-chem"]).toBe(10);
      expect(dist["sub-math"]).toBe(10);
    });

    it("distributes remainder fairly across subjects without bias", () => {
      const dist = distributeQuestionsAcrossSubjects(25, ["sub-phy", "sub-chem", "sub-math"]);
      // 25 / 3 = 8 with remainder 2 -> [9, 8, 8]
      expect(dist["sub-phy"]).toBe(9);
      expect(dist["sub-chem"]).toBe(8);
      expect(dist["sub-math"]).toBe(8);

      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      expect(total).toBe(25);
    });

    it("assigns all questions to single subject when only one is selected", () => {
      const dist = distributeQuestionsAcrossSubjects(20, ["sub-phy"]);
      expect(dist["sub-phy"]).toBe(20);
    });
  });

  /* ======================================================================== */
  /* 2. UNIT: PYQ Provenance & Single MCQ Validation                          */
  /* ======================================================================== */
  describe("[UNIT] Question Provenance & V1 MCQ Integrity", () => {
    const validPyq: CandidateQuestionWithProvenance = {
      id: "q-1",
      subject_id: "sub-phy",
      chapter_id: "chap-rot",
      exam_type: "JEE_ADV",
      question_type: "SINGLE_MCQ",
      difficulty: "ADVANCED",
      content_latex: "Calculate torque",
      source_type: "PYQ",
      pyq_year: 2024,
      pyq_shift: "Shift 1",
      status: "APPROVED",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      options: [
        { id: "opt-1", question_id: "q-1", option_key: "A", content_latex: "10", is_correct: true, order_index: 1, created_at: "" },
        { id: "opt-2", question_id: "q-1", option_key: "B", content_latex: "20", is_correct: false, order_index: 2, created_at: "" },
        { id: "opt-3", question_id: "q-1", option_key: "C", content_latex: "30", is_correct: false, order_index: 3, created_at: "" },
        { id: "opt-4", question_id: "q-1", option_key: "D", content_latex: "40", is_correct: false, order_index: 4, created_at: "" },
      ],
    };

    it("accepts valid approved PYQ question with 4 options and 1 correct key", () => {
      expect(isValidQualifyingQuestion(validPyq, true)).toBe(true);
    });

    it("rejects questions with non-APPROVED status or inactive flag", () => {
      expect(isValidQualifyingQuestion({ ...validPyq, status: "DRAFT" }, true)).toBe(false);
      expect(isValidQualifyingQuestion({ ...validPyq, is_active: false }, true)).toBe(false);
    });

    it("rejects questions without valid PYQ year when pyqOnly is true", () => {
      expect(isValidQualifyingQuestion({ ...validPyq, pyq_year: null }, true)).toBe(false);
      expect(isValidQualifyingQuestion({ ...validPyq, source_type: "AI_GENERATED" }, true)).toBe(false);
    });

    it("rejects questions with invalid option counts or multiple correct keys", () => {
      // 3 options
      expect(isValidQualifyingQuestion({ ...validPyq, options: validPyq.options.slice(0, 3) }, true)).toBe(false);

      // 2 correct options
      const multiCorrect = validPyq.options.map((o) => ({ ...o, is_correct: true }));
      expect(isValidQualifyingQuestion({ ...validPyq, options: multiCorrect }, true)).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 3. UNIT: Uniqueness & Repeat-Prevention Priority Tiering                 */
  /* ======================================================================== */
  describe("[UNIT] Repeat-Prevention Priority Tiers & Sampling", () => {
    const makeQuestion = (id: string): CandidateQuestionWithProvenance => ({
      id,
      subject_id: "sub-phy",
      chapter_id: "chap-rot",
      exam_type: "JEE_MAIN",
      question_type: "SINGLE_MCQ",
      difficulty: "MEDIUM",
      content_latex: `Question ${id}`,
      source_type: "PYQ",
      pyq_year: 2023,
      status: "APPROVED",
      is_active: true,
      created_at: "",
      updated_at: "",
      options: [
        { id: `${id}-1`, question_id: id, option_key: "A", content_latex: "A", is_correct: true, order_index: 1, created_at: "" },
        { id: `${id}-2`, question_id: id, option_key: "B", content_latex: "B", is_correct: false, order_index: 2, created_at: "" },
        { id: `${id}-3`, question_id: id, option_key: "C", content_latex: "C", is_correct: false, order_index: 3, created_at: "" },
        { id: `${id}-4`, question_id: id, option_key: "D", content_latex: "D", is_correct: false, order_index: 4, created_at: "" },
      ],
    });

    const candidates = [makeQuestion("q-1"), makeQuestion("q-2"), makeQuestion("q-3"), makeQuestion("q-4")];
    const attemptedIds = new Set(["q-3"]);
    const recentSelfTestIds = new Set(["q-4"]);

    it("categorizes questions into Priority 1 (fresh), Priority 2 (older), and Priority 3 (attempted)", () => {
      const buckets = categorizeQuestionsByPriority(candidates, attemptedIds, recentSelfTestIds);

      // q-1 and q-2 are never attempted and not in recent self tests
      expect(buckets.priority1_neverAttempted.map((q) => q.id)).toEqual(["q-1", "q-2"]);
      // q-3 is attempted but not in recent self tests
      expect(buckets.priority2_recentSelfTestExcluded.map((q) => q.id)).toEqual(["q-3"]);
      // q-4 is in recent self tests
      expect(buckets.priority3_previouslyAttempted.map((q) => q.id)).toEqual(["q-4"]);
    });

    it("samples strictly from Priority 1 first without taking attempted questions", () => {
      const buckets = categorizeQuestionsByPriority(candidates, attemptedIds, recentSelfTestIds);
      const { selected, shortage } = sampleQuestionsFromBuckets(buckets, 2, false);

      expect(selected).toHaveLength(2);
      expect(shortage).toBe(0);
      expect(selected.map((q) => q.id).sort()).toEqual(["q-1", "q-2"]);
    });

    it("respects allowPreviouslyAttempted flag when pool is insufficient", () => {
      const buckets = categorizeQuestionsByPriority(candidates, attemptedIds, recentSelfTestIds);

      // Request 4 questions when only 2 are fresh
      const { selected: strictSelected, shortage: strictShortage } = sampleQuestionsFromBuckets(buckets, 4, false);
      expect(strictSelected).toHaveLength(3); // q-1, q-2, q-3 (p1 + p2)
      expect(strictShortage).toBe(1);

      // Request 4 with allowPreviouslyAttempted = true
      const { selected: relaxedSelected, shortage: relaxedShortage } = sampleQuestionsFromBuckets(buckets, 4, true);
      expect(relaxedSelected).toHaveLength(4);
      expect(relaxedShortage).toBe(0);
    });
  });

  /* ======================================================================== */
  /* 4. UNIT: Full Selection Algorithm & Transparent Shortage Reporting       */
  /* ======================================================================== */
  describe("[UNIT] Full Selection Engine Execution", () => {
    const makeSampleQuestions = (count: number, subjectId: string): CandidateQuestionWithProvenance[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `${subjectId}-${i + 1}`,
        subject_id: subjectId,
        chapter_id: `chap-${subjectId}`,
        exam_type: "JEE_MAIN",
        question_type: "SINGLE_MCQ",
        difficulty: "MEDIUM",
        content_latex: `Question ${subjectId} ${i + 1}`,
        source_type: "PYQ",
        pyq_year: 2022,
        status: "APPROVED",
        is_active: true,
        created_at: "",
        updated_at: "",
        options: [
          { id: "1", question_id: "", option_key: "A", content_latex: "", is_correct: true, order_index: 1, created_at: "" },
          { id: "2", question_id: "", option_key: "B", content_latex: "", is_correct: false, order_index: 2, created_at: "" },
          { id: "3", question_id: "", option_key: "C", content_latex: "", is_correct: false, order_index: 3, created_at: "" },
          { id: "4", question_id: "", option_key: "D", content_latex: "", is_correct: false, order_index: 4, created_at: "" },
        ],
      }));

    const phyQuestions = makeSampleQuestions(15, "sub-phy");
    const chemQuestions = makeSampleQuestions(15, "sub-chem");
    const allPool = [...phyQuestions, ...chemQuestions];

    const config: SelfTestConfig = {
      examType: "JEE_MAIN",
      subjectIds: ["sub-phy", "sub-chem"],
      chapterIds: ["chap-sub-phy", "chap-sub-chem"],
      difficulty: "MEDIUM",
      questionCount: 20,
      durationMinutes: 60,
      pyqOnly: true,
      allowPreviouslyAttempted: false,
    };

    it("generates balanced 20-question test (10 Physics + 10 Chemistry)", () => {
      const result = executeQuestionSelection(allPool, config, new Set(), new Set());
      expect(result.isSufficient).toBe(true);
      expect(result.selectedQuestions).toHaveLength(20);

      const phyCount = result.selectedQuestions.filter((q) => q.subject_id === "sub-phy").length;
      const chemCount = result.selectedQuestions.filter((q) => q.subject_id === "sub-chem").length;
      expect(phyCount).toBe(10);
      expect(chemCount).toBe(10);
    });

    it("transparently reports shortage when pool cannot satisfy requested size", () => {
      const shortageConfig: SelfTestConfig = {
        ...config,
        questionCount: 40, // Pool only has 30 total
      };

      const result = executeQuestionSelection(allPool, shortageConfig, new Set(), new Set());
      expect(result.isSufficient).toBe(false);
      expect(result.shortageDetails).toBeDefined();
      expect(result.shortageDetails?.available).toBe(30);
      expect(result.shortageDetails?.requested).toBe(40);
      expect(result.shortageDetails?.message).toContain("Only 30 qualifying unique PYQs are currently available");
    });
  });
});
