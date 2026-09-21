import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole, TargetExam } from "@/types/auth";

export interface ProvisionUserParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  targetExam?: TargetExam;
}

/**
 * Controlled User Provisioning Service.
 * Used exclusively by Admins or backend seed scripts using the Supabase Service Role Key.
 * Strictly unavailable to public unauthenticated or student requests.
 */
export async function provisionControlledUser({
  email,
  password,
  fullName,
  role,
  targetExam = "JEE_MAIN",
}: ProvisionUserParams) {
  const adminSupabase = createAdminClient();

  // 1. Create auth user with confirmed email
  const { data: userData, error: userError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        target_exam: targetExam,
      },
    });

  if (userError || !userData.user) {
    throw new Error(`Failed to create controlled user: ${userError?.message}`);
  }

  // 2. Upsert profile with authoritative role
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: userData.user.id,
      email,
      full_name: fullName,
      role,
      target_exam: targetExam,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    throw new Error(`Failed to provision profile: ${profileError.message}`);
  }

  return {
    userId: userData.user.id,
    email,
    role,
  };
}
