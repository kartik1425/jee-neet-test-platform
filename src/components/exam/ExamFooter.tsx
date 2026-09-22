"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Bookmark, CheckSquare, Send, Grid } from "lucide-react";

interface ExamFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onSaveAndNext: () => void;
  onMarkForReviewAndNext: () => void;
  onClearResponse: () => void;
  onSubmitClick: () => void;
  onToggleMobilePalette?: () => void;
}

export function ExamFooter({
  currentIndex,
  totalQuestions,
  onPrevious,
  onSaveAndNext,
  onMarkForReviewAndNext,
  onClearResponse,
  onSubmitClick,
  onToggleMobilePalette,
}: ExamFooterProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <footer className="bg-white border-t border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 select-none shadow-md z-20">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Palette Button */}
        {onToggleMobilePalette && (
          <button
            type="button"
            onClick={onToggleMobilePalette}
            className="lg:hidden inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            <span>Palette</span>
          </button>
        )}

        <button
          type="button"
          onClick={onMarkForReviewAndNext}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 transition cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mark for Review & Next</span>
          <span className="sm:hidden">Review</span>
        </button>

        <button
          type="button"
          onClick={onClearResponse}
          className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Right Navigation & Submit Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrevious}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          type="button"
          onClick={onSaveAndNext}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{isLast ? "Save & Review" : "Save & Next"}</span>
          {!isLast && <ChevronRight className="w-4 h-4 hidden sm:inline" />}
        </button>

        <button
          type="button"
          onClick={onSubmitClick}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm hover:shadow transition ml-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit</span>
        </button>
      </div>
    </footer>
  );
}

