import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTestDetailForAdmin, getTestAttendanceAndMarksAction } from "@/lib/tests/actions";
import { getQuestionsList } from "@/lib/questions/actions";
import { TestEditorForm } from "@/components/TestEditorForm";
import { TeacherAttendanceMarksTable } from "@/components/teacher/TeacherAttendanceMarksTable";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface TestEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTestDetailPage({ params }: TestEditorPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await params;

  const [test, questionsRes, attendanceRes] = await Promise.all([
    getTestDetailForAdmin(resolvedParams.id),
    getQuestionsList({ limit: 100, status: "APPROVED" }),
    getTestAttendanceAndMarksAction(resolvedParams.id),
  ]);

  if (!test) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Test Paper Catalog
        </Link>

        {/* Paper Studio Editor */}
        <TestEditorForm test={test} availableQuestions={questionsRes.questions} />

        {/* Attendance, Marks & Submissions Roster */}
        {attendanceRes.success && attendanceRes.test && (
          <TeacherAttendanceMarksTable
            test={attendanceRes.test}
            totalAssigned={attendanceRes.totalAssigned || 0}
            totalSubmitted={attendanceRes.totalSubmitted || 0}
            totalInProgress={attendanceRes.totalInProgress || 0}
            totalAbsent={attendanceRes.totalAbsent || 0}
            submissions={attendanceRes.submissions || []}
            absentStudents={attendanceRes.absentStudents || []}
          />
        )}
      </div>
    </div>
  );
}
