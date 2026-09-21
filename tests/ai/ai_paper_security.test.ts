import { describe, it, expect, vi } from "vitest";
import {
  createAITestDraftAction,
  replaceDraftQuestionAction,
  generateBlueprintFromPromptAction,
} from "@/lib/tests/aiActions";
import { AITestBlueprint } from "@/types/aiTestGenerator";

// Mock Supabase Server Client
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

const mockBlueprint: AITestBlueprint = {
  title: "Test Paper",
  exam_type: "JEE_MAIN",
  duration_minutes: 60,
  total_questions: 10,
  marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
  subjects: [
    {
      subject_name: "Physics",
      question_count: 10,
      chapter_names: ["Kinematics"],
      topic_names: [],
      difficulty_distribution: { EASY: 20, MEDIUM: 50, HARD: 30, ADVANCED: 0 },
    },
  ],
  source_constraints: { pyq_only: false, exclude_recent_test_count: 0 },
  pedagogical_focus: ["standard"],
};

describe("Phase 10 AI Test Generation Security & Access Control Suite", () => {
  /* ======================================================================== */
  /* 1. [DATABASE/RLS]: Unauthorized & Student Role Access Rejection          */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Role-Based Enforcement for AI Test Generation", () => {
    it("rejects unauthenticated requests to generate blueprints or drafts", async () => {
      // With empty cookies / mock, getUser() returns null
      const bpRes = await generateBlueprintFromPromptAction("Create 30 questions");
      expect(bpRes.success).toBe(false);
      expect(bpRes.error).toContain("Unauthorized");

      const draftRes = await createAITestDraftAction(mockBlueprint);
      expect(draftRes.success).toBe(false);
      expect(draftRes.errors?.[0]).toContain("Unauthorized");
    });

    it("rejects question replacement when unauthenticated", async () => {
      const res = await replaceDraftQuestionAction("test-uuid-1", "q-uuid-1");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });
  });
});
