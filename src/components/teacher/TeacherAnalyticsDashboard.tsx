"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  TeacherClassItem,
  ClassAnalyticsBundle,
  QuestionDifficultyAnalysis,
  StudentIndividualClassDetail,
  StudentPerformanceRow,
} from "@/types/teacherAnalytics";
import {
  getTeacherDashboardDataAction,
  getTestQuestionAnalysisAction,
  getStudentClassDetailAction,
  exportClassAnalyticsCsvAction,
} from "@/lib/teacher/actions";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  Users,
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  BookOpen,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Search,
  X,
  GraduationCap,
  Sparkles,
  Info,
  Clock,
  Layers,
  ExternalLink,
} from "lucide-react";

interface TeacherAnalyticsDashboardProps {
  initialClasses: TeacherClassItem[];
  initialSelectedClassId?: string;
  initialBundle?: ClassAnalyticsBundle;
  teacherName: string;
  teacherRole: string;
}

export function TeacherAnalyticsDashboard({
  initialClasses,
  initialSelectedClassId,
  initialBundle,
  teacherName,
  teacherRole,
}: TeacherAnalyticsDashboardProps) {
  const [classes, setClasses] = useState<TeacherClassItem[]>(initialClasses);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(initialSelectedClassId);
  const [bundle, setBundle] = useState<ClassAnalyticsBundle | undefined>(initialBundle);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "topics" | "mistakes">("overview");

  const [isPending, startTransition] = useTransition();
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Question Struggle Modal State
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<{ id: string; title: string } | null>(null);
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionDifficultyAnalysis[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Student Detail Modal State
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentPerformanceRow | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentIndividualClassDetail | null>(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

  // CSV Export State
  const [exportingCsv, setExportingCsv] = useState(false);

  // Class Selection Handler
  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    startTransition(async () => {
      const res = await getTeacherDashboardDataAction(classId);
      if (res.success) {
        if (res.classes) setClasses(res.classes);
        setSelectedClassId(res.selectedClassId);
        setBundle(res.bundle);
      }
    });
  };

  // Inspect Question Struggle Handler
  const handleOpenQuestionAnalysis = async (testId: string, testTitle: string) => {
    if (!selectedClassId) return;
    setSelectedTestForQuestions({ id: testId, title: testTitle });
    setLoadingQuestions(true);
    setQuestionAnalysis(null);

    const res = await getTestQuestionAnalysisAction(testId, selectedClassId);
    if (res.success && res.questions) {
      setQuestionAnalysis(res.questions);
    }
    setLoadingQuestions(false);
  };

  // Inspect Student Detail Handler
  const handleOpenStudentDetail = async (student: StudentPerformanceRow) => {
    if (!selectedClassId) return;
    setSelectedStudentForDetail(student);
    setLoadingStudentDetail(true);
    setStudentDetail(null);

    const res = await getStudentClassDetailAction(student.student_id, selectedClassId);
    if (res.success && res.detail) {
      setStudentDetail(res.detail);
    }
    setLoadingStudentDetail(false);
  };

  // CSV Download Handler
  const handleDownloadCsv = async () => {
    if (!selectedClassId) return;
    setExportingCsv(true);
    try {
      const res = await exportClassAnalyticsCsvAction(selectedClassId);
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.filename || "class_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setExportingCsv(false);
    }
  };

  // Filtered Students
  const filteredStudents = (bundle?.student_rows || []).filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.attention_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card with Class Selector and Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" /> Faculty Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-600">Deterministic Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {bundle ? `${bundle.class_name} (${bundle.grade})` : "Teacher Analytics"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time score distributions, misconception analysis, and longitudinal learning signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {classes.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="class-select" className="text-xs font-semibold text-slate-600">
                Class:
              </label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => handleSelectClass(e.target.value)}
                disabled={isPending}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
          )}

          {bundle && (
            <button
              onClick={handleDownloadCsv}
              disabled={exportingCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingCsv ? "Exporting..." : "Export CSV"}</span>
            </button>
          )}
        </div>
      </div>

      {/* If No Classes Assigned */}
      {classes.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Assigned Classes Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You do not currently have any student batches assigned to your teacher profile. Once classes are
            created and assigned, their aggregate metrics will appear here.
          </p>
        </div>
      )}

      {/* Main Bundle View */}
      {bundle && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Score</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {bundle.performance_metrics.average_score}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Median: {bundle.performance_metrics.median_score} pts
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Accuracy</span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {bundle.performance_metrics.average_accuracy}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Across all completed attempts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participation</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {bundle.performance_metrics.participation_rate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {bundle.total_students} enrolled students
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {bundle.performance_metrics.completion_rate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {bundle.performance_metrics.total_attempts} total attempts
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Range</span>
                <BarChart3 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {bundle.performance_metrics.lowest_score} - {bundle.performance_metrics.highest_score}
              </div>
              <p className="text-xs text-slate-400 mt-1">Min / Max achieved</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 pt-4 flex space-x-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Assigned Tests ({bundle.test_performances.length})
              </button>

              <button
                onClick={() => setActiveTab("students")}
                className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === "students"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Student Roster ({bundle.student_rows.length})
              </button>

              <button
                onClick={() => setActiveTab("topics")}
                className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === "topics"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Topic Mastery ({bundle.topic_mastery.length})
              </button>

              <button
                onClick={() => setActiveTab("mistakes")}
                className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === "mistakes"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Class Mistake Matrix
              </button>
            </div>

            <div className="p-6">
              {/* TAB 1: Assigned Tests & Struggle Breakdown */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Class Tests</h3>
                      <p className="text-xs text-slate-500">
                        View scheduled and completed tests assigned to this batch. Click &ldquo;Inspect Question Struggle&rdquo; to analyze distractor choices.
                      </p>
                    </div>
                  </div>

                  {bundle.test_performances.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No tests have been assigned to this class yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Test Title</th>
                            <th className="py-3 px-4">Exam Type</th>
                            <th className="py-3 px-4 text-center">Participants</th>
                            <th className="py-3 px-4 text-center">Average Score</th>
                            <th className="py-3 px-4 text-center">Median Score</th>
                            <th className="py-3 px-4 text-center">Accuracy %</th>
                            <th className="py-3 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bundle.test_performances.map((tp) => (
                            <tr key={tp.test_id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3.5 px-4 font-semibold text-slate-900">
                                <div>{tp.title}</div>
                                <div className="text-xs text-slate-400 font-normal">
                                  {tp.duration_minutes} mins • Total: {tp.total_marks} marks
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                                  {tp.exam_type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                                {tp.participants_count} / {tp.total_students}
                                <span className="text-xs text-slate-400 ml-1">
                                  ({tp.completion_percentage}%)
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                {tp.average_score}
                              </td>
                              <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                {tp.median_score}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    tp.average_accuracy >= 70
                                      ? "bg-emerald-50 text-emerald-700"
                                      : tp.average_accuracy >= 50
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {tp.average_accuracy}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleOpenQuestionAnalysis(tp.test_id, tp.title)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span>Inspect Questions</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Student Performance Roster */}
              {activeTab === "students" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student name or email..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Status Filter:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="ALL">All Students</option>
                        <option value="NEEDS_REVIEW">Needs Review</option>
                        <option value="IMPROVING">Improving</option>
                        <option value="STABLE">Stable</option>
                        <option value="INSUFFICIENT_DATA">Insufficient Data</option>
                      </select>
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No students match the current filter criteria.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-center">Completed</th>
                            <th className="py-3 px-4 text-center">Avg Score</th>
                            <th className="py-3 px-4 text-center">Avg Accuracy</th>
                            <th className="py-3 px-4 text-center">Trend</th>
                            <th className="py-3 px-4 text-center">Mistakes</th>
                            <th className="py-3 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map((s) => (
                            <tr key={s.student_id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{s.student_name}</div>
                                <div className="text-xs text-slate-400">{s.email}</div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {s.attention_status === "NEEDS_REVIEW" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                                    <AlertTriangle className="w-3 h-3" /> Needs Review
                                  </span>
                                )}
                                {s.attention_status === "IMPROVING" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                    <TrendingUp className="w-3 h-3" /> Improving
                                  </span>
                                )}
                                {s.attention_status === "STABLE" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                    <Minus className="w-3 h-3" /> Stable
                                  </span>
                                )}
                                {s.attention_status === "INSUFFICIENT_DATA" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400">
                                    No Data
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                {s.tests_completed} / {s.total_tests_assigned}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                {s.average_score}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    s.average_accuracy >= 70
                                      ? "bg-emerald-50 text-emerald-700"
                                      : s.average_accuracy >= 50
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {s.average_accuracy}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {s.trend === "IMPROVING" && (
                                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +Gain
                                  </span>
                                )}
                                {s.trend === "WORSENING" && (
                                  <span className="inline-flex items-center text-xs font-semibold text-rose-600">
                                    <TrendingDown className="w-3.5 h-3.5 mr-1" /> -Drop
                                  </span>
                                )}
                                {s.trend === "STABLE" && (
                                  <span className="text-xs text-slate-500 font-medium">Steady</span>
                                )}
                                {s.trend === "INSUFFICIENT_DATA" && (
                                  <span className="text-xs text-slate-400">--</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {s.recurring_mistake_count > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-xs font-bold">
                                    {s.recurring_mistake_count} recurring
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">0</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleOpenStudentDetail(s)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                >
                                  <span>View Detail</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Topic Mastery Breakdown */}
              {activeTab === "topics" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Topic Mastery Breakdown</h3>
                    <p className="text-xs text-slate-500">
                      Evaluated across all completed test questions. Requires at least 3 attempts to flag as &ldquo;Needs Attention&rdquo;.
                    </p>
                  </div>

                  {bundle.topic_mastery.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No topic attempt data recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Chapter & Topic</th>
                            <th className="py-3 px-4 text-center">Questions Tested</th>
                            <th className="py-3 px-4 text-center">Class Accuracy</th>
                            <th className="py-3 px-4 text-center">Evidence Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bundle.topic_mastery.map((tm, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {tm.subject_name}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-900">{tm.chapter_name}</div>
                                {tm.topic_name && (
                                  <div className="text-xs text-slate-500">{tm.topic_name}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-slate-700">
                                {tm.attempted_count} / {tm.total_questions_tested}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-900">
                                {tm.accuracy_percentage}%
                              </td>
                              <td className="py-3 px-4 text-center">
                                {tm.evidence_status === "NEEDS_ATTENTION" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                                    <AlertTriangle className="w-3 h-3" /> Needs Attention
                                  </span>
                                )}
                                {tm.evidence_status === "STRONG" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3" /> Strong
                                  </span>
                                )}
                                {tm.evidence_status === "INSUFFICIENT_DATA" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                    Insufficient Data
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Class Mistake Matrix */}
              {activeTab === "mistakes" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">10-Category Mistake Matrix</h3>
                    <p className="text-xs text-slate-500">
                      Aggregated longitudinal mistake distribution across all students in this class.
                    </p>
                  </div>

                  {bundle.mistake_matrix.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No mistake events recorded for this class yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3">Subject / Chapter</th>
                            <th className="py-3 px-2 text-center">Total</th>
                            <th className="py-3 px-2 text-center">Conceptual</th>
                            <th className="py-3 px-2 text-center">Formula</th>
                            <th className="py-3 px-2 text-center">Calculation</th>
                            <th className="py-3 px-2 text-center">Misread</th>
                            <th className="py-3 px-2 text-center">Assumption</th>
                            <th className="py-3 px-2 text-center">Time Press.</th>
                            <th className="py-3 px-2 text-center">Careless</th>
                            <th className="py-3 px-2 text-center">Guess</th>
                            <th className="py-3 px-2 text-center">Unstarted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {bundle.mistake_matrix.map((mm, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                <div>{mm.subject_name}</div>
                                <div className="text-slate-500 font-normal">{mm.chapter_name}</div>
                              </td>
                              <td className="py-3 px-2 text-center font-bold text-slate-900 bg-slate-50/80">
                                {mm.total_mistakes}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.CONCEPTUAL_ERROR > 0 ? (
                                  <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.CONCEPTUAL_ERROR}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.FORMULA_ERROR > 0 ? (
                                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.FORMULA_ERROR}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.CALCULATION_ERROR > 0 ? (
                                  <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.CALCULATION_ERROR}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.MISREAD_QUESTION > 0 ? (
                                  <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.MISREAD_QUESTION}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.WRONG_ASSUMPTION > 0 ? (
                                  <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.WRONG_ASSUMPTION}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.TIME_PRESSURE > 0 ? (
                                  <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.TIME_PRESSURE}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.CARELESS_ERROR > 0 ? (
                                  <span className="font-bold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.CARELESS_ERROR}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.GUESS > 0 ? (
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.GUESS}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {mm.category_counts.UNABLE_TO_START > 0 ? (
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {mm.category_counts.UNABLE_TO_START}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: Question Struggle & Misconception Analysis */}
      {selectedTestForQuestions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Question Struggle Analysis: {selectedTestForQuestions.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Sorted by hardest (lowest accuracy) first. Inspect distractor choice frequencies.
                </p>
              </div>
              <button
                onClick={() => setSelectedTestForQuestions(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingQuestions ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Aggregating question struggle metrics...</p>
                </div>
              ) : questionAnalysis && questionAnalysis.length > 0 ? (
                questionAnalysis.map((q, idx) => (
                  <div
                    key={q.question_id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                          Q{q.order_index}
                        </span>
                        <span className="text-slate-600">{q.subject_name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{q.chapter_name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          Attempts: <strong>{q.total_attempts}</strong>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            q.accuracy_percentage >= 70
                              ? "bg-emerald-100 text-emerald-800"
                              : q.accuracy_percentage >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          Accuracy: {q.accuracy_percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm font-medium">
                      <LatexRenderer content={q.content_latex} />
                    </div>

                    {/* Option Distribution Bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.option_key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            opt.is_correct
                              ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                              : opt.option_key === q.most_selected_wrong_option_key && opt.selected_count > 0
                              ? "bg-rose-50 border-rose-300 text-rose-950"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 mr-2 truncate">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                                opt.is_correct
                                  ? "bg-emerald-600 text-white"
                                  : opt.option_key === q.most_selected_wrong_option_key && opt.selected_count > 0
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {opt.option_key}
                            </span>
                            <span className="truncate">{opt.content_latex}</span>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="font-bold">{opt.selected_percentage}%</span>
                            <span className="text-slate-400 text-[10px] ml-1">
                              ({opt.selected_count})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {q.most_selected_wrong_option_key && (
                      <p className="text-xs text-rose-600 font-medium">
                        ⚠️ Primary Misconception Trap: Option {q.most_selected_wrong_option_key} was the most chosen distractor.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No question attempts recorded for this test.
                </p>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTestForQuestions(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Student Individual Profile Detail */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Student Profile: {selectedStudentForDetail.student_name}
                </h3>
                <p className="text-xs text-slate-500">{selectedStudentForDetail.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingStudentDetail ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Loading student longitudinal history...</p>
                </div>
              ) : studentDetail ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-500">Avg Score</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">
                        {studentDetail.average_score}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-500">Avg Accuracy</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">
                        {studentDetail.average_accuracy}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-500">Tests Done</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">
                        {studentDetail.total_tests}
                      </div>
                    </div>
                  </div>

                  {/* Recurring Mistake Hotspots */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Recurring Mistake Patterns
                    </h4>
                    {studentDetail.recurring_mistakes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No recurring mistake patterns detected.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {studentDetail.recurring_mistakes.map((rm, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-rose-900">{rm.chapter_name}</span>
                              <span className="text-slate-400 mx-1.5">•</span>
                              <span className="text-rose-700 font-semibold">{rm.mistake_type}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-bold rounded">
                              {rm.occurrences} occurrences
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Attempts History */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Recent Test Attempts
                    </h4>
                    {studentDetail.recent_attempts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No attempts completed yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {studentDetail.recent_attempts.map((att) => (
                          <div
                            key={att.attempt_id}
                            className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{att.test_title}</div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(att.submitted_at).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-bold text-slate-900">
                                  {att.score} / {att.max_score}
                                </span>
                                <span className="ml-1.5 font-semibold text-emerald-600">
                                  ({att.accuracy}%)
                                </span>
                              </div>

                              <Link
                                href={`/student/results/${att.attempt_id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition"
                              >
                                <span>Scorecard</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Failed to load student detail.</p>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
