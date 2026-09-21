"use client";

import React from "react";
import { StudentExamQuestion, getQuestionPaletteStatus, PaletteStatus } from "@/types/exam";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  isSubmitting: boolean;
  questions: StudentExamQuestion[];
  answers: Record<
    string,
    {
      selectedOptionId: string | null;
      isMarkedForReview: boolean;
      isVisited: boolean;
    }
  >;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  isSubmitting,
  questions,
  answers,
}: SubmitConfirmModalProps) {
  if (!isOpen) return null;

  const summary: Record<PaletteStatus, number> = {
    ANSWERED: 0,
    NOT_ANSWERED: 0,
    MARKED_FOR_REVIEW: 0,
    ANSWERED_AND_MARKED_FOR_REVIEW: 0,
    NOT_VISITED: 0,
  };

  questions.forEach((q) => {
    const status = getQuestionPaletteStatus(answers[q.id]);
    summary[status]++;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Final Submission</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to end and submit your examination?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Table */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-3 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
            <span>Total Questions</span>
            <span>{questions.length}</span>
          </div>
          <div className="divide-y divide-slate-200/60">
            <div className="p-2.5 px-3 flex justify-between items-center text-emerald-700">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" /> Answered
              </span>
              <span className="font-bold">{summary.ANSWERED}</span>
            </div>

            <div className="p-2.5 px-3 flex justify-between items-center text-amber-700">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600" /> Not Answered
              </span>
              <span className="font-bold">{summary.NOT_ANSWERED}</span>
            </div>

            <div className="p-2.5 px-3 flex justify-between items-center text-purple-700">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600" /> Marked for Review
              </span>
              <span className="font-bold">
                {summary.MARKED_FOR_REVIEW + summary.ANSWERED_AND_MARKED_FOR_REVIEW}
              </span>
            </div>

            <div className="p-2.5 px-3 flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300" /> Not Visited
              </span>
              <span className="font-bold">{summary.NOT_VISITED}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Once submitted, you cannot change your answers. Your responses will be deterministically scored immediately.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Return to Test
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmSubmit}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Yes, Submit Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
