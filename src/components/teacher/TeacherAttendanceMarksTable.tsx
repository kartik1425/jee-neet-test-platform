"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Search,
  ExternalLink,
  Award,
  Filter,
  BarChart3,
  Calendar,
} from "lucide-react";

interface TeacherAttendanceMarksTableProps {
  test: {
    id: string;
    title: string;
    duration_minutes: number;
    total_marks: number;
    exam_type: string;
  };
  totalAssigned: number;
  totalSubmitted: number;
  totalInProgress: number;
  totalAbsent: number;
  submissions: Array<{
    attemptId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    status: string;
    startedAt: string;
    submittedAt?: string | null;
    totalScore: number;
    maximumScore: number;
    accuracyPercentage: number;
    attemptedCount: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    timeSpentMinutes: number;
  }>;
  absentStudents: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    className?: string;
    status: string;
  }>;
}

export function TeacherAttendanceMarksTable({
  test,
  totalAssigned,
  totalSubmitted,
  totalInProgress,
  totalAbsent,
  submissions,
  absentStudents,
}: TeacherAttendanceMarksTableProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "SUBMITTED" | "ABSENT" | "IN_PROGRESS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Merge list for full roster
  const allRows = useMemo(() => {
    const presentRows = submissions.map((s) => ({
      type: "PRESENT" as const,
      id: s.attemptId,
      attemptId: s.attemptId,
      studentId: s.studentId,
      studentName: s.studentName,
      studentEmail: s.studentEmail,
      status: s.status,
      totalScore: s.totalScore,
      maximumScore: s.maximumScore,
      accuracyPercentage: s.accuracyPercentage,
      correctCount: s.correctCount,
      incorrectCount: s.incorrectCount,
      unattemptedCount: s.unattemptedCount,
      timeSpentMinutes: s.timeSpentMinutes,
      submittedAt: s.submittedAt,
    }));

    const absentRows = absentStudents.map((a) => ({
      type: "ABSENT" as const,
      id: `absent-${a.studentId}`,
      attemptId: null,
      studentId: a.studentId,
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      status: "ABSENT",
      totalScore: 0,
      maximumScore: test.total_marks,
      accuracyPercentage: 0,
      correctCount: 0,
      incorrectCount: 0,
      unattemptedCount: 0,
      timeSpentMinutes: 0,
      submittedAt: null,
    }));

    return [...presentRows, ...absentRows];
  }, [submissions, absentStudents, test.total_marks]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (activeTab === "SUBMITTED" && (r.status !== "SUBMITTED" && r.status !== "AUTO_SUBMITTED")) return false;
      if (activeTab === "ABSENT" && r.status !== "ABSENT") return false;
      if (activeTab === "IN_PROGRESS" && r.status !== "IN_PROGRESS") return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = r.studentName.toLowerCase().includes(query);
        const matchEmail = r.studentEmail.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [allRows, activeTab, searchQuery]);

  const exportCSV = () => {
    const headers = [
      "Student Name",
      "Student Email",
      "Status",
      "Marks Scored",
      "Max Marks",
      "Accuracy %",
      "Correct",
      "Incorrect",
      "Time Spent (mins)",
      "Submitted At",
    ];

    const rows = filteredRows.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      r.status,
      r.totalScore,
      r.maximumScore,
      `${r.accuracyPercentage}%`,
      r.correctCount,
      r.incorrectCount,
      r.timeSpentMinutes,
      r.submittedAt ? `"${new Date(r.submittedAt).toLocaleString()}"` : "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${test.title.replace(/[^a-z0-9]/gi, "_")}_Marks_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header & Quick Metric Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Student Attendance & Marks Roster</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time marks tracking, submission timestamps, and absentee list for this paper
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Assigned
          </span>
          <p className="text-2xl font-black text-slate-900">{totalAssigned || allRows.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Submitted / Present
          </span>
          <p className="text-2xl font-black text-emerald-900">{totalSubmitted}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            In-Progress
          </span>
          <p className="text-2xl font-black text-amber-900">{totalInProgress}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Absent / Not Attempted
          </span>
          <p className="text-2xl font-black text-rose-900">{totalAbsent}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto">
          {[
            { id: "ALL", label: "All Students", count: allRows.length },
            { id: "SUBMITTED", label: "Submitted", count: totalSubmitted },
            { id: "ABSENT", label: "Absent", count: totalAbsent },
            { id: "IN_PROGRESS", label: "In-Progress", count: totalInProgress },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? "bg-slate-100 text-slate-700" : "bg-slate-200/60 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Roster Table */}
      {filteredRows.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">No student records found in this view.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Accuracy</th>
                <th className="p-3.5">Time Spent</th>
                <th className="p-3.5">Submitted At</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const isSubmitted = row.status === "SUBMITTED" || row.status === "AUTO_SUBMITTED";
                const isAbsent = row.status === "ABSENT";
                const isInProgress = row.status === "IN_PROGRESS";

                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{row.studentName}</div>
                      <div className="text-[11px] text-slate-500">{row.studentEmail}</div>
                    </td>

                    <td className="p-3.5">
                      {isSubmitted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      )}
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 animate-spin" /> In-Progress
                        </span>
                      )}
                      {isAbsent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Absent
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {isSubmitted ? (
                        <div className="font-black text-slate-900 text-sm">
                          {row.totalScore} <span className="text-slate-400 text-xs font-normal">/ {row.maximumScore}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {isSubmitted ? (
                        <div className="space-y-0.5">
                          <span
                            className={`font-bold ${
                              row.accuracyPercentage >= 60
                                ? "text-emerald-700"
                                : row.accuracyPercentage >= 40
                                ? "text-amber-700"
                                : "text-rose-700"
                            }`}
                          >
                            {row.accuracyPercentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            +{row.correctCount} / -{row.incorrectCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    <td className="p-3.5 font-medium text-slate-700">
                      {isSubmitted ? `${row.timeSpentMinutes} mins` : "-"}
                    </td>

                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })
                        : isAbsent
                        ? "Did not attempt"
                        : "Ongoing"}
                    </td>

                    <td className="p-3.5 text-right">
                      {isSubmitted ? (
                        <Link
                          href={`/student/results/${row.attemptId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                          target="_blank"
                        >
                          <span>View Scorecard</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No attempt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
