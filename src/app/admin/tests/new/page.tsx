"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTestDraftAction } from "@/lib/tests/actions";
import { ArrowLeft, Save, AlertCircle, Clock, Award } from "lucide-react";

export default function NewTestDraftPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(
    "1. All questions are Single-Choice MCQs.\n2. Use the Question Palette to navigate between questions.\n3. Test timer is server-authoritative."
  );
  const [examType, setExamType] = useState("JEE_MAIN");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [correctMarks, setCorrectMarks] = useState("4");
  const [incorrectMarks, setIncorrectMarks] = useState("-1");
  const [unattemptedMarks, setUnattemptedMarks] = useState("0");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      title,
      description: description || null,
      instructions: instructions || null,
      examType,
      testMode: "SCHEDULED",
      durationMinutes: parseInt(durationMinutes, 10),
      markingScheme: {
        correct: parseFloat(correctMarks),
        incorrect: parseFloat(incorrectMarks),
        unattempted: parseFloat(unattemptedMarks),
      },
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
    };

    startTransition(async () => {
      const result = await createTestDraftAction(payload);
      if (result.success && result.testId) {
        router.push(`/admin/tests/${result.testId}`);
      } else {
        setErrorMsg(result.error || "Failed to create test draft.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Test List
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Create New Test Draft</h1>
          <p className="text-sm text-slate-500">
            Define exam metadata, duration, instructions, and test-level marking rules.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Title & Exam */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Test Paper Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. JEE Main Full Mock Exam #01 (Physics & Chemistry)"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Target Exam
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="JEE_MAIN">JEE Main</option>
                  <option value="JEE_ADV">JEE Advanced</option>
                  <option value="NEET">NEET UG</option>
                  <option value="GENERIC">General Assessment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    required
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test-Level Marking Scheme */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-600" /> Test-Level Marking Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Configure marks for correct, incorrect, and unattempted responses for this specific paper.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Correct (+ Marks)
                </label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={correctMarks}
                  onChange={(e) => setCorrectMarks(e.target.value)}
                  className="w-full text-sm bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  Incorrect (- Negative)
                </label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={incorrectMarks}
                  onChange={(e) => setIncorrectMarks(e.target.value)}
                  className="w-full text-sm bg-red-50/50 border border-red-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Unattempted
                </label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={unattemptedMarks}
                  onChange={(e) => setUnattemptedMarks(e.target.value)}
                  className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Schedule Window (Optional) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Schedule Examination Window (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">End Time (Deadline)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Examination Instructions
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Creating Draft..." : "Create Draft & Add Questions"}
          </button>
        </form>
      </div>
    </div>
  );
}
