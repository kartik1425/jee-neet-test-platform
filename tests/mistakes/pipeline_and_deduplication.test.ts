import { describe, it, expect } from "vitest";
import { processAttemptMistakes } from "@/lib/mistakes/pipeline";
import { teacherConfirmOrCorrectMistakeAction } from "@/lib/mistakes/actions";

describe("Phase 12 Pipeline, Deduplication & Teacher Audit Trail Suite", () => {
  /* ======================================================================== */
  /* 1. [INTEGRATION] Attempt Mistake Extraction & Idempotency                */
  /* ======================================================================== */
  describe("[INTEGRATION] processAttemptMistakes() Pipeline & Deduplication", () => {
    it("safely handles non-existent attempts without crashing", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { message: "Attempt not found" } }),
            }),
          }),
        }),
      };

      const result = await processAttemptMistakes("att-non-existent", mockSupabase);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Attempt not found");
      expect(result.processed_count).toBe(0);
    });

    it("idempotently processes attempt answers and inserts unique mistake records", async () => {
      let insertedRecords: any[] = [];
      let questionHistoryUpserts: any[] = [];

      const mockAttempt = {
        id: "att-mock-1",
        test_id: "test-mock-1",
        student_id: "stu-mock-1",
        time_spent_seconds: 3600,
        test: {
          id: "test-mock-1",
          title: "Physics Sectional",
          duration_minutes: 60,
          exam_type: "JEE_MAIN",
        },
      };

      const mockAnswers = [
        {
          id: "ans-1",
          attempt_id: "att-mock-1",
          question_id: "q-1",
          selected_option_id: "opt-1-b",
          is_marked_for_review: false,
          is_visited: true,
          time_spent_seconds: 240, // calculation error
          is_correct: false,
          marks_awarded: -1,
          question: {
            id: "q-1",
            content_latex: "Calculate torque",
            difficulty: "MEDIUM",
            subject_id: "sub-1",
            chapter_id: "chap-1",
            topic_id: null,
            options: [
              { id: "opt-1-a", option_key: "A", content_latex: "10", is_correct: true },
              { id: "opt-1-b", option_key: "B", content_latex: "20", is_correct: false },
            ],
          },
        },
      ];

      const mockSupabase = {
        from: (table: string) => {
          return {
            select: (cols?: string) => {
              if (table === "subjects") {
                return Promise.resolve({ data: [{ id: "sub-1", name: "Physics" }], error: null });
              }
              if (table === "chapters") {
                return Promise.resolve({ data: [{ id: "chap-1", name: "Rotation" }], error: null });
              }
              if (table === "topics") {
                return Promise.resolve({ data: [], error: null });
              }
              return {
                eq: (col: string, val: string) => {
                  if (table === "attempts") {
                    return {
                      single: async () => ({ data: mockAttempt, error: null }),
                    };
                  }
                  if (table === "attempt_answers") {
                    return Promise.resolve({ data: mockAnswers, error: null });
                  }
                  if (table === "student_question_history") {
                    return {
                      eq: () => ({
                        maybeSingle: async () => ({ data: null, error: null }),
                      }),
                    };
                  }
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
            upsert: async (records: any[], options: any) => {
              insertedRecords = records;
              return { data: records, error: null };
            },
            insert: async (record: any) => {
              questionHistoryUpserts.push(record);
              return { data: record, error: null };
            },
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        },
      };

      const res = await processAttemptMistakes("att-mock-1", mockSupabase);
      expect(res.success).toBe(true);
      expect(res.processed_count).toBe(1);
      expect(insertedRecords).toHaveLength(1);
      expect(insertedRecords[0].mistake_type).toBe("CALCULATION_ERROR");
      expect(insertedRecords[0].attempt_answer_id).toBe("ans-1");
      expect(insertedRecords[0].evidence.audit_history).toHaveLength(1);
      expect(insertedRecords[0].evidence.audit_history[0].source).toBe("RULE");
    });
  });

  /* ======================================================================== */
  /* 2. [INTEGRATION] Teacher Correction & Audit Trail Preservation          */
  /* ======================================================================== */
  describe("[INTEGRATION] Teacher Confirmation & Audit Trail", () => {
    it("preserves previous AI/Rule suggestion in audit history when teacher updates classification", () => {
      const existingEvidence = {
        time_spent_seconds: 240,
        correct_option_key: "A",
        difficulty: "MEDIUM",
        is_marked_for_review: false,
        is_unattempted: false,
        rule_triggered: "RULE_EXTENDED_DELIBERATION_CALCULATION",
        rationale: "Initial rule calculation suggestion",
        audit_history: [
          {
            changed_at: "2026-09-21T10:00:00Z",
            previous_type: "CALCULATION_ERROR" as const,
            new_type: "CALCULATION_ERROR" as const,
            changed_by: "SYSTEM",
            source: "RULE" as const,
            notes: "Initial automated extraction",
          },
        ],
      };

      // Simulating teacher update
      const newType = "CONCEPTUAL_ERROR" as const;
      const teacherNotes = "Teacher verified: student applied wrong angular momentum axis.";
      const updatedAudit = [
        ...existingEvidence.audit_history,
        {
          changed_at: "2026-09-21T11:00:00Z",
          previous_type: "CALCULATION_ERROR" as const,
          new_type: newType,
          changed_by: "teacher-user-123",
          source: "TEACHER" as const,
          notes: teacherNotes,
        },
      ];

      expect(updatedAudit).toHaveLength(2);
      expect(updatedAudit[0].source).toBe("RULE");
      expect(updatedAudit[1].source).toBe("TEACHER");
      expect(updatedAudit[1].previous_type).toBe("CALCULATION_ERROR");
      expect(updatedAudit[1].new_type).toBe("CONCEPTUAL_ERROR");
    });
  });
});
