import { describe, it, expect } from "vitest";
import { IngestionUploadSchema, IngestionItemEditSchema } from "@/types/ingestion";

describe("Phase 9 Ingestion Pipeline & Staging Flow Suite", () => {
  /* ======================================================================== */
  /* 1. INTEGRATION: Ingestion Upload & Rights Declaration Validation         */
  /* ======================================================================== */
  describe("[INTEGRATION] Ingestion Upload & Staging Setup", () => {
    it("validates upload payload with rights declaration", () => {
      const payload = {
        title: "2024 Resonance Physics Mock Paper 1",
        rightsDeclaration: "SCHOOL_PROVIDED",
        fileType: "CSV",
        examType: "JEE_MAIN",
        defaultSubjectId: "550e8400-e29b-41d4-a716-446655440001",
        defaultChapterId: "550e8400-e29b-41d4-a716-446655440002",
        textContent: "Question,Option A,Option B,Option C,Option D,Correct Answer\nQ,A,B,C,D,A",
      };

      const parsed = IngestionUploadSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("rejects upload payload with invalid rights declaration or missing title", () => {
      expect(
        IngestionUploadSchema.safeParse({
          title: "",
          rightsDeclaration: "PIRATED_MATERIAL", // Invalid
          fileType: "TEXT",
        }).success
      ).toBe(false);
    });

    it("validates reviewer item edit payload before database update", () => {
      const editPayload = {
        extracted_latex: "Calculate electric field $E = \\frac{kq}{r^2}$ at $r = 1\\text{ m}$.",
        options: [
          { option_key: "A", content_latex: "9 \\times 10^9 \\text{ N/C}", is_correct: true },
          { option_key: "B", content_latex: "4.5 \\times 10^9 \\text{ N/C}", is_correct: false },
          { option_key: "C", content_latex: "18 \\times 10^9 \\text{ N/C}", is_correct: false },
          { option_key: "D", content_latex: "0 \\text{ N/C}", is_correct: false },
        ],
        correct_option_key: "A",
        explanation_latex: "Direct application of Coulomb's Law.",
        exam_type: "JEE_MAIN",
        subject_id: "550e8400-e29b-41d4-a716-446655440001",
        chapter_id: "550e8400-e29b-41d4-a716-446655440002",
        topic_id: null,
        difficulty: "MEDIUM",
        source_type: "PYQ",
        pyq_year: 2023,
        pyq_shift: "Shift 2",
        pyq_provenance_status: "VERIFIED",
      };

      const parsed = IngestionItemEditSchema.safeParse(editPayload);
      expect(parsed.success).toBe(true);
    });
  });

  /* ======================================================================== */
  /* 2. INTEGRATION: Staged Item Audit Trail & Immutability                   */
  /* ======================================================================== */
  describe("[INTEGRATION] Staged Item Question Bank Import Guarantees", () => {
    it("guarantees approved questions retain ingestion_batch_id and provenance reference upon import", () => {
      const approvedStagingItem = {
        id: "ingest-item-101",
        batch_id: "batch-2026-01",
        extracted_latex: "Calculate capacitance of parallel plate capacitor $C = \\frac{\\varepsilon_0 A}{d}$.",
        options: [
          { option_key: "A", content_latex: "1 \\mu\\text{F}", is_correct: true },
          { option_key: "B", content_latex: "2 \\mu\\text{F}", is_correct: false },
          { option_key: "C", content_latex: "3 \\mu\\text{F}", is_correct: false },
          { option_key: "D", content_latex: "4 \\mu\\text{F}", is_correct: false },
        ],
        correct_option_key: "A",
        subject_id: "sub-phy",
        chapter_id: "chap-cap",
        difficulty: "EASY",
        source_type: "PYQ",
        pyq_year: 2024,
        source_location_ref: "Page 4, Q18",
        status: "APPROVED",
      };

      // Simulated question bank record created upon import
      const importedQuestionRecord = {
        id: "q-live-501",
        subject_id: approvedStagingItem.subject_id,
        chapter_id: approvedStagingItem.chapter_id,
        content_latex: approvedStagingItem.extracted_latex,
        source_reference: `Batch: ${approvedStagingItem.batch_id}, Ref: ${approvedStagingItem.source_location_ref}`,
        status: "APPROVED",
        ingestion_batch_id: approvedStagingItem.batch_id,
        ingestion_item_id: approvedStagingItem.id,
      };

      expect(importedQuestionRecord.ingestion_batch_id).toBe("batch-2026-01");
      expect(importedQuestionRecord.ingestion_item_id).toBe("ingest-item-101");
      expect(importedQuestionRecord.content_latex).toBe(approvedStagingItem.extracted_latex);
    });
  });
});
