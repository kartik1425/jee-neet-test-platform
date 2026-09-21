import { describe, it, expect } from "vitest";
import {
  GeminiAdapter,
  CURRENT_PRODUCTION_GEMINI_MODEL,
  DEPRECATED_SHUTDOWN_MODELS,
} from "@/lib/ai/geminiAdapter";
import { MockAIProvider } from "@/lib/ai/mockAdapter";
import { AIDiagnosticReportSchema, DeterministicAnalyticsPayload } from "@/types/diagnosticReport";

describe("Phase 11 AI Production Model Verification & Contract Suite", () => {
  /* ======================================================================== */
  /* 1. [UNIT] Supported GA Model & Deprecated Model Guard Tests              */
  /* ======================================================================== */
  describe("[UNIT] Model Lifecycle & Deprecation Safeguards", () => {
    it("configures stable GA gemini-3.5-flash as the default production model", () => {
      expect(CURRENT_PRODUCTION_GEMINI_MODEL).toBe("gemini-3.5-flash");
      const adapter = new GeminiAdapter("dummy-key");
      expect(adapter.getModelName()).toBe("gemini-3.5-flash");
    });

    it("explicitly rejects shut-down models (e.g. gemini-2.0-flash, gemini-1.5-pro)", () => {
      expect(DEPRECATED_SHUTDOWN_MODELS).toContain("gemini-2.0-flash");
      expect(DEPRECATED_SHUTDOWN_MODELS).toContain("gemini-1.5-pro");
      expect(DEPRECATED_SHUTDOWN_MODELS).toContain("gemini-1.5-flash");

      for (const deprecatedModel of DEPRECATED_SHUTDOWN_MODELS) {
        expect(() => new GeminiAdapter("dummy-key", deprecatedModel)).toThrow(
          /shut-down model/i
        );
      }
    });

    it("accepts valid currently supported 3.x custom models", () => {
      const adapter = new GeminiAdapter("dummy-key", "gemini-3.5-pro");
      expect(adapter.getModelName()).toBe("gemini-3.5-pro");
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] Structured Diagnostic JSON Schema & Parsing Contract          */
  /* ======================================================================== */
  describe("[UNIT] Structured Diagnostic Report Parsing Contract", () => {
    const validReport = {
      report_version: "v1.0.0",
      summary: {
        strengths_summary: "Strong accuracy in Mechanics and modern physics.",
        weaknesses_summary: "Attention needed in organic reaction mechanisms.",
        overall_interpretation: "Scored 90/120 (75% accuracy) with consistent pacing throughout the exam.",
      },
      subject_analysis: [
        {
          subject_name: "Physics",
          commentary: "Mastery demonstrated across mechanics topics.",
          relative_standing: "Strong",
        },
      ],
      chapter_analysis: [
        {
          chapter_name: "Rotation",
          status: "STRONG",
          diagnostic_rationale: "High accuracy and fast solve times.",
          confidence: "HIGH",
        },
      ],
      mistake_analysis: [
        {
          question_id: "q-1",
          likely_category: "CALCULATION",
          observation: "Late-stage arithmetic error in torque balance equation.",
          confidence: "HIGH",
        },
      ],
      time_strategy: {
        pacing_commentary: "Average time per question was 90s, well balanced.",
        time_management_efficiency: "Effective allocation across subjects.",
        stamina_insight: "Late-exam accuracy was maintained above 70%.",
      },
      action_plan: [
        {
          priority: 1,
          topic_name: "Rotational Dynamics",
          reason: "Accuracy can be elevated with targeted calculation drills.",
          recommended_action: "Practice 20 multi-concept JEE Advanced PYQ questions.",
          target_practice_questions: 20,
        },
      ],
    };

    it("successfully parses valid structured 6-section diagnostic report", () => {
      const parsed = AIDiagnosticReportSchema.safeParse(validReport);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.report_version).toBe("v1.0.0");
        expect(parsed.data.summary.strengths_summary).toContain("Mechanics");
      }
    });

    it("rejects malformed AI reports missing required sections", () => {
      const malformed = {
        summary: validReport.summary,
        // missing other sections
      };
      const parsed = AIDiagnosticReportSchema.safeParse(malformed);
      expect(parsed.success).toBe(false);
    });

    it("rejects AI reports containing non-whitelisted mistake categories", () => {
      const invalidCategory = {
        ...validReport,
        mistake_analysis: [
          {
            question_id: "q-1",
            likely_category: "RANDOM_GUESSING_UNVERIFIED",
            observation: "Test observation",
            confidence: "MEDIUM",
          },
        ],
      };
      const parsed = AIDiagnosticReportSchema.safeParse(invalidCategory);
      expect(parsed.success).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 3. [INTEGRATION] AI Provider Interface Contract & Fallback Verification */
  /* ======================================================================== */
  describe("[INTEGRATION] AI Provider Interface Contract", () => {
    const mockPayload: DeterministicAnalyticsPayload = {
      attempt_id: "att-contract-1",
      test_id: "test-contract-1",
      test_title: "Full JEE Main Diagnostic Test",
      exam_type: "JEE_MAIN",
      total_score: 60,
      max_score: 120,
      accuracy_percentage: 65,
      total_attempted: 22,
      total_correct: 15,
      total_incorrect: 7,
      total_unattempted: 8,
      duration_minutes: 180,
      time_spent_seconds: 9000,
      subject_metrics: [
        {
          subject_id: "s1",
          subject_name: "Physics",
          score: 40,
          max_score: 40,
          accuracy: 100,
          attempted: 10,
          correct: 10,
          incorrect: 0,
          unattempted: 0,
          time_spent_seconds: 3000,
        },
      ],
      chapter_metrics: [
        {
          chapter_id: "c1",
          chapter_name: "Kinematics",
          subject_name: "Physics",
          total_questions: 5,
          attempted: 5,
          correct: 5,
          incorrect: 0,
          accuracy: 100,
          avg_time_seconds: 120,
          evidence_status: "STRONG",
        },
      ],
      topic_metrics: [],
      time_metrics: {
        total_time_seconds: 9000,
        allocated_time_seconds: 10800,
        avg_time_per_question_seconds: 300,
        avg_time_correct_seconds: 150,
        avg_time_incorrect_seconds: 400,
        avg_time_unattempted_seconds: 0,
        longest_question_id: "q-1",
        longest_question_seconds: 450,
        late_exam_accuracy: 75,
      },
      incorrect_questions: [],
    };

    it("MockAIProvider generates schema-validated diagnostic report without network dependency", async () => {
      const provider = new MockAIProvider();
      const report = await provider.generateDiagnosticReport(mockPayload);

      expect(report.report_version).toBe("v1.0.0");
      expect(report.summary.strengths_summary).toBeDefined();
      expect(report.subject_analysis.length).toBeGreaterThanOrEqual(1);
      expect(report.time_strategy.pacing_commentary).toBeDefined();
      expect(report.action_plan.length).toBeGreaterThanOrEqual(1);

      const parsed = AIDiagnosticReportSchema.safeParse(report);
      expect(parsed.success).toBe(true);
    });

    it("GeminiAdapter enforces API key requirement when calling normalizeAndExtractQuestion", async () => {
      const adapter = new GeminiAdapter("");
      await expect(
        adapter.normalizeAndExtractQuestion("Sample question text")
      ).rejects.toThrow(/GEMINI_API_KEY is not configured/i);
    });
  });
});
