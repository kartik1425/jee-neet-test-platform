"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StudentTestSummary } from "@/types/student";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

interface StudentTestBrowserProps {
  assignedTests: StudentTestSummary[];
  practiceTests: StudentTestSummary[];
}

export function StudentTestBrowser({ assignedTests, practiceTests }: StudentTestBrowserProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "ASSIGNED" | "PRACTICE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState<string>("ALL");

  // Merge and deduplicate tests list
  const allTests = useMemo(() => {
    const map = new Map<string, StudentTestSummary>();
    assignedTests.forEach((t) => map.set(t.id, t));
    practiceTests.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [assignedTests, practiceTests]);

  // Filter based on tab, examType, and search query
  const filteredTests = useMemo(() => {
    return allTests.filter((test) => {
      // Tab filter
      if (activeTab === "ASSIGNED" && test.assignmentSource === "SELF_PRACTICE") return false;
      if (activeTab === "PRACTICE" && test.testMode !== "PRACTICE_SELF") return false;
      if (activeTab === "COMPLETED" && !test.latestAttempt) return false;

      // Exam type filter
      if (examFilter !== "ALL" && test.examType !== examFilter) return false;

      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = test.title.toLowerCase().includes(query);
        const matchesDesc = test.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [allTests, activeTab, examFilter, searchQuery]);

  const getExamBadge = (exam: string) => {
    switch (exam) {
      case "JEE_MAIN":
        return { label: "JEE Main", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "JEE_ADV":
        return { label: "JEE Advanced", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "NEET":
        return { label: "NEET UG", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default:
        return { label: "Standard", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Examination & Practice Papers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official scheduled school papers and personal custom practice tests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/practice/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm shadow-purple-500/20 transition whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Practice Test</span>
          </Link>

          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search test papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl self-start overflow-x-auto max-w-full">
          {[
            { id: "ALL", label: "All Tests", count: allTests.length },
            { id: "ASSIGNED", label: "Assigned / School", count: assignedTests.length },
            { id: "PRACTICE", label: "My Practice Tests", count: practiceTests.length },
            {
              id: "COMPLETED",
              label: "Completed",
              count: allTests.filter((t) => t.latestAttempt).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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

        {/* Exam Type Filter Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Exam:</span>
          {["ALL", "JEE_MAIN", "JEE_ADV", "NEET"].map((exam) => (
            <button
              key={exam}
              onClick={() => setExamFilter(exam)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                examFilter === exam
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {exam === "ALL" ? "All" : exam.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">No test papers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No tests match "${searchQuery}". Try a different search term.`
                : "No tests are available in this category at the moment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => {
            const badge = getExamBadge(test.examType);
            const isAssigned = test.assignmentSource !== "SELF_PRACTICE";

            return (
              <div
                key={test.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition hover:shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>

                      {isAssigned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {test.assignmentSource === "CLASS" ? "Class Test" : "Assigned"}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700">{test.totalMarks} Marks</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{test.description}</p>
                    )}
                  </div>

                  {/* Specs Pill Matrix */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {test.durationMinutes} mins
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 font-medium">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      {test.questionCount} Questions
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 font-medium">
                      +{test.markingScheme?.correct ?? 4} / {test.markingScheme?.incorrect ?? -1}
                    </span>
                  </div>

                  {/* Schedule / Due Date */}
                  {(test.startTime || test.dueAt) && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {test.startTime && (
                        <span>Starts: {formatDate(test.startTime)}</span>
                      )}
                      {test.dueAt && <span>Due by: {formatDate(test.dueAt)}</span>}
                    </div>
                  )}

                  {/* Previous Result Summary if completed */}
                  {test.latestAttempt && (
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                          Latest Attempt
                        </span>
                        <div className="font-semibold text-purple-950">
                          Score: {test.latestAttempt.totalScore} / {test.latestAttempt.maximumScore} ({test.latestAttempt.accuracyPercentage}% Acc)
                        </div>
                      </div>
                      <Link
                        href={`/student/results/${test.latestAttempt.attemptId}`}
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold hover:underline"
                      >
                        <span>Report</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {test.actionState === "RESUME" && test.activeAttempt ? (
                    <Link
                      href={`/exam/${test.activeAttempt.attemptId}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Resume Active Attempt</span>
                    </Link>
                  ) : test.actionState === "START" ? (
                    <Link
                      href={`/exam/start/${test.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Examination</span>
                    </Link>
                  ) : test.actionState === "COMPLETED" ? (
                    <div className="w-full flex items-center gap-2">
                      <Link
                        href={`/student/results/${test.latestAttempt?.attemptId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>View Analysis</span>
                      </Link>
                      <Link
                        href={`/exam/start/${test.id}`}
                        title="Re-attempt for practice"
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </Link>
                    </div>
                  ) : test.actionState === "UPCOMING" ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                    >
                      Upcoming Scheduled Paper
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                    >
                      Submission Window Closed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
