"use client";

import React from "react";
import { StudentExamQuestion, getQuestionPaletteStatus, PaletteStatus } from "@/types/exam";

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
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
}: QuestionPaletteProps) {
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

  return (
    <aside className="w-full lg:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4 select-none">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
        Question Palette
      </h3>

      {/* Palette Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            {summary.ANSWERED}
          </span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
            {summary.NOT_ANSWERED}
          </span>
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
            {summary.MARKED_FOR_REVIEW}
          </span>
          <span>Marked Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
            {summary.NOT_VISITED}
          </span>
          <span>Not Visited</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-200/60">
          <span className="w-5 h-5 rounded bg-purple-600 text-white relative flex items-center justify-center text-[10px] font-bold">
            {summary.ANSWERED_AND_MARKED_FOR_REVIEW}
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border border-white" />
          </span>
          <span>Answered & Marked Review</span>
        </div>
      </div>

      {/* Grid of Question Numbers */}
      <div className="flex-1 max-h-[350px] overflow-y-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const status = getQuestionPaletteStatus(answers[q.id]);
            const isCurrent = idx === currentIndex;

            let btnStyle = "bg-slate-200 text-slate-700 hover:bg-slate-300";

            if (status === "ANSWERED") {
              btnStyle = "bg-emerald-600 text-white shadow-sm";
            } else if (status === "NOT_ANSWERED") {
              btnStyle = "bg-amber-600 text-white shadow-sm";
            } else if (status === "MARKED_FOR_REVIEW") {
              btnStyle = "bg-purple-600 text-white shadow-sm";
            } else if (status === "ANSWERED_AND_MARKED_FOR_REVIEW") {
              btnStyle = "bg-purple-600 text-white shadow-sm";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`w-full aspect-square rounded-xl text-xs font-bold transition flex items-center justify-center relative ${btnStyle} ${
                  isCurrent ? "ring-2 ring-blue-600 ring-offset-2 scale-105" : ""
                }`}
              >
                {idx + 1}
                {status === "ANSWERED_AND_MARKED_FOR_REVIEW" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1 border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
