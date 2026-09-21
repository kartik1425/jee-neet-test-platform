import { requireRole } from "@/lib/auth/session";
import { SelfTestCreatorForm } from "@/components/practice/SelfTestCreatorForm";

export const dynamic = "force-dynamic";

export default async function NewPracticeTestPage() {
  await requireRole(["STUDENT", "TEACHER", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SelfTestCreatorForm />
    </div>
  );
}
