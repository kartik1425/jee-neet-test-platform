import { describe, it, expect } from "vitest";
import { MockAIProvider } from "@/lib/ai/mockAdapter";
import { validateBlueprintAgainstTaxonomy, DBTaxonomyContext } from "@/lib/tests/blueprintValidator";
import { executeAIPaperGeneration, CandidateQuestionRecord } from "@/lib/tests/aiPaperGenerator";
import { validateTestForPublication } from "@/types/tests";

describe("Phase 10 AI Test Generation Integration & Publication Pipeline", () => {
  const mockTaxonomy: DBTaxonomyContext = {
    subjects: [
      { id: "sub-phy", name: "Physics", code: "PHY", created_at: "2026-01-01" },
    ],
    chapters: [
      { id: "ch-rot", subject_id: "sub-phy", name: "Rotation", order_index: 1, created_at: "2026-01-01" },
      { id: "ch-wep", subject_id: "sub-phy", name: "Work Energy Power", order_index: 2, created_at: "2026-01-01" },
    ],
  };

  const createCandidatePool = (): CandidateQuestionRecord[] => {
    const list: CandidateQuestionRecord[] = [];
    const diffs: ("EASY" | "MEDIUM" | "HARD" | "ADVANCED")[] = ["EASY", "MEDIUM", "HARD", "ADVANCED"];

    for (let i = 1; i <= 20; i++) {
      const id = `q-rot-${i}`;
      const diff = diffs[i % diffs.length];
      list.push({
        id,
        subject_id: "sub-phy",
        chapter_id: i <= 10 ? "ch-rot" : "ch-wep",
        topic_id: null,
        exam_type: "JEE_ADV",
        question_type: "SINGLE_MCQ",
        difficulty: diff,
        content_latex: `Question ${i}: A rigid body rotates with $\\tau = I\\alpha$.`,
        explanation_latex: "Standard rotational dynamics formula.",
        source_type: "PYQ",
        pyq_year: 2020 + (i % 5),
        pyq_shift: "Morning",
        status: "APPROVED",
        is_active: true,
        created_by: "faculty-1",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
        options: [
          { id: `opt-${id}-A`, question_id: id, option_key: "A", content_latex: "10 N m", is_correct: true, order_index: 1 },
          { id: `opt-${id}-B`, question_id: id, option_key: "B", content_latex: "20 N m", is_correct: false, order_index: 2 },
          { id: `opt-${id}-C`, question_id: id, option_key: "C", content_latex: "30 N m", is_correct: false, order_index: 3 },
          { id: `opt-${id}-D`, question_id: id, option_key: "D", content_latex: "40 N m", is_correct: false, order_index: 4 },
        ],
      });
    }

    return list;
  };

  /* ======================================================================== */
  /* 1. INTEGRATION: Full Prompt-to-Publication Verification Pipeline         */
  /* ======================================================================== */
  describe("[INTEGRATION] End-to-End AI Generation to Phase 6 Publication", () => {
    it("completes full lifecycle: prompt -> blueprint -> selection -> publication validation", async () => {
      // 1. Teacher natural language prompt
      const prompt =
        "Create an 8-question JEE Advanced Physics mock from Rotation and Work Energy Power. Use PYQs only.";

      // 2. AI Provider generates blueprint
      const ai = new MockAIProvider();
      const rawBlueprint = await ai.generateTestBlueprint(prompt, [
        { subjectName: "Physics", chapterNames: ["Rotation", "Work Energy Power"] },
      ]);

      // 3. Validate blueprint against database taxonomy
      const bpValidation = validateBlueprintAgainstTaxonomy(rawBlueprint, mockTaxonomy);
      expect(bpValidation.is_valid).toBe(true);
      expect(bpValidation.resolved_subjects).toHaveLength(1);
      expect(bpValidation.resolved_subjects[0].subject_id).toBe("sub-phy");

      // 4. Run hybrid selection against candidate question pool
      const candidates = createCandidatePool();
      const selectionResult = executeAIPaperGeneration(
        rawBlueprint,
        mockTaxonomy,
        candidates,
        new Set()
      );

      expect(selectionResult.success).toBe(true);
      expect(selectionResult.selected_questions).toHaveLength(8);

      // Verify every selected question is strictly from candidate pool
      const candidateIdSet = new Set(candidates.map((c) => c.id));
      selectionResult.selected_questions.forEach((sq) => {
        expect(candidateIdSet.has(sq.question_id)).toBe(true);
        expect(sq.question.status).toBe("APPROVED");
        expect(sq.question.options).toHaveLength(4);
        expect(sq.question.options.filter((o) => o.is_correct)).toHaveLength(1);
      });

      // 5. Construct draft test object for Phase 6 publication validation
      const draftTest = {
        title: rawBlueprint.title,
        duration_minutes: rawBlueprint.duration_minutes,
        questions: selectionResult.selected_questions.map((sq, idx) => ({
          id: `tq-${idx + 1}`,
          question_id: sq.question_id,
          order_index: sq.order_index,
          marks: 4,
          negative_marks: 1,
          question: sq.question,
        })),
      };

      // 6. Test passes existing Phase 6 publication gatekeeper
      const pubResult = validateTestForPublication(draftTest as any);
      expect(pubResult.isValid).toBe(true);
      expect(pubResult.errors).toHaveLength(0);
    });
  });
});
