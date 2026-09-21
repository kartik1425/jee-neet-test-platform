import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getTestDetailForAdmin } from "@/lib/tests/actions";
import { LatexRenderer } from "@/components/LatexRenderer";
import { ArrowLeft, BookOpen, Clock, Award, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTestPreviewPage({ params }: PreviewPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await params;
  const test = await getTestDetailForAdmin(resolvedParams.id);

  if (!test) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/tests/${test.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Test Editor
          </Link>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            Paper Preview Mode
          </span>
        </div>

        {/* Paper Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
            {test.exam_type} Mock Examination
          </span>
          <h1 className="text-2xl font-black text-slate-900">{test.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" /> Duration: <strong>{test.duration_minutes} mins</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-slate-400" /> Questions: <strong>{test.questions.length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-slate-400" /> Total Marks: <strong>{test.total_marks}</strong>
            </span>
            <span>•</span>
            <span>Marking: <strong>+{test.marking_scheme.correct} / {test.marking_scheme.incorrect}</strong></span>
          </div>

          {test.instructions && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
              <span className="font-bold text-slate-800 block">Instructions:</span>
              <p className="whitespace-pre-line">{test.instructions}</p>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {test.questions.map((tq, idx) => (
            <div
              key={tq.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  Question {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  +{tq.marks} / {tq.negative_marks}
                </span>
              </div>

              <div className="text-base font-medium text-slate-900 leading-relaxed">
                <LatexRenderer content={tq.question.content_latex} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tq.question.options?.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
                      opt.is_correct
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        opt.is_correct ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      {opt.option_key}
                    </span>
                    <div className="flex-1 overflow-x-auto">
                      <LatexRenderer content={opt.content_latex} />
                    </div>
                    {opt.is_correct && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
