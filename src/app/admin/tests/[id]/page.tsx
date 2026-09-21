import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTestDetailForAdmin } from "@/lib/tests/actions";
import { getQuestionsList } from "@/lib/questions/actions";
import { TestEditorForm } from "@/components/TestEditorForm";
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

  const [test, questionsRes] = await Promise.all([
    getTestDetailForAdmin(resolvedParams.id),
    getQuestionsList({ limit: 100, status: "APPROVED" }),
  ]);

  if (!test) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Test Paper Catalog
        </Link>

        <TestEditorForm test={test} availableQuestions={questionsRes.questions} />
      </div>
    </div>
  );
}
