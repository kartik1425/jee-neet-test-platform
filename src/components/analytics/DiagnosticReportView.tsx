"use client";

import React, { useState, useTransition } from "react";
import {
  FullDiagnosticReportBundle,
  EvidenceStatus,
  MistakeCategory,
} from "@/types/diagnosticReport";
import { retryDiagnosticReportAction } from "@/lib/analytics/reportActions";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Award,
  ChevronRight,
  Filter,
  Flame,
  Zap,
} from "lucide-react";

interface DiagnosticReportViewProps {
  initialReport: FullDiagnosticReportBundle;
}

export function DiagnosticReportView({ initialReport }: DiagnosticReportViewProps) {
  const [reportBundle, setReportBundle] = useState<FullDiagnosticReportBundle>(initialReport);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "SUMMARY" | "SUBJECTS" | "CHAPTERS" | "MISTAKES" | "TIME" | "ACTION_PLAN"
  >("ALL");
  const [mistakeFilter, setMistakeFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [retryError, setRetryError] = useState<string | null>(null);

  const payload = reportBundle.deterministic_payload;
  const ai = reportBundle.ai_report;

  const handleRetry = () => {
    setRetryError(null);
    startTransition(async () => {
      const res = await retryDiagnosticReportAction(reportBundle.attempt_id);
      if (res.success && res.data) {
        setReportBundle(res.data);
      } else {
        setRetryError(res.error || "Failed to generate report. Please try again.");
      }
    });
  };

  const filteredMistakes = payload.incorrect_questions.filter((iq) => {
    if (mistakeFilter === "ALL") return true;
    const diag = ai?.mistake_analysis.find((m) => m.question_id === iq.question_id);
    return diag?.likely_category === mistakeFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header & Section Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider">
                  Six-Section Deep Analysis
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Version {ai?.report_version || "v1.0.0"}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                AI Diagnostic Test Assessment
              </h2>
            </div>
          </div>

          {reportBundle.status === "FAILED" && (
            <button
              onClick={handleRetry}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Analyzing..." : "Retry AI Analysis"}
            </button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
          {[
            { id: "ALL", label: "Full Report" },
            { id: "SUMMARY", label: "1. Executive Summary" },
            { id: "SUBJECTS", label: "2. Subject Performance" },
            { id: "CHAPTERS", label: "3. Chapter Weaknesses" },
            { id: "MISTAKES", label: `4. Mistake Analysis (${payload.total_incorrect})` },
            { id: "TIME", label: "5. Pacing & Stamina" },
            { id: "ACTION_PLAN", label: "6. Improvement Plan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {retryError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {retryError}
        </div>
      )}

      {/* SECTION 1: EXECUTIVE SUMMARY */}
      {(activeTab === "ALL" || activeTab === "SUMMARY") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black tracking-tight">1. Executive Summary</h3>
          </div>

          {ai ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" /> Demonstrated Strengths
                  </div>
                  <p className="text-sm font-medium text-emerald-950 leading-relaxed">
                    {ai.summary.strengths_summary}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" /> Focus Areas
                  </div>
                  <p className="text-sm font-medium text-amber-950 leading-relaxed">
                    {ai.summary.weaknesses_summary}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pedagogical Interpretation
                </span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {ai.summary.overall_interpretation}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                AI executive interpretation unavailable. Showing authoritative deterministic metrics.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: SUBJECT PERFORMANCE */}
      {(activeTab === "ALL" || activeTab === "SUBJECTS") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black tracking-tight">2. Subject Performance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {payload.subject_metrics.map((subj) => {
              const aiSubj = ai?.subject_analysis.find((s) => s.subject_name === subj.subject_name);
              return (
                <div
                  key={subj.subject_id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-slate-900">{subj.subject_name}</h4>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {aiSubj?.relative_standing || `${subj.accuracy}% Acc`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400">Score:</span>{" "}
                        <strong className="text-slate-800">{subj.score} / {subj.max_score}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Accuracy:</span>{" "}
                        <strong className="text-slate-800">{subj.accuracy}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Attempted:</span>{" "}
                        <strong className="text-slate-800">{subj.attempted}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Time:</span>{" "}
                        <strong className="text-slate-800">{Math.round(subj.time_spent_seconds / 60)}m</strong>
                      </div>
                    </div>
                  </div>

                  {aiSubj && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      {aiSubj.commentary}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: CHAPTER WEAKNESSES & EVIDENCE STATUS */}
      {(activeTab === "ALL" || activeTab === "CHAPTERS") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Target className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-black tracking-tight">3. Chapter & Topic Weaknesses</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Deterministic threshold: ≥3 Qs for confirmed diagnosis
            </span>
          </div>

          <div className="space-y-3">
            {payload.chapter_metrics.map((ch) => {
              const aiChap = ai?.chapter_analysis.find((c) => c.chapter_name === ch.chapter_name);

              const badgeColor =
                ch.evidence_status === "STRONG"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : ch.evidence_status === "NEEDS_ATTENTION"
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <div
                  key={ch.chapter_id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 sm:max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{ch.subject_name} •</span>
                      <h4 className="text-sm font-bold text-slate-900">{ch.chapter_name}</h4>
                    </div>
                    {aiChap && (
                      <p className="text-xs text-slate-600 leading-snug">
                        {aiChap.diagnostic_rationale}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right text-xs">
                      <div className="font-bold text-slate-900">
                        {ch.correct}/{ch.attempted} Correct ({ch.accuracy}%)
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {ch.total_questions} tested • avg {ch.avg_time_seconds}s/q
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badgeColor}`}
                    >
                      {ch.evidence_status === "STRONG" && "Strong Mastery"}
                      {ch.evidence_status === "NEEDS_ATTENTION" && "Needs Attention"}
                      {ch.evidence_status === "INSUFFICIENT_DATA" && "Insufficient Data"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: MISTAKE ANALYSIS */}
      {(activeTab === "ALL" || activeTab === "MISTAKES") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5 text-slate-900">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-black tracking-tight">
                4. Mistake Analysis ({payload.incorrect_questions.length} Incorrect)
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 sm:pb-0">
              {["ALL", "CONCEPTUAL", "CALCULATION", "MISREAD", "TIME_PRESSURE"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMistakeFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    mistakeFilter === cat
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredMistakes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-emerald-900">Zero errors in this filter!</p>
              <p className="text-xs text-emerald-700">Great accuracy across these question types.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMistakes.map((iq, idx) => {
                const diag = ai?.mistake_analysis.find((m) => m.question_id === iq.question_id);
                return (
                  <div
                    key={iq.question_id || idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {iq.subject_name} &gt; {iq.chapter_name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                          {iq.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          Time: <strong className="text-slate-800">{iq.time_spent_seconds}s</strong>
                        </span>
                        <span className="text-red-600 font-bold">
                          {iq.marks_awarded} marks
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Selected Option:</span>
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                            Option {iq.selected_option_key || "None"} (Incorrect)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Correct Option:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Option {iq.correct_option_key}
                          </span>
                        </div>
                      </div>

                      {diag && (
                        <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider">
                              AI Diagnosis: {diag.likely_category}
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-600">
                              {diag.confidence} Confidence
                            </span>
                          </div>
                          <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                            {diag.observation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 5: TIME & ATTEMPT STRATEGY */}
      {(activeTab === "ALL" || activeTab === "TIME") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-black tracking-tight">5. Time & Attempt Strategy</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Avg Time / Q</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {payload.time_metrics.avg_time_per_question_seconds}s
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-xs text-emerald-700 font-semibold">Avg on Correct</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-900">
                {payload.time_metrics.avg_time_correct_seconds}s
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1">
              <span className="text-xs text-red-700 font-semibold">Avg on Incorrect</span>
              <p className="text-xl sm:text-2xl font-black text-red-900">
                {payload.time_metrics.avg_time_incorrect_seconds}s
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-xs text-blue-700 font-semibold">Late-Exam Accuracy</span>
              <p className="text-xl sm:text-2xl font-black text-blue-900">
                {payload.time_metrics.late_exam_accuracy !== null
                  ? `${payload.time_metrics.late_exam_accuracy}%`
                  : "N/A"}
              </p>
            </div>
          </div>

          {ai?.time_strategy && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pacing Evaluation
                </span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {ai.time_strategy.pacing_commentary}
                </p>
              </div>

              {ai.time_strategy.stamina_insight && (
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stamina & Fatigue Insight
                  </span>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {ai.time_strategy.stamina_insight}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* SECTION 6: AI IMPROVEMENT PLAN */}
      {(activeTab === "ALL" || activeTab === "ACTION_PLAN") && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
            <Flame className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-black tracking-tight">6. Targeted AI Improvement Plan</h3>
          </div>

          {ai?.action_plan && ai.action_plan.length > 0 ? (
            <div className="space-y-4">
              {ai.action_plan.map((item) => (
                <div
                  key={item.priority}
                  className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/60 to-amber-50/60 border border-orange-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-xs font-black">
                        Priority {item.priority}
                      </span>
                      <h4 className="text-base font-black text-slate-900">{item.topic_name}</h4>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      <strong className="text-slate-900">Diagnosis:</strong> {item.reason}
                    </p>
                    <p className="text-xs text-orange-950 font-semibold leading-relaxed">
                      <strong className="text-orange-900">Action:</strong> {item.recommended_action}
                    </p>
                  </div>

                  <div className="shrink-0 sm:text-right bg-white px-4 py-2.5 rounded-xl border border-orange-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Drill
                    </span>
                    <span className="text-lg font-black text-orange-600">
                      {item.target_practice_questions} Questions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-medium">
                No active improvement items required. Continue maintaining current performance routine.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
