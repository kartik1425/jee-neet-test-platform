import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAttemptResult } from "@/lib/scoring/engine";
import { getOrGenerateDiagnosticReportAction } from "@/lib/analytics/reportActions";
import { DiagnosticReportView } from "@/components/analytics/DiagnosticReportView";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  BookOpen,
  ArrowLeft,
  MinusCircle,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ResultPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

export default async function StudentResultPage({ params }: ResultPageProps) {
  await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
  const resolvedParams = await params;

  let report;
  try {
    report = await getAttemptResult(resolvedParams.attemptId);
  } catch (err: any) {
    console.error("Error retrieving score report:", err);
    notFound();
  }

  // Fetch or generate 6-section AI diagnostic report bundle
  const diagnosticResult = await getOrGenerateDiagnosticReportAction(resolvedParams.attemptId);

  const hours = Math.floor(report.totalTimeSpentSeconds / 3600);
  const minutes = Math.floor((report.totalTimeSpentSeconds % 3600) / 60);
  const seconds = report.totalTimeSpentSeconds % 60;
  const timeFormatted = `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Portal
          </Link>
          <span className="text-xs font-mono text-slate-400">
            Scoring Engine: {report.scoringVersion} (Deterministic)
          </span>
        </div>

        {/* Hero Score Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" /> Examination Result
              </div>
              <h1 className="text-2xl font-black text-slate-900">Score Performance Summary</h1>
              <p className="text-xs text-slate-500">
                Authoritative score calculated on {new Date(report.calculatedAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right flex items-baseline gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
              <span className="text-4xl font-black text-blue-600">{report.totalScore}</span>
              <span className="text-lg font-bold text-slate-400">/ {report.maximumScore}</span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" /> Correct
              </div>
              <p className="text-2xl font-extrabold text-emerald-900">{report.correctCount}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Questions</p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-1">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold uppercase">
                <XCircle className="w-4 h-4" /> Incorrect
              </div>
              <p className="text-2xl font-extrabold text-red-900">{report.incorrectCount}</p>
              <p className="text-[11px] text-red-700 font-medium">Questions</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold uppercase">
                <MinusCircle className="w-4 h-4" /> Unattempted
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{report.unattemptedCount}</p>
              <p className="text-[11px] text-slate-500 font-medium">Questions</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-700 text-xs font-bold uppercase">
                <BarChart3 className="w-4 h-4" /> Accuracy
              </div>
              <p className="text-2xl font-extrabold text-purple-900">{report.accuracyPercentage}%</p>
              <p className="text-[11px] text-purple-700 font-medium">
                {report.attemptedCount} Attempted
              </p>
            </div>
          </div>
        </div>

        {/* Subject-Wise Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2>Subject-Wise Performance Breakdown</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Questions</th>
                  <th className="py-3 px-4 text-center">Attempted</th>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-center">Incorrect</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.subjectBreakdown.map((subj) => (
                  <tr key={subj.subjectId} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{subj.subjectName}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600">{subj.totalQuestions}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600">{subj.attempted}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{subj.correct}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">{subj.incorrect}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-blue-600">
                      {subj.score} / {subj.maxScore}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                        {subj.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Six-Section AI Diagnostic Analysis */}
        {diagnosticResult.success && diagnosticResult.data && (
          <DiagnosticReportView initialReport={diagnosticResult.data} />
        )}

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Detailed Question Review & Verified Solutions
          </h2>

          <div className="space-y-4">
            {report.questionResults.map((q, idx) => (
              <div
                key={q.questionId}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {q.subjectName} • {q.chapterName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {q.isCorrect === true && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marksAwarded})
                      </span>
                    )}
                    {q.isCorrect === false && (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold border border-red-200 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect ({q.marksAwarded})
                      </span>
                    )}
                    {q.isCorrect === null && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center gap-1">
                        <MinusCircle className="w-3.5 h-3.5" /> Unattempted (0)
                      </span>
                    )}
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {q.timeSpentSeconds}s
                    </span>
                  </div>
                </div>

                {/* Question LaTeX */}
                <div className="text-sm font-medium text-slate-900 leading-relaxed">
                  <LatexRenderer content={q.contentLatex || ""} />
                </div>

                {/* Key Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Your Choice:</span>
                    <strong className="text-slate-800">
                      {q.selectedOptionKey ? `Option ${q.selectedOptionKey}` : "None (Unattempted)"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Correct Answer Key:</span>
                    <strong className="text-emerald-700 font-bold">
                      Option {q.correctOptionKey}
                    </strong>
                  </div>
                </div>

                {/* Solution Explanation */}
                {q.explanationLatex && (
                  <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 text-xs space-y-1">
                    <span className="font-bold text-blue-900 block">Solution & Explanation:</span>
                    <LatexRenderer content={q.explanationLatex} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
