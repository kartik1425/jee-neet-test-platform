import { describe, it, expect } from "vitest";
import { UserRole } from "@/types/auth";

// Role-Based Access Control matrix helper
function isAuthorized(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

describe("Role-Based Access Control (RBAC) Verification", () => {
  const studentRoles: UserRole[] = ["STUDENT"];
  const teacherRoles: UserRole[] = ["TEACHER", "ADMIN"];
  const adminOnlyRoles: UserRole[] = ["ADMIN"];

  describe("Student Role Authorization", () => {
    const role: UserRole = "STUDENT";

    it("allows student to access student-only routes", () => {
      expect(isAuthorized(role, studentRoles)).toBe(true);
    });

    it("STRICTLY BLOCKS student from accessing teacher routes", () => {
      expect(isAuthorized(role, teacherRoles)).toBe(false);
    });

    it("STRICTLY BLOCKS student from accessing admin routes", () => {
      expect(isAuthorized(role, adminOnlyRoles)).toBe(false);
    });
  });

  describe("Teacher Role Authorization", () => {
    const role: UserRole = "TEACHER";

    it("allows teacher to access teacher routes", () => {
      expect(isAuthorized(role, teacherRoles)).toBe(true);
    });

    it("STRICTLY BLOCKS teacher from accessing admin master routes", () => {
      expect(isAuthorized(role, adminOnlyRoles)).toBe(false);
    });

    it("blocks teacher from student portal default namespace unless student role is also granted", () => {
      expect(isAuthorized(role, studentRoles)).toBe(false);
    });
  });

  describe("Admin Role Authorization", () => {
    const role: UserRole = "ADMIN";

    it("allows admin to access admin routes", () => {
      expect(isAuthorized(role, adminOnlyRoles)).toBe(true);
    });

    it("allows admin to access teacher routes for inspection/management", () => {
      expect(isAuthorized(role, teacherRoles)).toBe(true);
    });
  });
});
