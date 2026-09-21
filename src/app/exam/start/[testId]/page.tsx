import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { startOrResumeAttempt } from "@/lib/exam/actions";

export const dynamic = "force-dynamic";

interface StartExamPageProps {
  params: Promise<{
    testId: string;
  }>;
}

export default async function StartExamPage({ params }: StartExamPageProps) {
  await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const resolvedParams = await params;

  const { attemptId } = await startOrResumeAttempt(resolvedParams.testId);
  redirect(`/exam/${attemptId}`);
}
