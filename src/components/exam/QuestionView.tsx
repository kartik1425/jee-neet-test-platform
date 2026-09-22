"use client";

import React from "react";
import { LatexRenderer } from "@/components/LatexRenderer";
import { StudentExamQuestion } from "@/types/exam";
import { Check, RotateCcw, AlertCircle } from "lucide-react";

interface QuestionViewProps {
  question: StudentExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onClearOption: () => void;
  fontSize?: "sm" | "base" | "lg";
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  onClearOption,
  fontSize = "base",
}: QuestionViewProps) {
  const getTextSizeClass = () => {
    switch (fontSize) {
      case "sm":
        return "text-xs sm:text-sm";
      case "lg":
        return "text-base sm:text-lg";
      default:
        return "text-sm sm:text-base";
    }
  };

  const getOptionTextSizeClass = () => {
    switch (fontSize) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-sm sm:text-base";
      default:
        return "text-xs sm:text-sm";
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Question Header Bar */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-xs rounded-lg shadow-xs">
            Q {questionNumber} / {totalQuestions}
          </span>
          <span className="text-xs font-bold text-slate-700">
            {question.section_name || "General Section"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            +{question.marks} Correct
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
            {question.negative_marks} Negative
          </span>
        </div>
      </div>

      {/* Question Statement & Options Container */}
      <div className="flex-1 p-4 sm:p-7 overflow-y-auto space-y-6">
        {/* Question Statement with KaTeX */}
        <div className={`text-slate-900 font-medium leading-relaxed ${getTextSizeClass()}`}>
          <LatexRenderer content={question.content_latex} />
        </div>

        {/* 4 Single MCQ Options */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Select One Option:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 select-none ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : opt.option_key}
                  </div>

                  <div className={`flex-1 font-medium text-slate-800 leading-normal overflow-x-auto ${getOptionTextSizeClass()}`}>
                    <LatexRenderer content={opt.content_latex} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Option Actions */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Single Choice Objective (MCQ)</span>
        {selectedOptionId && (
          <button
            type="button"
            onClick={onClearOption}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-red-600 font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Selection</span>
          </button>
        )}
      </div>
    </div>
  );
}

