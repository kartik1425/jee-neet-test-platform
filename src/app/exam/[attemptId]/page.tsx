import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getExamAttemptData } from "@/lib/exam/actions";
import { ExamContainer } from "@/components/exam/ExamContainer";

export const dynamic = "force-dynamic";

interface ExamPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

export default async function ExamSessionPage({ params }: ExamPageProps) {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const resolvedParams = await params;

  let examData;
  try {
    examData = await getExamAttemptData(resolvedParams.attemptId);
  } catch (err: any) {
    console.error("Error loading exam attempt:", err);
    notFound();
  }

  // If already submitted, redirect to student portal
  if (examData.status === "SUBMITTED" || examData.status === "AUTO_SUBMITTED") {
    redirect("/student");
  }

  return (
    <ExamContainer
      initialState={examData}
      candidateName={session.profile.full_name}
    />
  );
}
