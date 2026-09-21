"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  StudentMistakeSummary,
  PersistentMistakeRecord,
  MistakeCategory,
  MISTAKE_CATEGORIES,
} from "@/types/mistakes";
import { teacherConfirmOrCorrectMistakeAction } from "@/lib/mistakes/actions";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Tag,
  BookOpen,
  Eye,
  RefreshCw,
} from "lucide-react";

interface MistakesDashboardViewProps {
  summary: StudentMistakeSummary;
  initialMistakes: PersistentMistakeRecord[];
  isTeacherOrAdmin?: boolean;
}

export function MistakesDashboardView({
  summary,
  initialMistakes,
  isTeacherOrAdmin = false,
}: MistakesDashboardViewProps) {
  const [mistakes, setMistakes] = useState<PersistentMistakeRecord[]>(initialMistakes);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedChapter, setSelectedChapter] = useState<string>("ALL");
  const [expandedMistakeId, setExpandedMistakeId] = useState<string | null>(null);
  const [editingMistakeId, setEditingMistakeId] = useState<string | null>(null);
  const [teacherNewCategory, setTeacherNewCategory] = useState<MistakeCategory>("CONCEPTUAL_ERROR");
  const [teacherNotes, setTeacherNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [reviewMessage, setReviewMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  const filteredMistakes = mistakes.filter((m) => {
    if (selectedCategory !== "ALL" && m.mistake_type !== selectedCategory) return false;
    const chapName = (m as any).chapter?.name || (m as any).chapter_name || "";
    if (selectedChapter !== "ALL" && chapName !== selectedChapter) return false;
    return true;
  });

  const uniqueChapters = Array.from(
    new Set(
      mistakes.map((m) => (m as any).chapter?.name || (m as any).chapter_name || "General")
    )
  );

  const handleTeacherReview = (mistakeId: string) => {
    setReviewMessage(null);
    startTransition(async () => {
      const res = await teacherConfirmOrCorrectMistakeAction(
        mistakeId,
        teacherNewCategory,
        teacherNotes
      );
      if (res.success && res.data) {
        setMistakes((prev) =>
          prev.map((item) => (item.id === mistakeId ? { ...item, ...res.data } : item))
        );
        setEditingMistakeId(null);
        setTeacherNotes("");
        setReviewMessage({ text: "Classification confirmed successfully!", isError: false });
      } else {
        setReviewMessage({
          text: res.error || "Failed to confirm classification.",
          isError: true,
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Hub
            </Link>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
                Longitudinal Engine
              </span>
              <span className="text-xs font-mono text-slate-400">Error Taxonomy v1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Persistent Mistake History & Weakness Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Longitudinal tracking of problem-solving deviations across all completed tests.
            </p>
          </div>
        </div>

        {reviewMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
              reviewMessage.isError
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {reviewMessage.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {reviewMessage.text}
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Total Recorded
            </span>
            <p className="text-3xl font-black text-slate-900">{summary.total_mistakes}</p>
            <span className="text-[11px] text-slate-400 font-medium">
              {summary.confirmed_count} Confirmed • {summary.suggested_count} Suggested
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-1 bg-rose-50/20">
            <span className="text-xs text-rose-700 font-bold uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Recurring Patterns
            </span>
            <p className="text-3xl font-black text-rose-900">
              {summary.recurring_patterns_count}
            </p>
            <span className="text-[11px] text-rose-700 font-medium">
              ≥3 occurrences across tests
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Improving Areas
            </span>
            <p className="text-3xl font-black text-emerald-900">
              {summary.improving_patterns_count}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">
              Higher accuracy in recent tests
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/20">
            <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved Patterns
            </span>
            <p className="text-3xl font-black text-blue-900">
              {summary.resolved_patterns_count}
            </p>
            <span className="text-[11px] text-blue-700 font-medium">
              Consistently mastered (≥80%)
            </span>
          </div>
        </div>

        {/* RECURRING PATTERNS SECTION */}
        {summary.recurring_patterns.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-black text-slate-900">
                  Detected Recurring Mistake Patterns
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Evidence-based longitudinal threshold
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.recurring_patterns.map((pat) => {
                const trendBadge =
                  pat.trend === "IMPROVING"
                    ? "bg-emerald-100 text-emerald-800"
                    : pat.trend === "WORSENING"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-700";

                return (
                  <div
                    key={pat.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      pat.is_recurring
                        ? "bg-rose-50/40 border-rose-200"
                        : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {pat.subject_name}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {pat.chapter_name}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${trendBadge}`}>
                          {pat.trend}
                        </span>
                      </div>

                      <div className="inline-block px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-800 font-bold">
                        {pat.mistake_type.replace(/_/g, " ")}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        <strong className="text-slate-800">{pat.total_occurrences}</strong> times in{" "}
                        <strong className="text-slate-800">{pat.tests_affected_count}</strong> tests
                      </span>
                      <span className="text-[11px] font-medium">
                        {new Date(pat.last_occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOPIC + ERROR TAXONOMY MATRIX */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">
                Topic + Error Taxonomy Matrix
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Categorized frequency matrix
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject & Chapter</th>
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-3 text-center">Conceptual</th>
                  <th className="py-3 px-3 text-center">Calculation</th>
                  <th className="py-3 px-3 text-center">Misread</th>
                  <th className="py-3 px-3 text-center">Time</th>
                  <th className="py-3 px-3 text-center">Careless</th>
                  <th className="py-3 px-3 text-center">Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summary.matrix.map((row) => {
                  const otherCount =
                    (row.category_counts.FORMULA_ERROR || 0) +
                    (row.category_counts.WRONG_ASSUMPTION || 0) +
                    (row.category_counts.GUESS || 0) +
                    (row.category_counts.UNABLE_TO_START || 0) +
                    (row.category_counts.UNKNOWN || 0);

                  return (
                    <tr key={`${row.subject_id}-${row.chapter_id}`} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.chapter_name}</div>
                        <div className="text-[11px] text-slate-400">{row.subject_name}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-900">
                        {row.total_mistakes}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.category_counts.CONCEPTUAL_ERROR > 0
                              ? "bg-rose-100 text-rose-800"
                              : "text-slate-300"
                          }`}
                        >
                          {row.category_counts.CONCEPTUAL_ERROR || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.category_counts.CALCULATION_ERROR > 0
                              ? "bg-amber-100 text-amber-800"
                              : "text-slate-300"
                          }`}
                        >
                          {row.category_counts.CALCULATION_ERROR || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.category_counts.MISREAD_QUESTION > 0
                              ? "bg-blue-100 text-blue-800"
                              : "text-slate-300"
                          }`}
                        >
                          {row.category_counts.MISREAD_QUESTION || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.category_counts.TIME_PRESSURE > 0
                              ? "bg-purple-100 text-purple-800"
                              : "text-slate-300"
                          }`}
                        >
                          {row.category_counts.TIME_PRESSURE || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.category_counts.CARELESS_ERROR > 0
                              ? "bg-orange-100 text-orange-800"
                              : "text-slate-300"
                          }`}
                        >
                          {row.category_counts.CARELESS_ERROR || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {otherCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED MISTAKES LOG & DRILL-DOWN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-black text-slate-900">
                Detailed Mistakes Log ({filteredMistakes.length})
              </h2>
            </div>

            {/* Category & Chapter Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Error Categories</option>
                {MISTAKE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Chapters</option>
                {uniqueChapters.map((chap) => (
                  <option key={chap} value={chap}>
                    {chap}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredMistakes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                No mistakes found matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMistakes.map((m) => {
                const isExpanded = expandedMistakeId === m.id;
                const q = (m as any).question;
                const test = (m as any).test;
                const ev = m.evidence || ({} as any);

                return (
                  <div
                    key={m.id}
                    className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {(m as any).chapter?.name || "Chapter"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {(m as any).subject?.name || "Subject"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                            {q?.difficulty || "MEDIUM"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-rose-700 font-mono">
                            {m.mistake_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Source: {m.classification_source} ({m.classification_status})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {ev.time_spent_seconds || 0}s
                        </span>

                        <button
                          onClick={() => setExpandedMistakeId(isExpanded ? null : m.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                        >
                          {isExpanded ? "Hide Review" : "Review Question"}
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isTeacherOrAdmin && (
                          <button
                            onClick={() =>
                              setEditingMistakeId(editingMistakeId === m.id ? null : m.id)
                            }
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            Teacher Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teacher Edit Form */}
                    {editingMistakeId === m.id && isTeacherOrAdmin && (
                      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3 text-xs">
                        <span className="font-bold text-indigo-900 block">
                          Teacher Confirmation & Override
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Confirm / Change Category:
                            </label>
                            <select
                              value={teacherNewCategory}
                              onChange={(e) => setTeacherNewCategory(e.target.value as any)}
                              className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-semibold"
                            >
                              {MISTAKE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Teacher Rationale Notes:
                            </label>
                            <input
                              type="text"
                              value={teacherNotes}
                              onChange={(e) => setTeacherNotes(e.target.value)}
                              placeholder="e.g. Fundamental torque direction fallacy"
                              className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingMistakeId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleTeacherReview(m.id)}
                            disabled={isPending}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50"
                          >
                            {isPending ? "Saving..." : "Confirm & Save"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable Review View */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-5 rounded-xl">
                        {q?.content_latex && (
                          <div className="text-sm font-medium text-slate-900 leading-relaxed">
                            <LatexRenderer content={q.content_latex} />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-0.5">
                            <span className="text-red-700 font-semibold block">Selected:</span>
                            <strong className="text-red-900">
                              {ev.selected_option_key
                                ? `Option ${ev.selected_option_key} (Incorrect)`
                                : "Unattempted"}
                            </strong>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                            <span className="text-emerald-700 font-semibold block">
                              Correct Answer:
                            </span>
                            <strong className="text-emerald-900">
                              Option {ev.correct_option_key || "A"}
                            </strong>
                          </div>
                        </div>

                        {ev.rationale && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <span className="font-bold text-slate-700 block">
                              Classification Rationale:
                            </span>
                            <p className="text-slate-600 leading-relaxed">{ev.rationale}</p>
                          </div>
                        )}

                        {ev.audit_history && ev.audit_history.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                            <span className="font-bold text-slate-500 uppercase tracking-wider block">
                              Audit History
                            </span>
                            <div className="space-y-1">
                              {ev.audit_history.map((ah: any, ahIdx: number) => (
                                <div
                                  key={ahIdx}
                                  className="text-slate-600 flex items-center justify-between"
                                >
                                  <span>
                                    {ah.source}: {ah.previous_type} &rarr;{" "}
                                    <strong>{ah.new_type}</strong> ({ah.notes})
                                  </span>
                                  <span className="font-mono text-slate-400">
                                    {new Date(ah.changed_at).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
