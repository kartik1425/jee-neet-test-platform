"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Bookmark, CheckSquare, Send } from "lucide-react";

interface ExamFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onSaveAndNext: () => void;
  onMarkForReviewAndNext: () => void;
  onClearResponse: () => void;
  onSubmitClick: () => void;
}

export function ExamFooter({
  currentIndex,
  totalQuestions,
  onPrevious,
  onSaveAndNext,
  onMarkForReviewAndNext,
  onClearResponse,
  onSubmitClick,
}: ExamFooterProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onMarkForReviewAndNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs border border-purple-200 transition"
        >
          <Bookmark className="w-3.5 h-3.5" /> Mark for Review & Next
        </button>

        <button
          type="button"
          onClick={onClearResponse}
          className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition"
        >
          Clear Response
        </button>
      </div>

      {/* Right Navigation & Submit Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrevious}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-40 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          type="button"
          onClick={onSaveAndNext}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition"
        >
          <CheckSquare className="w-3.5 h-3.5" /> {isLast ? "Save & Review" : "Save & Next"}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onSubmitClick}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition ml-2"
        >
          <Send className="w-3.5 h-3.5" /> Submit Test
        </button>
      </div>
    </footer>
  );
}
