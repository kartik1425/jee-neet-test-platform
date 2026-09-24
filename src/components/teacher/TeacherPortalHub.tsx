"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  BookOpen,
  Sparkles,
  BarChart3,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Share2,
  Clock,
  Eye,
  Edit,
  UserPlus,
  Upload,
  ArrowRight,
  TrendingUp,
  Layers,
  GraduationCap,
  Activity,
} from "lucide-react";
import { TeacherAnalyticsDashboard } from "@/components/teacher/TeacherAnalyticsDashboard";
import { TestCardShareButton } from "@/components/tests/TestCardShareButton";
import { LatexRenderer } from "@/components/LatexRenderer";
import { TeacherClassItem, ClassAnalyticsBundle } from "@/types/teacherAnalytics";

interface TeacherPortalHubProps {
  initialClasses: TeacherClassItem[];
  initialSelectedClassId?: string;
  initialBundle?: ClassAnalyticsBundle;
  teacherName: string;
  teacherRole: string;
  tests: any[];
  totalTests: number;
  totalStudents: number;
  totalAttempts: number;
  questionCount: number;
  recentQuestions: any[];
}

export function TeacherPortalHub({
  initialClasses,
  initialSelectedClassId,
  initialBundle,
  teacherName,
  teacherRole,
  tests,
  totalTests,
  totalStudents,
  totalAttempts,
  questionCount,
  recentQuestions,
}: TeacherPortalHubProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "tests" | "questions">("analytics");
  const [testSearch, setTestSearch] = useState("");

  const filteredTests = tests.filter((t) =>
    t.title.toLowerCase().includes(testSearch.toLowerCase()) ||
    t.exam_type.toLowerCase().includes(testSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Faculty Master Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {teacherName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create AI-multimodal mock papers, monitor live student submissions & marks rosters, and analyze batch-level topic mastery in real time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/tests/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Test Paper
            </Link>
            <Link
              href="/admin/tests/ai-generate"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Blueprint Generator
            </Link>
            <Link
              href="/admin/questions"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> 5,020+ PYQ Bank
            </Link>
          </div>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tests</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-slate-900">{totalTests}</strong>
          <p className="text-[11px] text-slate-500">Scheduled & published mock papers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Classes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-slate-900">{initialClasses.length}</strong>
          <p className="text-[11px] text-slate-500">{totalStudents} enrolled students</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluations</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-slate-900">{totalAttempts}</strong>
          <p className="text-[11px] text-slate-500">Completed student submissions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PYQ Question Bank</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-slate-900">{questionCount}+</strong>
          <p className="text-[11px] text-slate-500">Authentic JEE & NEET PYQs</p>
        </div>
      </div>

      {/* Main Tabbed Feature View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === "analytics"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Class Analytics & Heatmap
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tests")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === "tests"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" /> Test Papers & Marks ({totalTests})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === "questions"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Question Bank Repository
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/ingestion"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" /> Ingestion Pipeline
            </Link>
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Student Mode
            </Link>
          </div>
        </div>

        {/* Tab 1: Class Analytics Dashboard */}
        {activeTab === "analytics" && (
          <TeacherAnalyticsDashboard
            initialClasses={initialClasses}
            initialSelectedClassId={initialSelectedClassId}
            initialBundle={initialBundle}
            teacherName={teacherName}
            teacherRole={teacherRole}
          />
        )}

        {/* Tab 2: Test Papers & Live Marks Table */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Test Papers & Marks Rosters</h3>
                <p className="text-xs text-slate-500">
                  Manage test papers, copy shareable invite links, and review student attendance & scorecard marks.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Filter test papers..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredTests.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No test papers match your search</p>
                <Link
                  href="/admin/tests/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  <Plus className="w-4 h-4" /> Create Test Paper
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTests.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                            {t.exam_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === "PUBLISHED" || t.status === "LIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "SCHEDULED"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500">
                          Duration: {t.duration_minutes} mins • Questions: {t.question_count || 0} • Assignments: {t.assignment_count || 0} • Submissions: {t.attempt_count || 0}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Instant Share Invite Link */}
                        <TestCardShareButton testId={t.id} testTitle={t.title} />

                        {/* View Marks and Attendance */}
                        <Link
                          href={`/admin/tests/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marks & Attendance
                        </Link>

                        <Link
                          href={`/admin/tests/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Paper
                        </Link>

                        <Link
                          href={`/admin/tests/${t.id}/assign`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Assign
                        </Link>

                        <Link
                          href={`/admin/tests/${t.id}/preview`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Question Bank Repository */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">5,020+ Verified PYQ Question Bank</h3>
                <p className="text-xs text-slate-500">
                  High-yield questions with KaTeX LaTeX formulas across Physics, Chemistry, Mathematics, and Biology.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/questions/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Author Question
                </Link>
                <Link
                  href="/admin/questions"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  <span>Open Full Question Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Questions preview */}
            <div className="space-y-3">
              {recentQuestions.map((q: any) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {q.exam_type}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {q.subject_name || q.subjects?.name || "Subject"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                        {q.chapter_name || q.chapters?.name || "Chapter"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {q.difficulty}
                      </span>
                    </div>

                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Edit Question →
                    </Link>
                  </div>

                  <div className="text-xs text-slate-800 leading-relaxed font-medium">
                    <LatexRenderer content={q.content_latex} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(q.question_options || q.options || []).map((opt: any) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
