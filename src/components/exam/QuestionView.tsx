"use client";

import React from "react";
import { LatexRenderer } from "@/components/LatexRenderer";
import { StudentExamQuestion } from "@/types/exam";
import { Check, RotateCcw } from "lucide-react";

interface QuestionViewProps {
  question: StudentExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onClearOption: () => void;
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  onClearOption,
}: QuestionViewProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Question Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            Section: {question.section_name || "General"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            +{question.marks} Correct
          </span>
          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold border border-red-200">
            {question.negative_marks} Negative
          </span>
        </div>
      </div>

      {/* Question Content & Scroll Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
        {/* Question LaTeX Statement */}
        <div className="text-base text-slate-900 font-medium leading-relaxed">
          <LatexRenderer content={question.content_latex} />
        </div>

        {/* 4 Single MCQ Options */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Choose One Option:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-start sm:items-center gap-3.5 select-none ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                      : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : opt.option_key}
                  </div>

                  <div className="flex-1 text-sm font-medium text-slate-800 leading-normal overflow-x-auto">
                    <LatexRenderer content={opt.content_latex} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Option Actions */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500">Single Choice Objective (MCQ)</span>
        {selectedOptionId && (
          <button
            type="button"
            onClick={onClearOption}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}
