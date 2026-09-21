"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentActiveAttemptSummary } from "@/types/student";
import { AlertCircle, ArrowRight, Clock, PlayCircle } from "lucide-react";

interface ActiveAttemptBannerProps {
  activeAttempt: StudentActiveAttemptSummary;
}

export function ActiveAttemptBanner({ activeAttempt }: ActiveAttemptBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const endMs = new Date(activeAttempt.serverEndTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = Math.max(0, endMs - now);

      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeAttempt.serverEndTime]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              Active Exam In Progress
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {activeAttempt.testTitle}
            </h2>
            <p className="text-xs text-slate-600">
              {activeAttempt.examType.replace("_", " ")} • {activeAttempt.totalQuestions} Questions • {activeAttempt.durationMinutes} Minutes total
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-white/80 border border-amber-300 rounded-2xl p-3 px-5 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Time Remaining
            </span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-700">
              {timeLeft.isExpired
                ? "Time Expired"
                : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`}
            </span>
          </div>

          <Link
            href={`/exam/${activeAttempt.attemptId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/30 transition transform active:scale-95 w-full sm:w-auto"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Resume Exam</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
