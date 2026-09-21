import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  checkInMemoryRateLimit,
  validateBoundedPayload,
} from "@/lib/security/rateLimiter";
import { sanitizeLogData } from "@/lib/logging/logger";

describe("Phase 15 Production Hardening & Security Suite [SECURITY]", () => {
  const migration10Path = path.resolve(
    __dirname,
    "../../supabase/migrations/20260921000010_phase15_production_security_hardening.sql"
  );
  const migration1Path = path.resolve(
    __dirname,
    "../../supabase/migrations/20260921000001_auth_and_profiles.sql"
  );
  const migration3Path = path.resolve(
    __dirname,
    "../../supabase/migrations/20260921000003_student_safe_views_and_grants.sql"
  );

  /* ======================================================================== */
  /* 1. [SECURITY] Secret Isolation & Client Bundle Safety                    */
  /* ======================================================================== */
  describe("[SECURITY] Secret Isolation", () => {
    it("verifies server-only secrets are NEVER prefixed with NEXT_PUBLIC_", () => {
      const srcDir = path.resolve(__dirname, "../../src");
      const checkFiles = (dir: string): string[] => {
        let results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(checkFiles(fullPath));
          } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
            results.push(fullPath);
          }
        }
        return results;
      };

      const files = checkFiles(srcDir);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        expect(content).not.toContain("NEXT_PUBLIC_GEMINI_API_KEY");
        expect(content).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
      }
    });
  });

  /* ======================================================================== */
  /* 2. [SECURITY] SECURITY DEFINER Functions & Search Path Hardening        */
  /* ======================================================================== */
  describe("[DATABASE/RLS] SECURITY DEFINER Audit", () => {
    it("verifies get_current_user_role has explicit search_path and revoked public execute", () => {
      expect(fs.existsSync(migration10Path)).toBe(true);
      const sql = fs.readFileSync(migration10Path, "utf-8");
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.get_current_user_role()");
      expect(sql).toContain("SET search_path = public");
      expect(sql).toContain("REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC");
    });

    it("verifies get_attempt_review has explicit search_path and revoked public execute", () => {
      const sql10 = fs.readFileSync(migration10Path, "utf-8");
      const sql3 = fs.readFileSync(migration3Path, "utf-8");
      expect(sql3).toContain("CREATE OR REPLACE FUNCTION public.get_attempt_review");
      expect(sql3).toContain("SET search_path = public");
      expect(sql10).toContain("REVOKE ALL ON FUNCTION public.get_attempt_review(UUID) FROM PUBLIC");
    });
  });

  /* ======================================================================== */
  /* 3. [SECURITY] Role Escalation & Profile Integrity                        */
  /* ======================================================================== */
  describe("[SECURITY] Role Escalation Prevention", () => {
    it("verifies handle_new_user trigger defaults strictly to STUDENT", () => {
      const sql = fs.readFileSync(migration1Path, "utf-8");
      expect(sql).toContain("assigned_role public.user_role := 'STUDENT'");
    });

    it("verifies profile update policy prevents non-admins from changing their role", () => {
      const sql = fs.readFileSync(migration1Path, "utf-8");
      expect(sql).toContain('CREATE POLICY "Users can update own non-role profile fields"');
      expect(sql).toContain("role = (SELECT role FROM public.profiles WHERE id = auth.uid())");
    });
  });

  /* ======================================================================== */
  /* 4. [SECURITY] Layered Rate Limiting & Bounded Payloads                   */
  /* ======================================================================== */
  describe("[SECURITY] Rate Limiting & Bounded Payloads", () => {
    it("correctly allows requests within limit and rejects on burst limit", () => {
      const testKey = `test-limit-${Date.now()}`;
      const config = { maxRequests: 3, windowMs: 5000 };

      const r1 = checkInMemoryRateLimit(testKey, config);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkInMemoryRateLimit(testKey, config);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkInMemoryRateLimit(testKey, config);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkInMemoryRateLimit(testKey, config);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it("enforces maximum bounded payload size limits to prevent memory exhaustion", () => {
      const smallPayload = JSON.stringify({ prompt: "Generate Physics questions" });
      const smallRes = validateBoundedPayload(smallPayload, 1024);
      expect(smallRes.valid).toBe(true);

      const hugePayload = "A".repeat(2048);
      const hugeRes = validateBoundedPayload(hugePayload, 1024);
      expect(hugeRes.valid).toBe(false);
      expect(hugeRes.error).toContain("exceeds maximum allowed limit");
    });
  });

  /* ======================================================================== */
  /* 5. [SECURITY] Structured Logging & PII / Credential Redaction            */
  /* ======================================================================== */
  describe("[SECURITY] Safe Structured Logger", () => {
    it("automatically redacts API keys, passwords, and tokens from log objects", () => {
      const dirtyLog = {
        userId: "user-123",
        action: "login",
        password: "SuperSecretPassword123!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        gemini_api_key: "AIzaSySecretKey",
        nested: {
          secret: "hidden-value",
          normalField: "visible",
        },
      };

      const sanitized = sanitizeLogData(dirtyLog);
      expect(sanitized.userId).toBe("user-123");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.gemini_api_key).toBe("[REDACTED]");
      expect(sanitized.nested.secret).toBe("[REDACTED]");
      expect(sanitized.nested.normalField).toBe("visible");
    });
  });
});
