import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Phase 12 Mistake Engine Database Security & RLS Suite", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20260921000009_persistent_mistake_engine.sql"
  );

  /* ======================================================================== */
  /* 1. [DATABASE/RLS] Migration Schema & Table Constraints                   */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Schema Integrity & Constraints", () => {
    it("verifies migration file exists and creates mistakes and question history tables", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.mistakes");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.student_question_history");
    });

    it("enforces ON DELETE RESTRICT on question_id, attempt_id, and test_id to prevent cascade data loss", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT");
      expect(sql).toContain("attempt_id UUID REFERENCES public.attempts(id) ON DELETE RESTRICT");
      expect(sql).toContain("test_id UUID REFERENCES public.tests(id) ON DELETE RESTRICT");
    });

    it("enforces UNIQUE(attempt_answer_id) and UNIQUE(student_id, question_id) for idempotent insertions", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("CONSTRAINT unique_attempt_answer_mistake UNIQUE (attempt_answer_id)");
      expect(sql).toContain("CONSTRAINT unique_student_question_history UNIQUE (student_id, question_id)");
    });

    it("enforces 10-category error taxonomy check constraint", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("'CONCEPTUAL_ERROR'");
      expect(sql).toContain("'FORMULA_ERROR'");
      expect(sql).toContain("'CALCULATION_ERROR'");
      expect(sql).toContain("'MISREAD_QUESTION'");
      expect(sql).toContain("'WRONG_ASSUMPTION'");
      expect(sql).toContain("'TIME_PRESSURE'");
      expect(sql).toContain("'CARELESS_ERROR'");
      expect(sql).toContain("'GUESS'");
      expect(sql).toContain("'UNABLE_TO_START'");
      expect(sql).toContain("'UNKNOWN'");
    });
  });

  /* ======================================================================== */
  /* 2. [DATABASE/RLS] Row Level Security (RLS) Policies                      */
  /* ======================================================================== */
  describe("[DATABASE/RLS] RLS Isolation & Role Scope Policies", () => {
    it("enables RLS on mistakes and student_question_history tables", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("ALTER TABLE public.student_question_history ENABLE ROW LEVEL SECURITY;");
    });

    it("enforces student isolation policy on mistakes table (student_id = auth.uid())", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Students can view their own mistakes"');
      expect(sql).toContain("student_id = auth.uid()");
    });

    it("permits teachers and admins to view and update mistake classifications", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Teachers and Admins can view mistakes"');
      expect(sql).toContain('CREATE POLICY "Teachers and Admins can update mistakes"');
      expect(sql).toContain("public.get_current_user_role() IN ('TEACHER', 'ADMIN')");
    });

    it("enforces student isolation on student_question_history", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Students can view own question history"');
      expect(sql).toContain('CREATE POLICY "Teachers and Admins can view student question history"');
    });
  });
});
