import React from "react";
import { StudentOverallMetrics } from "@/types/student";
import { Award, CheckCircle2, ChevronRight, Sparkles, TrendingDown, TrendingUp, XCircle } from "lucide-react";

interface SubjectMasteryCardsProps {
  metrics: StudentOverallMetrics;
}

export function SubjectMasteryCards({ metrics }: SubjectMasteryCardsProps) {
  const getSubjectTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("physic")) {
      return {
        bg: "bg-blue-500/10",
        border: "border-blue-200",
        text: "text-blue-700",
        bar: "bg-blue-600",
      };
    }
    if (lower.includes("chem")) {
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-200",
        text: "text-emerald-700",
        bar: "bg-emerald-600",
      };
    }
    if (lower.includes("math")) {
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-200",
        text: "text-purple-700",
        bar: "bg-purple-600",
      };
    }
    if (lower.includes("bio") || lower.includes("botany") || lower.includes("zoology")) {
      return {
        bg: "bg-teal-500/10",
        border: "border-teal-200",
        text: "text-teal-700",
        bar: "bg-teal-600",
      };
    }
    return {
      bg: "bg-slate-500/10",
      border: "border-slate-200",
      text: "text-slate-700",
      bar: "bg-slate-600",
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Subject Mastery & Accuracy Rollup</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate performance computed across all completed mock tests
          </p>
        </div>

        {metrics.subjectBreakdown.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            Complete your first mock test or practice paper to generate subject mastery analytics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.subjectBreakdown.map((sub) => {
              const theme = getSubjectTheme(sub.subjectName);

              return (
                <div
                  key={sub.subjectId}
                  className={`rounded-2xl border p-5 space-y-4 ${theme.border} bg-white shadow-xs`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${theme.bg} ${theme.text}`}>
                      {sub.subjectName}
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {sub.accuracyPercentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Accuracy</span>
                      <span>
                        {sub.totalCorrect} / {sub.totalAttempted} Attempted
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, sub.accuracyPercentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Sub breakdown details */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Correct</span>
                      <span className="text-xs font-black">{sub.totalCorrect}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Wrong</span>
                      <span className="text-xs font-black">{sub.totalIncorrect}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Score</span>
                      <span className="text-xs font-black">{sub.totalScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strong vs Weak Topic Highlights */}
      {(metrics.strongTopics.length > 0 || metrics.weakTopics.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Strong Topic Strengths</h3>
            </div>
            <div className="space-y-2.5">
              {metrics.strongTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{topic.topicName}</p>
                    <p className="text-[10px] text-slate-500">{topic.subjectName} • {topic.totalCount} Qs solved</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Areas to Focus */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <TrendingDown className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Areas Needing Revision</h3>
            </div>
            <div className="space-y-2.5">
              {metrics.weakTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{topic.topicName}</p>
                    <p className="text-[10px] text-slate-500">{topic.subjectName} • {topic.totalCount} Qs attempted</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                    {topic.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
