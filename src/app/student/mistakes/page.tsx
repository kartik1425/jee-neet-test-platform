import React from "react";
import { requireRole } from "@/lib/auth/session";
import { getStudentMistakeHistoryAction } from "@/lib/mistakes/actions";
import { MistakesDashboardView } from "@/components/mistakes/MistakesDashboardView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentMistakesPage() {
  const session = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);

  const result = await getStudentMistakeHistoryAction();

  if (!result.success || !result.summary) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 max-w-md">
          <h1 className="text-xl font-black text-slate-900">Failed to Load Mistake Profile</h1>
          <p className="text-xs text-slate-500">{result.error || "Please try again later."}</p>
        </div>
      </div>
    );
  }

  const isTeacherOrAdmin = session.profile.role === "TEACHER" || session.profile.role === "ADMIN";

  return (
    <MistakesDashboardView
      summary={result.summary}
      initialMistakes={result.mistakes || []}
      isTeacherOrAdmin={isTeacherOrAdmin}
    />
  );
}
