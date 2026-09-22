"use client";

import React from "react";
import { Clock, AlertTriangle, User, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ExamHeaderProps {
  testTitle: string;
  examType: string;
  remainingSeconds: number;
  sections: string[];
  activeSection: string;
  onSelectSection: (section: string) => void;
  candidateName: string;
  fontSize?: "sm" | "base" | "lg";
  onChangeFontSize?: (size: "sm" | "base" | "lg") => void;
  onToggleMobilePalette?: () => void;
}

export function ExamHeader({
  testTitle,
  examType,
  remainingSeconds,
  sections,
  activeSection,
  onSelectSection,
  candidateName,
  fontSize = "base",
  onChangeFontSize,
  onToggleMobilePalette,
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
    <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 select-none shadow-md z-30">
      {/* Test Title & Candidate */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            {examType.slice(0, 3)}
          </div>
          <div className="leading-tight">
            <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {testTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-slate-500" />
              <span>Candidate: <strong className="text-slate-300 font-semibold">{candidateName}</strong></span>
            </p>
          </div>
        </div>

        {/* Mobile Palette Toggle Trigger in header */}
        {onToggleMobilePalette && (
          <button
            type="button"
            onClick={onToggleMobilePalette}
            className="sm:hidden px-2.5 py-1 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 text-xs font-bold"
          >
            Palette
          </button>
        )}
      </div>

      {/* Center: Sections Selector Tabs */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onSelectSection(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeSection === sec
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Right: Font Controls & Authoritative Countdown Timer */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {/* Font Scaling Controls (TestOnGo style A- / A / A+) */}
        {onChangeFontSize && (
          <div className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Font:</span>
            <button
              type="button"
              onClick={() => onChangeFontSize("sm")}
              title="Small text size"
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                fontSize === "sm" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize("base")}
              title="Standard text size"
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                fontSize === "base" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize("lg")}
              title="Large text size"
              className={`px-2 py-0.5 rounded text-sm font-bold ${
                fontSize === "lg" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              A+
            </button>
          </div>
        )}

        {/* Server Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition ${
            isLowTime
              ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-sm shadow-red-500/20"
              : "bg-slate-800 border-slate-700 text-emerald-400"
          }`}
        >
          {isLowTime ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-emerald-400" />}
          <span>Time Left: {formattedTime}</span>
        </div>
      </div>
    </header>
  );
}

