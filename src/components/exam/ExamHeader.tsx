"use client";

import React from "react";
import { Clock, AlertTriangle, User } from "lucide-react";

interface ExamHeaderProps {
  testTitle: string;
  examType: string;
  remainingSeconds: number;
  sections: string[];
  activeSection: string;
  onSelectSection: (section: string) => void;
  candidateName: string;
}

export function ExamHeader({
  testTitle,
  examType,
  remainingSeconds,
  sections,
  activeSection,
  onSelectSection,
  candidateName,
}: ExamHeaderProps) {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;

  const isLowTime = remainingSeconds < 300; // less than 5 minutes

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      {/* Test Title & Candidate */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
              {examType}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {testTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3" /> Candidate: {candidateName}
          </p>
        </div>
      </div>

      {/* Sections Selector */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onSelectSection(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeSection === sec
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Countdown Timer */}
      <div
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold transition ${
          isLowTime
            ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
            : "bg-slate-800 border-slate-700 text-emerald-400"
        }`}
      >
        {isLowTime ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        <span>Time Left: {formattedTime}</span>
      </div>
    </header>
  );
}
