import { z } from "zod";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type TargetExam = "JEE_MAIN" | "JEE_ADV" | "NEET";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  target_exam?: TargetExam | null;
  target_year?: number | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Public Signup Schema.
 * Role is strictly omitted from user input. All public signups are assigned STUDENT.
 */
export const SignUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  targetExam: z.enum(["JEE_MAIN", "JEE_ADV", "NEET"]).default("JEE_MAIN"),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  targetExam: z.enum(["JEE_MAIN", "JEE_ADV", "NEET"]).optional(),
  targetYear: z.number().int().min(2025).max(2035).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
