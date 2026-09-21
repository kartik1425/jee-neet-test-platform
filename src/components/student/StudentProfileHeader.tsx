import React from "react";
import { StudentDashboardProfile, StudentOverallMetrics } from "@/types/student";
import { Award, BookOpen, CheckCircle2, Clock, Target, TrendingUp, Users } from "lucide-react";

interface StudentProfileHeaderProps {
  profile: StudentDashboardProfile;
  metrics: StudentOverallMetrics;
}

export function StudentProfileHeader({ profile, metrics }: StudentProfileHeaderProps) {
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${getExamBadgeColor(
                  profile.targetExam
                )}`}
              >
                <Target className="w-3.5 h-3.5" />
                Target: {profile.targetExam.replace("_", " ")}
              </span>

              {profile.classes.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10">
                  <Users className="w-3.5 h-3.5" />
                  {profile.classes.map((c) => `${c.className} (${c.grade})`).join(", ")}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile.fullName}!
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Your NTA-standard preparation dashboard. Practice mock tests, track real-time accuracy, and master core topics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-white/5 border border-white/10 rounded-2xl p-3 px-4 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              {profile.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-white">{profile.fullName}</p>
              <p className="text-slate-400">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tests Completed</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {metrics.testsCompletedCount}
          </div>
          <p className="text-xs text-slate-500">Full & sectional papers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {metrics.overallAccuracyPercentage}%
          </div>
          <p className="text-xs text-slate-500">
            {metrics.totalCorrectCount} correct / {metrics.totalQuestionsAttempted} attempted
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Questions Solved</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {metrics.totalQuestionsAttempted}
          </div>
          <p className="text-xs text-slate-500">Across all mock exams</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Exam Time</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {metrics.totalTimeSpentMinutes} <span className="text-sm font-normal text-slate-500">mins</span>
          </div>
          <p className="text-xs text-slate-500">Examination attempt duration</p>
        </div>
      </div>
    </div>
  );
}
