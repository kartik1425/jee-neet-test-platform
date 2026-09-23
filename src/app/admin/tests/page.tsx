import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminTestsList, archiveTestAction, publishTestAction } from "@/lib/tests/actions";
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Edit,
  Eye,
  UserPlus,
  Archive,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { TestCardShareButton } from "@/components/tests/TestCardShareButton";

export const dynamic = "force-dynamic";

interface TestsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    examType?: string;
    status?: string;
  }>;
}

export default async function AdminTestsPage({ searchParams }: TestsPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const examType = resolvedParams.examType || "ALL";
  const status = resolvedParams.status || "ALL";

  const { tests, total, totalPages } = await getAdminTestsList({
    page,
    limit: 10,
    search,
    examType,
    status,
  });

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
            <h1 className="text-base font-bold text-white leading-tight">Test Paper Management</h1>
            <p className="text-xs text-slate-400">Create, Blueprint, Schedule & Assign Mock Examinations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/tests/ai-generate"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Generate with AI
          </Link>
          <Link
            href="/admin/tests/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" /> Create Test Paper
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search test title..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                name="examType"
                defaultValue={examType}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white"
              >
                <option value="ALL">All Exam Types</option>
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADV">JEE Advanced</option>
                <option value="NEET">NEET UG</option>
              </select>
            </div>

            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={status}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
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

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Found <strong>{total}</strong> tests • Page {page} of {totalPages || 1}
          </span>
        </div>

        {/* Test List Table / Cards */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No test papers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by creating your first mock examination paper.
            </p>
            <Link
              href="/admin/tests/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Create Test Paper
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((t: any) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                        {t.exam_type}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{t.title}</h2>
                      {t.status === "LIVE" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                      {t.status === "SCHEDULED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                          SCHEDULED
                        </span>
                      )}
                      {t.status === "PUBLISHED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                          PUBLISHED
                        </span>
                      )}
                      {t.status === "DRAFT" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                          DRAFT
                        </span>
                      )}
                      {t.status === "COMPLETED" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Share Invite Link */}
                    <TestCardShareButton testId={t.id} testTitle={t.title} />

                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                      title="View Student Attendance and Marks"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marks & Attendance
                    </Link>

                    <Link
                      href={`/admin/tests/${t.id}/preview`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </Link>

                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>

                    <Link
                      href={`/admin/tests/${t.id}/assign`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Assign
                    </Link>

                    {t.status === "DRAFT" && (
                      <form
                        action={async () => {
                          "use server";
                          await publishTestAction(t.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                        </button>
                      </form>
                    )}

                    {t.status !== "ARCHIVED" && (
                      <form
                        action={async () => {
                          "use server";
                          await archiveTestAction(t.id);
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

                {/* Metrics bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Duration: <strong>{t.duration_minutes} mins</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Questions: <strong>{t.question_count}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <span>Assignments: <strong>{t.assignment_count}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Attempts: <strong>{t.attempt_count}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
