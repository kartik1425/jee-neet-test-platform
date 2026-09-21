import { describe, it, expect, vi } from "vitest";
import { provisionControlledUser } from "@/lib/auth/admin-service";
import * as adminSupabaseModule from "@/lib/supabase/admin";

describe("Controlled User Provisioning & Administrative Security", () => {
  it("provisions a verified TEACHER account through admin service role", async () => {
    const mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: "teacher-uuid-123", email: "teacher@school.edu" } },
      error: null,
    });

    const mockUpsert = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockAdminClient: any = {
      auth: {
        admin: {
          createUser: mockCreateUser,
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    };

    vi.spyOn(adminSupabaseModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const result = await provisionControlledUser({
      email: "teacher@school.edu",
      password: "TeacherPassword!2026",
      fullName: "Dr. Physics Faculty",
      role: "TEACHER",
    });

    expect(result.userId).toBe("teacher-uuid-123");
    expect(result.role).toBe("TEACHER");
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "teacher@school.edu",
      password: "TeacherPassword!2026",
      email_confirm: true,
      user_metadata: {
        full_name: "Dr. Physics Faculty",
        role: "TEACHER",
        target_exam: "JEE_MAIN",
      },
    });
  });

  it("provisions an ADMIN account with unrestricted clearance", async () => {
    const mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: "admin-uuid-999", email: "admin@school.edu" } },
      error: null,
    });

    const mockUpsert = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockAdminClient: any = {
      auth: {
        admin: {
          createUser: mockCreateUser,
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    };

    vi.spyOn(adminSupabaseModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const result = await provisionControlledUser({
      email: "admin@school.edu",
      password: "AdminSuperSecret!2026",
      fullName: "Master Administrator",
      role: "ADMIN",
    });

    expect(result.userId).toBe("admin-uuid-999");
    expect(result.role).toBe("ADMIN");
  });
});
