import { describe, it, expect } from "vitest";
import { AIDiagnosticReportSchema } from "@/types/diagnosticReport";
import { MockAIProvider } from "@/lib/ai/mockAdapter";
import { DeterministicAnalyticsPayload } from "@/types/diagnosticReport";

describe("Phase 11 AI Diagnostic Report Schema & Safety Suite", () => {
  const validReport = {
    report_version: "v1.0.0",
    summary: {
      strengths_summary: "Strong performance in Mechanics and Kinematics with high accuracy.",
      weaknesses_summary: "Needs attention in Thermodynamics and Equilibrium calculations.",
      overall_interpretation: "Overall solid attempt with 75% accuracy. Pacing was well managed throughout the test.",
    },
    subject_analysis: [
      {
        subject_name: "Physics",
        commentary: "Demonstrates consistent mastery over kinematics and rotational mechanics.",
        relative_standing: "Strong",
      },
      {
        subject_name: "Chemistry",
        commentary: "Moderate performance in physical chemistry, requiring additional numerical drills.",
        relative_standing: "Moderate",
      },
    ],
    chapter_analysis: [
      {
        chapter_name: "Rotation",
        status: "STRONG",
        diagnostic_rationale: "4 out of 5 questions answered correctly with solid speed.",
        confidence: "HIGH",
      },
      {
        chapter_name: "Thermodynamics",
        status: "NEEDS_ATTENTION",
        diagnostic_rationale: "Multiple sign errors in heat engine and enthalpy problems.",
        confidence: "HIGH",
      },
    ],
    mistake_analysis: [
      {
        question_id: "q-101",
        likely_category: "CALCULATION",
        observation: "Spent 220s before selecting option B; indicates sign error in final algebraic step.",
        confidence: "MEDIUM",
      },
    ],
    time_strategy: {
      pacing_commentary: "Average time per question was 85s, well within the target threshold.",
      time_management_efficiency: "Good allocation of time across easy and hard questions.",
      stamina_insight: "Late exam accuracy remained steady at 80%.",
    },
    action_plan: [
      {
        priority: 1,
        topic_name: "Thermodynamics Heat Engine",
        reason: "Low accuracy and repeated calculation errors in PV work problems.",
        recommended_action: "Review Carnot cycle derivations and solve 25 PYQ problems.",
        target_practice_questions: 25,
      },
    ],
  };

  /* ======================================================================== */
  /* 1. [UNIT] Schema Validation & Malformed Payload Rejection               */
  /* ======================================================================== */
  describe("[UNIT] AIDiagnosticReportSchema Boundaries", () => {
    it("accepts a fully compliant 6-section diagnostic report", () => {
      const parsed = AIDiagnosticReportSchema.safeParse(validReport);
      expect(parsed.success).toBe(true);
    });

    it("rejects reports missing mandatory sections (e.g. action_plan or summary)", () => {
      const missingActionPlan = { ...validReport, action_plan: undefined };
      expect(AIDiagnosticReportSchema.safeParse(missingActionPlan).success).toBe(false);

      const missingSummary = { ...validReport, summary: undefined };
      expect(AIDiagnosticReportSchema.safeParse(missingSummary).success).toBe(false);
    });

    it("rejects invalid enum values for status or mistake categories", () => {
      const invalidStatus = {
        ...validReport,
        chapter_analysis: [
          {
            chapter_name: "Rotation",
            status: "UNKNOWN_STATUS",
            diagnostic_rationale: "Rationale",
            confidence: "HIGH",
          },
        ],
      };
      expect(AIDiagnosticReportSchema.safeParse(invalidStatus).success).toBe(false);

      const invalidCategory = {
        ...validReport,
        mistake_analysis: [
          {
            question_id: "q-1",
            likely_category: "CARELESS_GUESS_TYPO",
            observation: "Observation text here.",
            confidence: "MEDIUM",
          },
        ],
      };
      expect(AIDiagnosticReportSchema.safeParse(invalidCategory).success).toBe(false);
    });

    it("rejects action plan items with unrealistic target practice question counts (<5 or >50)", () => {
      const tooFewQs = {
        ...validReport,
        action_plan: [
          {
            priority: 1,
            topic_name: "Topic",
            reason: "Reason text",
            recommended_action: "Action text",
            target_practice_questions: 2, // min is 5
          },
        ],
      };
      expect(AIDiagnosticReportSchema.safeParse(tooFewQs).success).toBe(false);

      const tooManyQs = {
        ...validReport,
        action_plan: [
          {
            priority: 1,
            topic_name: "Topic",
            reason: "Reason text",
            recommended_action: "Action text",
            target_practice_questions: 500, // max is 50
          },
        ],
      };
      expect(AIDiagnosticReportSchema.safeParse(tooManyQs).success).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 2. [UNIT] MockAIProvider Diagnostics Generation                          */
  /* ======================================================================== */
  describe("[UNIT] MockAIProvider.generateDiagnosticReport()", () => {
    const mockPayload: DeterministicAnalyticsPayload = {
      attempt_id: "att-1",
      test_id: "test-1",
      test_title: "JEE Main Diagnostic Mock",
      exam_type: "JEE_MAIN",
      total_score: 45,
      max_score: 120,
      accuracy_percentage: 60,
      total_attempted: 20,
      total_correct: 12,
      total_incorrect: 8,
      total_unattempted: 10,
      duration_minutes: 180,
      time_spent_seconds: 7200,
      subject_metrics: [
        {
          subject_id: "s1",
          subject_name: "Physics",
          score: 30,
          max_score: 40,
          accuracy: 75,
          attempted: 10,
          correct: 8,
          incorrect: 2,
          unattempted: 0,
          time_spent_seconds: 2400,
        },
        {
          subject_id: "s2",
          subject_name: "Chemistry",
          score: 15,
          max_score: 40,
          accuracy: 40,
          attempted: 10,
          correct: 4,
          incorrect: 6,
          unattempted: 0,
          time_spent_seconds: 4800,
        },
      ],
      chapter_metrics: [
        {
          chapter_id: "c1",
          chapter_name: "Mechanics",
          subject_name: "Physics",
          total_questions: 10,
          attempted: 10,
          correct: 8,
          incorrect: 2,
          accuracy: 80,
          avg_time_seconds: 240,
          evidence_status: "STRONG",
        },
        {
          chapter_id: "c2",
          chapter_name: "Organic Chemistry",
          subject_name: "Chemistry",
          total_questions: 10,
          attempted: 10,
          correct: 4,
          incorrect: 6,
          accuracy: 40,
          avg_time_seconds: 480,
          evidence_status: "NEEDS_ATTENTION",
        },
      ],
      topic_metrics: [],
      time_metrics: {
        total_time_seconds: 7200,
        allocated_time_seconds: 10800,
        avg_time_per_question_seconds: 360,
        avg_time_correct_seconds: 200,
        avg_time_incorrect_seconds: 500,
        avg_time_unattempted_seconds: 0,
        longest_question_id: "q-bad",
        longest_question_seconds: 600,
        late_exam_accuracy: 33,
      },
      incorrect_questions: [
        {
          question_id: "q-bad",
          subject_name: "Chemistry",
          chapter_name: "Organic Chemistry",
          difficulty: "HARD",
          selected_option_key: "A",
          correct_option_key: "C",
          marks_awarded: -1,
          time_spent_seconds: 600,
          marked_for_review: false,
        },
      ],
    };

    it("generates a schema-compliant report from deterministic analytics", async () => {
      const provider = new MockAIProvider();
      const report = await provider.generateDiagnosticReport(mockPayload);

      const parsed = AIDiagnosticReportSchema.safeParse(report);
      expect(parsed.success).toBe(true);

      // Verify sections are populated
      expect(report.summary.strengths_summary).toContain("Physics");
      expect(report.summary.weaknesses_summary).toContain("Chemistry");
      expect(report.chapter_analysis.some((c) => c.chapter_name === "Organic Chemistry" && c.status === "NEEDS_ATTENTION")).toBe(true);
      expect(report.action_plan.length).toBeGreaterThan(0);
      expect(report.action_plan[0].topic_name).toBe("Organic Chemistry");
    });
  });
});
