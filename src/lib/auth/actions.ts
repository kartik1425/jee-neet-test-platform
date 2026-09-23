"use server";

import { createClient } from "@/lib/supabase/server";
import { getRoleDashboardPath, requireAuth } from "./session";
import { LoginSchema, SignUpSchema, UpdateProfileSchema } from "@/types/auth";
import { redirect } from "next/navigation";

export interface ActionResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Student Public Sign Up Action.
 * Role is strictly NOT accepted from form data and is set to STUDENT.
 */
export async function signUpAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    targetExam: formData.get("targetExam") || "JEE_MAIN",
  };

  const parsed = SignUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid signup data provided.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password, targetExam } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        target_exam: targetExam,
        // Role is strictly fixed to STUDENT in user metadata
        role: "STUDENT",
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (data?.user) {
    // Attempt fallback profile insert in case trigger didn't fire
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email || email,
      full_name: fullName,
      role: "STUDENT",
      target_exam: targetExam,
    });
  }

  const returnTo = formData.get("returnTo")?.toString();
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirect(returnTo);
  }

  // Redirect to student portal
  redirect("/student");
}

/**
 * Universal Login Action.
 * Reads verified role from the profiles table and redirects accordingly.
 */
export async function loginAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please enter a valid email and password.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || "Invalid email or password.",
    };
  }

  const returnTo = formData.get("returnTo")?.toString();
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirect(returnTo);
  }

  // Fetch authoritative role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role || "STUDENT";
  redirect(getRoleDashboardPath(role));
}

/**
 * Logout Action
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Update Profile Action.
 * Role field is strictly ignored to prevent client-side escalation.
 */
export async function updateProfileAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireAuth();

  const rawData = {
    fullName: formData.get("fullName"),
    targetExam: formData.get("targetExam"),
  };

  const parsed = UpdateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid profile data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      target_exam: parsed.data.targetExam,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}
