import React from "react";
import Link from "next/link";
import { StudentAttemptHistoryRecord } from "@/types/student";
import { ArrowUpRight, CheckCircle2, ChevronRight, Clock, FileText, History, XCircle, Award, Target } from "lucide-react";

interface AttemptHistoryTableProps {
  recentAttempts: StudentAttemptHistoryRecord[];
}

export function AttemptHistoryTable({ recentAttempts }: AttemptHistoryTableProps) {
  const getExamBadgeColor = (exam: string) => {
    switch (exam) {
      case "JEE_MAIN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "JEE_ADV":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "NEET":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <span>Completed Test Attempts & Scorecards</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full question-by-question review, solution walkthroughs, and topic diagnostic reports
          </p>
        </div>
      </div>

      {recentAttempts.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No test attempts completed yet</p>
          <p>Once you submit a test, your verified deterministic score report will be recorded here.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (Visible on mobile/tablet screens < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getExamBadgeColor(
                        attempt.examType
                      )}`}
                    >
                      {attempt.examType.replace("_", " ")}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {attempt.testTitle}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                      attempt.accuracyPercentage >= 75
                        ? "bg-emerald-100 text-emerald-800"
                        : attempt.accuracyPercentage >= 50
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {attempt.accuracyPercentage}% Acc
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                    <span className="font-black text-slate-900">{attempt.totalScore} / {attempt.maximumScore}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Breakdown</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      +{attempt.correctCount} / -{attempt.incorrectCount}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                    <span className="font-bold text-slate-800 text-[11px]">{formatDuration(attempt.totalTimeSpentSeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>{formatDate(attempt.submittedAt)}</span>
                  <Link
                    href={`/student/results/${attempt.attemptId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs"
                  >
                    <span>View AI Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on screens >= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Test Paper</th>
                  <th className="pb-3">Date Submitted</th>
                  <th className="pb-3">Score Awarded</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Breakdown</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.attemptId} className="hover:bg-slate-50/60 transition group">
                    <td className="py-4 pl-2 font-medium text-slate-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getExamBadgeColor(
                              attempt.examType
                            )}`}
                          >
                            {attempt.examType.replace("_", " ")}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {attempt.testTitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(attempt.submittedAt)}
                    </td>

                    <td className="py-4 whitespace-nowrap">
                      <span className="font-black text-slate-900 text-sm">
                        {attempt.totalScore}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">/ {attempt.maximumScore}</span>
                    </td>

                    <td className="py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                          attempt.accuracyPercentage >= 75
                            ? "bg-emerald-50 text-emerald-700"
                            : attempt.accuracyPercentage >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {attempt.accuracyPercentage}%
                      </span>
                    </td>

                    <td className="py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {attempt.correctCount}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          {attempt.incorrectCount}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 text-slate-500 whitespace-nowrap flex items-center gap-1 mt-3">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDuration(attempt.totalTimeSpentSeconds)}</span>
                    </td>

                    <td className="py-4 pr-2 text-right whitespace-nowrap">
                      <Link
                        href={`/student/results/${attempt.attemptId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition"
                      >
                        <span>Analysis</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

