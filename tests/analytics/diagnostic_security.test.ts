import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Phase 11 AI Diagnostic Security & RLS Suite", () => {
  const migrationPath = path.resolve(__dirname, "../../supabase/migrations/20260921000008_ai_diagnostic_reports.sql");

  /* ======================================================================== */
  /* 1. [DATABASE/RLS] Migration & Table Constraint Integrity                 */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Migration SQL Integrity & Foreign Key Safeguards", () => {
    it("verifies migration file exists and creates ai_analysis table", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ai_analysis");
    });

    it("enforces ON DELETE RESTRICT on attempt_id, user_id, and test_id to prevent accidental history cascades", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE RESTRICT");
      expect(sql).toContain("user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT");
      expect(sql).toContain("test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT");
    });

    it("enforces strict status check constraint on ai_analysis (PENDING, COMPLETED, FAILED)", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("status IN ('PENDING', 'COMPLETED', 'FAILED')");
    });

    it("enables Row Level Security (RLS) on ai_analysis", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;");
    });

    it("enforces student isolation policy (users can view only their own reports)", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Students can view own diagnostic reports"');
      expect(sql).toContain("user_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN')");
    });

    it("creates indexes on attempt_id, user_id, and test_id for fast lookup", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_ai_analysis_attempt ON public.ai_analysis(attempt_id);");
      expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_ai_analysis_user ON public.ai_analysis(user_id);");
      expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_ai_analysis_test ON public.ai_analysis(test_id);");
    });
  });
});
