import { describe, it, expect } from "vitest";
import { SignUpSchema, LoginSchema, UpdateProfileSchema } from "@/types/auth";

describe("Authentication & Input Validation Security", () => {
  describe("Sign Up Validation & Anti-Escalation", () => {
    it("successfully validates valid student registration input", () => {
      const input = {
        fullName: "Aarav Sharma",
        email: "aarav@school.edu",
        password: "securepassword123",
        targetExam: "JEE_MAIN",
      };

      const result = SignUpSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("Aarav Sharma");
        expect(result.data.targetExam).toBe("JEE_MAIN");
      }
    });

    it("ignores or strips client-injected role payload during public signup", () => {
      const maliciousInput = {
        fullName: "Malicious User",
        email: "hacker@school.edu",
        password: "password123",
        targetExam: "JEE_MAIN",
        role: "ADMIN", // Client trying to escalate privileges
      };

      const result = SignUpSchema.safeParse(maliciousInput);
      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript & Zod schema ensure role is NOT a property of SignUpSchema
        expect((result.data as any).role).toBeUndefined();
      }
    });

    it("rejects weak passwords less than 6 characters", () => {
      const input = {
        fullName: "Aarav",
        email: "aarav@school.edu",
        password: "123",
        targetExam: "JEE_MAIN",
      };

      const result = SignUpSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const input = {
        fullName: "Aarav",
        email: "not-an-email",
        password: "password123",
        targetExam: "JEE_MAIN",
      };

      const result = SignUpSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Login Validation", () => {
    it("validates well-formed login credentials", () => {
      const input = {
        email: "student@school.edu",
        password: "mysecretpassword",
      };

      const result = LoginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const input = {
        email: "student@school.edu",
        password: "",
      };

      const result = LoginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Profile Update Anti-Tampering", () => {
    it("allows updating full_name and target_exam", () => {
      const input = {
        fullName: "Aarav Sharma (Updated)",
        targetExam: "JEE_ADV",
      };

      const result = UpdateProfileSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("strictly forbids modifying role through user profile update schema", () => {
      const maliciousUpdate = {
        fullName: "Aarav Sharma",
        role: "ADMIN", // Attacker trying to elevate own role
      };

      const result = UpdateProfileSchema.safeParse(maliciousUpdate);
      expect(result.success).toBe(true);
      // Ensure 'role' is not part of the output data
      expect((result.data as any).role).toBeUndefined();
    });
  });
});
