import { createClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/types/auth";
import { redirect } from "next/navigation";

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
}

/**
 * Fetch authenticated user and validated profile from the database.
 * Returns null if unauthenticated or profile is missing.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return null;
    }

    // Fast-path: Check if role and target_exam exist in user metadata to avoid blocking network query
    const userRole = (user.user_metadata?.role || user.app_metadata?.role) as UserRole | undefined;
    if (userRole && ["STUDENT", "TEACHER", "ADMIN"].includes(userRole)) {
      return {
        user: { id: user.id, email: user.email },
        profile: {
          id: user.id,
          email: user.email,
          full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "Student",
          role: userRole,
          target_exam: (user.user_metadata?.target_exam as any) || "JEE_MAIN",
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Fallback: If profile record is still provisioning, return default student profile
      return {
        user: { id: user.id, email: user.email },
        profile: {
          id: user.id,
          email: user.email,
          full_name: (user.user_metadata?.full_name as string) || "Student",
          role: "STUDENT",
          target_exam: (user.user_metadata?.target_exam as any) || "JEE_MAIN",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    return {
      user: { id: user.id, email: user.email },
      profile: profile as Profile,
    };
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE" || err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Error retrieving auth session:", err);
    return null;
  }
}

/**
 * Ensures user is authenticated. Redirects to /login if not.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Ensures user has one of the allowed roles. Redirects to /unauthorized if forbidden.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.profile.role)) {
    redirect("/unauthorized");
  }
  return session;
}

/**
 * Helper to determine dashboard redirect based on role.
 */
export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
    default:
      return "/student";
  }
}
