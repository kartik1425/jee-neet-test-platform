import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Phase 13 Teacher & Class Security & RLS Suite [DATABASE/RLS]", () => {
  const schemaMigrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20260921000002_complete_database_schema.sql"
  );

  /* ======================================================================== */
  /* 1. [DATABASE/RLS] Migration Schema & Table Constraints                   */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Classes & Members Schema Integrity", () => {
    it("verifies migration file exists and defines classes and class_members tables", () => {
      expect(fs.existsSync(schemaMigrationPath)).toBe(true);
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.classes");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.class_members");
    });

    it("enforces UNIQUE(class_id, student_id) on class_members to prevent duplicate enrollments", () => {
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain("UNIQUE(class_id, student_id)");
    });

    it("enforces CASCADE deletion on class_members when class or student is removed", () => {
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain("class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE");
      expect(sql).toContain("student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE");
    });
  });

  /* ======================================================================== */
  /* 2. [DATABASE/RLS] Row Level Security (RLS) Policies                      */
  /* ======================================================================== */
  describe("[DATABASE/RLS] Classes & Class Members RLS Isolation", () => {
    it("enforces Teacher and Admin management policy on classes", () => {
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Teachers and Admins can view and manage classes"');
      expect(sql).toContain("public.get_current_user_role() IN ('TEACHER', 'ADMIN')");
    });

    it("restricts student visibility of classes strictly to batches they belong to", () => {
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Students can view classes they belong to"');
      expect(sql).toContain("class_members.student_id = auth.uid()");
    });

    it("restricts student visibility of class_members strictly to their own membership or teachers/admins", () => {
      const sql = fs.readFileSync(schemaMigrationPath, "utf-8");
      expect(sql).toContain('CREATE POLICY "Class members viewable by class members, teachers, admins"');
      expect(sql).toContain("student_id = auth.uid() OR public.get_current_user_role() IN ('TEACHER', 'ADMIN')");
    });
  });
});
