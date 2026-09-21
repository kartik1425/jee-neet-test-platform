"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TestDetail } from "@/types/tests";
import { Question } from "@/types/database";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  addQuestionToTestAction,
  removeQuestionFromTestAction,
  publishTestAction,
} from "@/lib/tests/actions";
import {
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  Search,
  Check,
  X,
} from "lucide-react";

interface TestEditorFormProps {
  test: TestDetail;
  availableQuestions: Question[];
}

export function TestEditorForm({ test, availableQuestions }: TestEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Question Selector Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankSubject, setBankSubject] = useState("ALL");

  const isEditable = test.status === "DRAFT" || test.status === "PUBLISHED";

  const handleAddQuestion = (questionId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await addQuestionToTestAction(
        test.id,
        questionId,
        null,
        test.marking_scheme.correct,
        test.marking_scheme.incorrect
      );
      if (res.success) {
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to add question.");
      }
    });
  };

  const handleRemoveQuestion = (testQuestionId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeQuestionFromTestAction(test.id, testQuestionId);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to remove question.");
      }
    });
  };

  const handlePublish = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await publishTestAction(test.id);
      if (res.success) {
        setSuccessMsg(`Test paper successfully ${res.status}!`);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to publish test.");
      }
    });
  };

  // Filter available questions (excluding questions already added)
  const existingQuestionIds = new Set(test.questions.map((q) => q.question_id));
  const filteredBankQuestions = availableQuestions.filter((q) => {
    if (existingQuestionIds.has(q.id)) return false;
    if (q.status !== "APPROVED") return false;
    if (bankSubject !== "ALL" && q.subject_id !== bankSubject) return false;
    if (bankSearch.trim() && !q.content_latex.toLowerCase().includes(bankSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
              {test.exam_type}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                test.status === "PUBLISHED" || test.status === "LIVE"
                  ? "bg-emerald-50 text-emerald-700"
                  : test.status === "SCHEDULED"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {test.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{test.title}</h1>
          <p className="text-xs text-slate-500">
            Duration: {test.duration_minutes} mins • Total Marks: {test.total_marks} • Marking: +
            {test.marking_scheme.correct} / {test.marking_scheme.incorrect}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/tests/${test.id}/preview`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Eye className="w-4 h-4" /> Full Preview
          </Link>

          <Link
            href={`/admin/tests/${test.id}/assign`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition"
          >
            Manage Assignments ({test.assignments.length})
          </Link>

          {test.status === "DRAFT" && (
            <button
              type="button"
              disabled={isPending || test.questions.length === 0}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isPending ? "Freezing & Publishing..." : "Publish Test Paper"}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 whitespace-pre-line">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Questions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Paper Questions ({test.questions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Compose questions into this examination paper. Question order in this list is preserved.
            </p>
          </div>

          {isEditable && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" /> Add from Question Bank
            </button>
          )}
        </div>

        {test.questions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No questions added yet</p>
            <p className="text-xs text-slate-500">
              Click &quot;Add from Question Bank&quot; to pick questions for this examination.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {test.questions.map((tq, idx) => (
              <div
                key={tq.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Marks: +{tq.marks} / {tq.negative_marks}
                    </span>
                  </div>

                  {isEditable && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemoveQuestion(tq.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition"
                      title="Remove question from test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-sm text-slate-800 leading-relaxed font-medium">
                  <LatexRenderer content={tq.question.content_latex} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {tq.question.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-lg border ${
                        opt.is_correct
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="font-bold mr-1.5">{opt.option_key}.</span>
                      <LatexRenderer content={opt.content_latex} className="inline" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Questions from Bank */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Questions from Question Bank</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search approved questions..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Question picker list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredBankQuestions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No unassigned approved questions matched your filter.
                </p>
              ) : (
                filteredBankQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition space-y-2 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {q.exam_type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 line-clamp-2">
                        <LatexRenderer content={q.content_latex} />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleAddQuestion(q.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm shrink-0 transition"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
