import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getQuestionsList, archiveQuestionAction, restoreQuestionAction } from "@/lib/questions/actions";
import { getTaxonomyTree } from "@/lib/questions/taxonomy";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  Edit,
  Archive,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface QuestionBankPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    examType?: string;
    subjectId?: string;
    difficulty?: string;
    status?: string;
  }>;
}

export default async function AdminQuestionBankPage({ searchParams }: QuestionBankPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const examType = resolvedParams.examType || "ALL";
  const subjectId = resolvedParams.subjectId || "ALL";
  const difficulty = resolvedParams.difficulty || "ALL";
  const status = resolvedParams.status || "ALL";

  const [taxonomyData, questionsData] = await Promise.all([
    getTaxonomyTree(),
    getQuestionsList({
      page,
      limit: 10,
      search,
      examType,
      subjectId,
      difficulty,
      status,
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Master Question Bank</h1>
            <p className="text-xs text-slate-400">JEE & NEET Verified Item Repository (V1 MCQ)</p>
          </div>
        </div>

        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Add New Question
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Filters & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search question text or equations..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Exam Filter */}
            <div>
              <select
                name="examType"
                defaultValue={examType}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white"
              >
                <option value="ALL">All Exams</option>
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADV">JEE Advanced</option>
                <option value="NEET">NEET UG</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <select
                name="subjectId"
                defaultValue={subjectId}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white"
              >
                <option value="ALL">All Subjects</option>
                {taxonomyData.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div className="flex gap-2">
              <select
                name="difficulty"
                defaultValue={difficulty}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus:bg-white"
              >
                <option value="ALL">All Levels</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="ADVANCED">Advanced</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Question Counter Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Found <strong>{questionsData.total}</strong> questions • Page {questionsData.page} of{" "}
            {questionsData.totalPages || 1}
          </span>
        </div>

        {/* Questions List */}
        {questionsData.questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No questions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No questions matched the current filter parameters. Try adjusting your search or add a new question.
            </p>
            <Link
              href="/admin/questions/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Item
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questionsData.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                      {q.exam_type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {q.subject_name || "Physics"} • {q.chapter_name || "General"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        q.difficulty === "HARD" || q.difficulty === "ADVANCED"
                          ? "bg-red-50 text-red-700"
                          : q.difficulty === "MEDIUM"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    {q.source_type === "PYQ" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                        PYQ {q.pyq_year} {q.pyq_shift}
                      </span>
                    )}
                    {q.status === "ARCHIVED" && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        ARCHIVED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>

                    {q.status === "ARCHIVED" ? (
                      <form
                        action={async () => {
                          "use server";
                          await restoreQuestionAction(q.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await archiveQuestionAction(q.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Question Statement with KaTeX */}
                <div className="text-sm font-medium text-slate-900 leading-relaxed">
                  <span className="text-slate-400 font-mono mr-2">Q{(page - 1) * 10 + idx + 1}.</span>
                  <LatexRenderer content={q.content_latex} />
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                        opt.is_correct
                          ? "bg-emerald-50 border-emerald-300 font-semibold text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold shrink-0 ${
                          opt.is_correct ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {opt.option_key}
                      </span>
                      <div className="overflow-x-auto flex-1">
                        <LatexRenderer content={opt.content_latex} />
                      </div>
                      {opt.is_correct && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Solution Preview */}
                {q.explanation_latex && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-0.5">Solution:</span>
                    <LatexRenderer content={q.explanation_latex} />
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            {questionsData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {Array.from({ length: questionsData.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/admin/questions?page=${p}&search=${encodeURIComponent(
                      search
                    )}&examType=${examType}&subjectId=${subjectId}&difficulty=${difficulty}&status=${status}`}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      p === page ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
