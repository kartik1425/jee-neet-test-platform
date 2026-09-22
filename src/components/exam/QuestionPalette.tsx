"use client";

import React, { useState, useMemo } from "react";
import { StudentExamQuestion, getQuestionPaletteStatus, PaletteStatus } from "@/types/exam";
import { X, Filter, Grid } from "lucide-react";

interface QuestionPaletteProps {
  questions: StudentExamQuestion[];
  currentIndex: number;
  answers: Record<
    string,
    {
      selectedOptionId: string | null;
      isMarkedForReview: boolean;
      isVisited: boolean;
    }
  >;
  onSelectQuestion: (index: number) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
  isOpenMobile = false,
  onCloseMobile,
}: QuestionPaletteProps) {
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("ALL");

  // Sections
  const sections = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.section_name || "General")));
  }, [questions]);

  // Aggregate summary counts
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

  const content = (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4 select-none h-full overflow-hidden">
      {/* Header with Title and Mobile Close Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Question Palette
          </h3>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="sm:hidden p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Palette Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
            {summary.ANSWERED}
          </span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
            {summary.NOT_ANSWERED}
          </span>
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
            {summary.MARKED_FOR_REVIEW}
          </span>
          <span>Marked Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
            {summary.NOT_VISITED}
          </span>
          <span>Not Visited</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 pt-1.5 border-t border-slate-200">
          <span className="w-5 h-5 rounded-md bg-purple-600 text-white relative flex items-center justify-center text-[10px] font-black">
            {summary.ANSWERED_AND_MARKED_FOR_REVIEW}
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border border-white" />
          </span>
          <span>Answered & Marked Review</span>
        </div>
      </div>

      {/* Section Filter Pills if multiple sections */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSelectedSectionFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg transition ${
              selectedSectionFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSectionFilter(sec)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                selectedSectionFilter === sec
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Question Numbers */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[380px] sm:max-h-none">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            if (selectedSectionFilter !== "ALL" && (q.section_name || "General") !== selectedSectionFilter) {
              return null;
            }

            const status = getQuestionPaletteStatus(answers[q.id]);
            const isCurrent = idx === currentIndex;

            let btnStyle = "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80";

            if (status === "ANSWERED") {
              btnStyle = "bg-emerald-600 text-white shadow-xs border border-emerald-700";
            } else if (status === "NOT_ANSWERED") {
              btnStyle = "bg-amber-600 text-white shadow-xs border border-amber-700";
            } else if (status === "MARKED_FOR_REVIEW") {
              btnStyle = "bg-purple-600 text-white shadow-xs border border-purple-700";
            } else if (status === "ANSWERED_AND_MARKED_FOR_REVIEW") {
              btnStyle = "bg-purple-600 text-white shadow-xs border border-purple-700";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  onSelectQuestion(idx);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full aspect-square rounded-xl text-xs font-black transition flex items-center justify-center relative cursor-pointer ${btnStyle} ${
                  isCurrent ? "ring-2 ring-blue-600 ring-offset-2 scale-105 z-10" : ""
                }`}
              >
                {idx + 1}
                {status === "ANSWERED_AND_MARKED_FOR_REVIEW" && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-white shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View (Sidebar) */}
      <aside className="hidden lg:block w-80 shrink-0 h-full">{content}</aside>

      {/* Mobile Modal Drawer / Bottom Sheet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

